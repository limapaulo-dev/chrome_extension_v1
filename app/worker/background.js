chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
	switch (data.event) {
		case 'save':
			chrome.storage.sync.set(data.prefs);
			break;

		case 'export-data':
			chrome.notifications.create({
				type: 'basic',
				iconUrl: '../../assets/vwo/vwo-icon-256.png',
				title: 'Data Exported',
				message: 'Impersonator Data Exported successfully',
			});
			break;

		case 'import-data':
			importSyncData(data.data);
			chrome.notifications.create({
				type: 'basic',
				iconUrl: '../../assets/vwo/vwo-icon-256.png',
				title: 'Data Imported',
				message: 'Impersonator Data Imported successfully',
			});
			setTimeout(() => {
				chrome.runtime.reload();
			}, 200);
			break;

		case 'bookmarks-imported':
			chrome.notifications.create({
				type: 'basic',
				iconUrl: '../../assets/vwo/vwo-icon-256.png',
				title: 'Bookmarks Imported',
				message: 'All impersonate bookmarks have been imported',
			});
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
			chrome.notifications.create({
				type: 'basic',
				iconUrl: '../../assets/vwo/vwo-icon-256.png',
				title: 'Login Required',
				message: 'Please log in with your VWO account',
			});
			break;

		case 'account-not-new':
			chrome.notifications.create({
				type: 'basic',
				iconUrl: '../../assets/vwo/vwo-icon-256.png',
				title: 'Repeated Account ID',
				message: 'This Account ID is already present on the list',
			});
			break;

		default:
			break;
	}
});

const importSyncData = (jsonData) => {
	chrome.storage.sync.set(jsonData, () => {
		console.log('Sync storage data imported and overridden');
	});
};
