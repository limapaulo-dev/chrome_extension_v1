chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
	switch (data.event) {
		case 'save':
			chrome.storage.sync.set(data.prefs);
			break;

		case 'load':
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

		default:
			break;
	}
});
