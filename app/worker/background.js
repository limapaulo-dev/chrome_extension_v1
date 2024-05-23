/* let data = {

    'prefs': {
        'recently_impersonated': [],
        'pinned-group': [],
        'list-group': []
    }

}; */

chrome.runtime.onMessage.addListener((data) => {
	chrome.storage.local.set(data.prefs)
});
