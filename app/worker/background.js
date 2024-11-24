chrome.runtime.onMessage.addListener((data) => {
	switch (data.event) {
		case 'save':
			chrome.storage.sync.set(data.prefs);
			break;

		case 'load':
			break;

		case 'login':
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
