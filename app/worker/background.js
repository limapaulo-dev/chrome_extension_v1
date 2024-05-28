/* let data = {

    'prefs': {
        'recently_impersonated': [],
        'pinned-group': [],
        'list-group': []
    }

    'account': {
        'acc_id': #,
        'acc_name': 'string',
        'acc_class_order': 'account-#'
    }

}; */

chrome.runtime.onMessage.addListener((data) => {
	switch (data.event) {
		case 'save':
			chrome.storage.local.set(data.prefs);
			break;

		case 'load':

			break;

		default:
			break;
	}
});
