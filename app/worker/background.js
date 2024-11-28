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
				.catch(() => {
					sendResponse({ loggedIn: false });
				});
			return true;
			break;

		case 'login-required':
			basicNotifications('Login Required', 'Please log in with your VWO account');
			break;

		case 'repeated-account-id':
			basicNotifications('Repeated Account ID', 'This Account ID is already on the list');
			break;

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
	chrome.storage.sync.set(jsonData, () => {
		console.log('Sync storage data imported and overridden');
	});
};
