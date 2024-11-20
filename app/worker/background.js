chrome.runtime.onMessage.addListener((data) => {
	switch (data.event) {
		case 'save':
			chrome.storage.sync.set(data.prefs);
			break;

		case 'load':
			break;

		default:
			break;
	}
});
