//background messages listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	switch (message.event) {
		case 'save':
			chrome.storage.sync.set(message.prefs);
			break;

		case 'export-data':
			basicNotifications('Data Exported', 'Impersonator data exported successfully');
			break;

		case 'import-data':
			importSyncData(message.data);
			basicNotifications('Data Imported', 'Impersonator data imported successfully');
			setTimeout(() => {
				chrome.runtime.reload();
			}, 200);
			break;

		case 'bookmarks-imported':
			basicNotifications('Bookmarks Imported', 'Impersonate bookmarks imported successfully');
			break;

		case 'login-check':
			fetch(message.url, {})
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
			sfAccountSearch(message.tabId, idSelector, nameSelector);
			break;
		}

		case 'sf-account': {
			const idSelector = 'lightning-formatted-number';
			const nameSelector = 'lightning-formatted-text';
			sfAccountSearch(message.tabId, idSelector, nameSelector);
			break;
		}

		case 'sf-opp': {
			const idSelector = 'lightning-formatted-number';
			const nameSelector = 'records-highlights-details-item a[href*="Account"]';
			sfAccountSearch(message.tabId, idSelector, nameSelector);
			break;
		}

		case 'web-acc': {
			websiteAccSearch(message.activeTabURL, message.tabId);
			break;
		}

		default:
			break;
	}
});

//basic notifications
const basicNotifications = (title, message) => {
	chrome.notifications.create({
		type: 'basic',
		iconUrl: '../../assets/vwo/vwo-icon-256.png',
		title: title,
		message: message,
	});
};

//import json obj
const importSyncData = (jsonData) => {
	chrome.storage.sync.set(jsonData, () => {});
};

//selector for Acc ID and Name on Salesforce
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

//find Acc data on SF
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
					reject(chrome.runtime.lastError);
				} else if (results && results[0]?.result) {
					resolve(results[0].result);
				} else {
					resolve([]);
				}
			}
		);
	});
};

//selector for Acc ID and Name on Salesforce
const websiteAccSearch = async (activeTabURL, tabId) => {
	const accId = await findGlobalAccId(tabId);
	const accName = activeTabURL.replace(/^https?:\/\/(www\.)?|\/.*$/g, '');

	if (accId && accId.length > 0) {
		chrome.runtime.sendMessage({
			action: 'account-found',
			data: {
				accId: accId,
				accName: accName,
			},
		});
	}
};

//find Acc data on website
const findGlobalAccId = (tabId) => {
	return new Promise((resolve, reject) => {
		chrome.scripting.executeScript(
			{
				target: { tabId: tabId },
				func: () => {
					return window._vwo_acc_id || null;
				},
			},
			(results) => {
				if (chrome.runtime.lastError) {
					reject(chrome.runtime.lastError);
				} else if (results && results[0]?.result) {
					resolve(results[0].result);
				} else {
					resolve([]);
				}
			}
		);
	});
};
