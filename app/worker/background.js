chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
	switch (data.event) {
		case 'save':
			chrome.storage.sync.set(data.prefs);
			break;

		case 'export-data':
			basicNotifications('Data Exported', 'Impersonator data exported successfully');
			break;

		case 'import-data':
			importSyncData(data.data);
			basicNotifications('Data Imported', 'Impersonator data imported successfully');
			setTimeout(() => {
				chrome.runtime.reload();
			}, 200);
			break;

		case 'bookmarks-imported':
			basicNotifications('Bookmarks Imported', 'Impersonate bookmarks imported successfully');
			break;

		case 'login-check':
			fetch(data.url, {})
				.then((response) => {
					sendResponse({ loggedIn: response.ok });
				})
				.catch((error) => {
					if ((error instanceof TypeError && error.message === 'Failed to fetch') || !navigator.onLine) {
						sendResponse({ offline: true });
					} else {
						sendResponse({ loggedIn: false });
					}
				});
			return true;

		case 'login-required':
			basicNotifications('Login Required', 'Please log in with your VWO account');
			break;

		case 'offline-error':
			basicNotifications('Network Issue', 'The VWO app or your internet connection appears to be offline.');
			break;

		case 'repeated-account-id':
			basicNotifications('Repeated Account ID', 'This Account ID is already on the list');
			break;

		case 'sf-case': {
			const idSelector = 'lightning-formatted-number';
			const nameSelector = 'a[href*="Lead"]';
			sfAccountSearch(data.tabId, idSelector, nameSelector);
			break;
		}

		case 'sf-account': {
			const idSelector = 'lightning-formatted-number';
			const nameSelector = 'lightning-formatted-text';
			sfAccountSearch(data.tabId, idSelector, nameSelector);
			break;
		}

		case 'sf-opp': {
			const idSelector = 'lightning-formatted-number';
			const nameSelector = 'records-highlights-details-item a[href*="Account"]';
			sfAccountSearch(data.tabId, idSelector, nameSelector);
			break;
		}

		default:
			break;
	}
});

const basicNotifications = (title, message) => {
	chrome.notifications.create({
		type: 'basic',
		iconUrl: '../../assets/vwo/vwo-icon-256.png',
		title: title,
		message: message,
	});
};

const importSyncData = (jsonData) => {
	chrome.storage.sync.set(jsonData, () => {});
};

//look for a Acc ID and Name on Salesforce
const sfAccountSearch = async (tabId, idSelector, nameSelector) => {
	const idOBJ = await findShadowElement(tabId, idSelector);
	const nameOBJ = await findShadowElement(tabId, nameSelector);

	if (idOBJ && idOBJ.length > 0 && nameOBJ && nameOBJ.length > 0) {
		chrome.runtime.sendMessage({
			action: 'account-found',
			data: {
				accId: idOBJ[0],
				accName: nameOBJ[0],
			},
		});
	}
};

//traverse shadow DOM
const traverseShadowDom = (selector) => {
	const elements = [];

	const traverse = (node) => {
		if (!node) return;

		if (node.matches && node.matches(selector)) {
			elements.push(node);
		}

		if (node.shadowRoot) {
			traverse(node.shadowRoot.firstElementChild);
		}

		let child = node.firstElementChild;
		while (child) {
			traverse(child);
			child = child.nextElementSibling;
		}
	};

	traverse(document.body);
	return elements;
};

//inject Script
const findShadowElement = (tabId, selector) => {
	return new Promise((resolve, reject) => {
		chrome.scripting.executeScript(
			{
				target: { tabId },
				func: (selector) => {
					const traverseShadowDom = (selector) => {
						const elements = [];

						const isVisible = (element) => {
							const rect = element.getBoundingClientRect();
							const hasVisibleDimensions = rect.width > 0 && rect.height > 0;
							const isInViewport =
								rect.top >= 0 &&
								rect.left >= 0 &&
								rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
								rect.right <= (window.innerWidth || document.documentElement.clientWidth);

							return hasVisibleDimensions && isInViewport && element.offsetParent !== null; // Ensure it's rendered and in the DOM.
						};

						const traverse = (node) => {
							if (!node) return;

							if (node.matches && node.matches(selector) && isVisible(node)) {
								elements.push(node.textContent.trim());
							}

							if (node.shadowRoot) {
								traverse(node.shadowRoot.firstElementChild);
							}

							let child = node.firstElementChild;
							while (child) {
								traverse(child);
								child = child.nextElementSibling;
							}
						};

						traverse(document.body);
						return elements;
					};

					return traverseShadowDom(selector);
				},
				args: [selector],
			},
			(results) => {
				if (chrome.runtime.lastError) {
					console.log('Error executing script:', chrome.runtime.lastError.message);
					reject(chrome.runtime.lastError);
				} else if (results && results[0]?.result) {
					console.log('Matched elements:', results[0].result);
					resolve(results[0].result);
				} else {
					console.log('No elements found.');
					resolve([]);
				}
			}
		);
	});
};
