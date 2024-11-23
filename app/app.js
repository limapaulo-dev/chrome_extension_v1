document.querySelector('#btn-impersonate').addEventListener('mouseover', function () {
	document.querySelector('#account-name').removeAttribute('required');
});

document.querySelector('#btn-impersonate').addEventListener('mouseout', function () {
	document.querySelector('#account-name').setAttribute('required', '');
});

document.querySelectorAll('.btn-impersonate').forEach((btn) => {
	btn_event_listener(btn);
});

document.getElementById('account-id').addEventListener('input', (event) => {
	event.target.value = event.target.value.replace(/[^\d]/g, '');
});

document.getElementById('filter-list-input').addEventListener('keyup', function () {
	let filterValue = this.value.toLowerCase().trim();
	let filterWords = filterValue.split(/\s+/);
	let items = document.querySelectorAll('li');

	items.forEach((item) => {
		let itemText = item.textContent.toLowerCase();
		let isMatch = filterWords.every((word) => itemText.includes(word));

		if (isMatch) {
			item.classList.remove('hidden');
		} else {
			item.classList.add('hidden');
		}
	});
	push_data();
});

document.querySelectorAll('.dropdown').forEach((dropdown) => {
	dropdown.addEventListener('click', function () {
		let parent = this.parentElement;
		let gran_parent = parent.parentElement;

		let thisList = gran_parent.querySelectorAll('.lists-groups, .last-impersonated-groups');

		thisList.forEach((list) => {
			if ((list.style.display === 'block' || list.style.display === '') && list.children.length > 0) {
				this.classList.add('up');
				list.style.display = 'none';
			} else {
				this.classList.remove('up');
				list.style.display = 'block';
			}
		});
		push_data();
	});
});

document.querySelector('.form-set-account').addEventListener('submit', function (event) {
	event.preventDefault();

	let account_id = document.querySelector('#account-id');
	let account_name = document.querySelector('#account-name');

	account_id = account_id.value.trim();
	account_name = account_name.value.trim();

	let list = document.querySelector('.accounts-list-group');
	let type = 'main-list';

	if (event.submitter.id == 'btn-impersonate') {
		list = document.querySelector('.last-impersonated-group');
		type = 'last-impersonated';
	}

	createAcc(type, list, account_id, account_name);

	if (event.submitter.id == 'btn-impersonate') {
		impersonate(account_id, list);
	}
});

const last_used_cycle = (list) => {
	if (list.children.length > 4) {
		let first_born = list.lastElementChild;
		list.removeChild(first_born);
		sort_accounts(list);
	}
};

const impersonate = async (account_id, list) => {
    if (typeof account_id !== 'string') {
        account_id = account_id.innerHTML;
    }

    const baseUrl = 'https://app.vwo.com';
    const loggedInUrl = `${baseUrl}/access?accountId=${account_id}`;
    const ssoUrl = `${baseUrl}/#/sso`;

    try {
        // Check the response from loggedInUrl
        const response = await fetch(loggedInUrl, { method: 'GET', credentials: 'include' });

        // Determine the URL based on the response status
        const impersonator_URL = response.status === 401 ? ssoUrl : loggedInUrl;

        // Find and update/create the appropriate tab
        chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }, (tabs) => {
            let foundTab = false;

            tabs.forEach((tab) => {
                if (tab.url.includes(baseUrl) && !foundTab) {
                    foundTab = true;
                    chrome.tabs.update(tab.id, { url: impersonator_URL, active: true });
                }
            });

            if (!foundTab) {
                chrome.tabs.create({ url: impersonator_URL });
            }
        });
    } catch (error) {
        chrome.tabs.create({ url: ssoUrl });
    }
};

/* const impersonate = (account_id, list) => {
	if (typeof account_id !== 'string') {
		account_id = account_id.innerHTML;
	}

	const baseUrl = 'https://app.vwo.com';
	const loggedInUrl = `${baseUrl}/access?accountId=${account_id}`;
	const ssoUrl = `${baseUrl}/#/sso`;

	chrome.cookies.get({ url: baseUrl, name: 'vwo_logged_in' }, (cookie) => {
		const impersonator_URL = cookie ? loggedInUrl : ssoUrl;

		chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }, (tabs) => {
			let foundTab = false;

			tabs.forEach((tab) => {
				if (tab.url.includes(baseUrl) && !foundTab) {
					foundTab = true;
					chrome.tabs.update(tab.id, { url: impersonator_URL, active: true });
				}
			});

			if (!foundTab) {
				chrome.tabs.create({ url: impersonator_URL });
			}
		});
	});
}; */

const impersonate_event = (btn) => {
	btn.addEventListener('click', function (event) {
		let account = this.parentElement;
		let account_id = account.querySelector('.list-id');
		let account_name = account.querySelector('.list-name');

		account_id = account_id.innerHTML.trim();
		account_name = account_name.innerHTML.trim();

		list = document.querySelector('.last-impersonated-group');
		type = 'last-impersonated';

		createAcc(type, list, account_id, account_name);

		impersonate(account_id, list);
		push_data();
	});
};

const delete_event = (btn) => {
	btn.addEventListener('click', () => {
		btn.parentElement.remove();
		sort_account_list();
		push_data();
	});
};

const sort_last_impersonated_list = () => {
	let ul = document.querySelector('.last-impersonated-group');
	const liArray = Array.from(ul.children);

	liArray.reverse();

	liArray.forEach((li) => ul.appendChild(li));
};

const sort_accounts = (list) => {
	let liArray = Array.from(list.querySelectorAll('li'));

	liArray.sort(function (a, b) {
		const numA = parseInt(a.className.match(/account-(\d+)/)[1]);
		const numB = parseInt(b.className.match(/account-(\d+)/)[1]);
		return numB - numA;
	});

	liArray.forEach((li, index) => {
		li.className = li.className.replace(/account-\d+/, `account-${liArray.length - index}`);
		list.appendChild(li);
	});
};

const sort_account_list = () => {
	let ul = document.querySelector('.accounts-list-group');
	let liArray = Array.from(ul.querySelectorAll('li'));

	liArray.sort(function (a, b) {
		const numA = parseInt(a.className.match(/account-(\d+)/)[1]);
		const numB = parseInt(b.className.match(/account-(\d+)/)[1]);
		return numB - numA;
	});

	liArray.forEach((li, index) => {
		li.className = li.className.replace(/account-\d+/, `account-${liArray.length - index}`);
		ul.appendChild(li);
	});
};

const pin_event = (btn) => {
	btn.addEventListener('click', () => {
		let li = btn.parentElement;
		let ul_main = document.querySelector('.accounts-list-group');
		let ul_pinned = document.querySelector('.accounts-pinned-group');

		if (btn.classList.contains('pinned-down')) {
			li.classList.remove('pinned-down');
			btn.classList.remove('pinned-down');
			ul_main.appendChild(li);
		} else {
			li.classList.add('pinned-down');
			btn.classList.add('pinned-down');
			ul_pinned.appendChild(li);
		}
		sort_account_list();
		push_data();
	});
};

const is_account_new = (type, account_id) => {
	let is_account_new = true;

	let list = document.querySelectorAll('.accounts-list li');

	if (type == 'last-impersonated') {
		list = document.querySelectorAll('.last-impersonated li');
	}

	list.forEach((li) => {
		let list_account = li.querySelector('.account-id').textContent;
		if (list_account == account_id) is_account_new = false;
	});

	return is_account_new;
};

const account_exists_filter = (type, account_id) => {
	if (type == 'last-impersonated') {
		return;
	}

	const filterInput = document.querySelector('#filter-list-input');
	if (filterInput) {
		filterInput.value = account_id;

		const keyupEvent = new KeyboardEvent('keyup', { bubbles: true, cancelable: true });
		filterInput.dispatchEvent(keyupEvent);
	}
};

const createFeatures = (type, new_account) => {
	let btn_impersonate = document.createElement('button');
	btn_impersonate.textContent = '🎭';
	impersonate_event(btn_impersonate);
	btn_impersonate.classList.add('btn-impersonate');

	if (type == 'main-list') {
		let btn_delete = document.createElement('button');
		btn_delete.textContent = '🗑';
		btn_delete.classList.add('btn-delete');
		delete_event(btn_delete);
		new_account.appendChild(btn_delete);

		let btn_pin = document.createElement('button');
		btn_pin.textContent = '📌';
		btn_pin.classList.add('btn-pin');
		pin_event(btn_pin);
		new_account.appendChild(btn_pin);
	}

	new_account.appendChild(btn_impersonate);
};

const createAcc = (type, list, account_id, account_name) => {
	if (!is_account_new(type, account_id)) {
		account_exists_filter(type, account_id);
		return;
	}

	let new_account = document.createElement('li');
	let new_account_id = document.createElement('p');
	let new_account_name = document.createElement('p');

	if (type == 'last-impersonated') {
		last_used_cycle(list);
		new_account.classList.add(`account-${list.children.length + 1}`);
	} else {
		let pinned_len = document.querySelector('.accounts-pinned-group').children.length;
		new_account.classList.add(`account-${list.children.length + pinned_len + 1}`);
	}

	new_account_id.textContent = account_id;
	new_account_id.classList.add('account-id', 'list-id');
	new_account.appendChild(new_account_id);

	new_account_name.textContent = account_name;
	new_account_name.classList.add('account-name', 'list-name', 'full');
	new_account.appendChild(new_account_name);

	createFeatures(type, new_account);

	list.appendChild(new_account);

	sort_accounts(list);
	push_data();
};

const push_list = (list) => {
	const arr = [];

	list.forEach((li) => {
		let account = {
			acc_id: li.querySelector('.account-id').innerHTML,
			acc_name: li.querySelector('.account-name').innerHTML || '',
			acc_class_order: li.classList.value,
		};

		arr.push(account);
	});

	return arr;
};

const pull_account = (li, ul) => {
	let type = 'main-list';

	if (ul.classList.contains('last-impersonated-group')) {
		type = 'last-impersonated';
	}

	let account = document.createElement('li');
	let account_id = document.createElement('p');
	let account_name = document.createElement('p');

	account.classList.add(...li.acc_class_order.split(' '));

	account_id.textContent = li.acc_id;
	account_id.classList.add('account-id', 'list-id');
	account.appendChild(account_id);

	account_name.textContent = li.acc_name;
	account_name.classList.add('account-name', 'list-name', 'full');
	account.appendChild(account_name);

	createFeatures(type, account);

	if (ul.classList.contains('accounts-pinned-group')) {
		account.querySelector('.btn-pin').classList.add('pinned-down');
	}

	ul.appendChild(account);
};

const push_data = () => {
	const id_input = document.querySelector('#account-id').value;
	const name_input = document.querySelector('#account-name').value;
	const filter_input = document.querySelector('#filter-list-input').value;

	const last_impersonated = document.querySelectorAll('.last-impersonated-group li');
	const pinned_group = document.querySelectorAll('.accounts-pinned-group li');
	const list_group = document.querySelectorAll('.accounts-list-group li');

	const last_impersonated_dropdown = document
		.querySelector('.last-impersonated button.dropdown')
		.classList.contains('up');
	const list_group_dropdown = document.querySelector('.accounts-list button.dropdown').classList.contains('up');

	const prefs = {
		popup: {
			id_input: id_input,
			name_input: name_input,

			last_impersonated: push_list(last_impersonated),
			pinned_group: push_list(pinned_group),
			list_group: push_list(list_group),

			last_impersonated_dropdown: last_impersonated_dropdown,
			list_group_dropdown: list_group_dropdown,

			filter_input: filter_input,
		},
	};
	chrome.runtime.sendMessage({ event: 'save', prefs });
	logLocalStorageDetails();
};

const formatBytes = (bytes) => {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const logLocalStorageDetails = () => {
	chrome.storage.sync.getBytesInUse(null, function (bytesInUse) {
		console.log('Sync Storage Size: ' + formatBytes(bytesInUse));
	});

	chrome.storage.sync.get(null, function (items) {
		console.log('Sync Storage Contents:', items);

		for (let key in items) {
			if (items[key] === null || items[key] === undefined) {
				console.warn('Corrupted element found:', key, items[key]);
			}
		}
	});
};

chrome.storage.sync.get('popup', (result) => {
	if (result.popup) {
		const { popup } = result;

		document.querySelector('#account-id').value = popup.id_input;
		document.querySelector('#account-name').value = popup.name_input;

		document.querySelector('#filter-list-input').value = popup.filter_input;

		const last_impersonated_ul = document.querySelector('.last-impersonated-group');
		const pinned_group_ul = document.querySelector('.accounts-pinned-group');
		const list_group_ul = document.querySelector('.accounts-list-group');

		popup.last_impersonated.forEach((li) => {
			pull_account(li, last_impersonated_ul);
		});
		popup.pinned_group.forEach((li) => {
			pull_account(li, pinned_group_ul);
		});
		popup.list_group.forEach((li) => {
			pull_account(li, list_group_ul);
		});

		if (popup.recently_impersonated_dropdown == true) {
			document.querySelector('.last-impersonated button.dropdown').classList.add('up');
			document.querySelector('.last-impersonated-group').style.display = 'none';
		}

		if (popup.list_group_dropdown == true) {
			document.querySelector('.accounts-list button.dropdown').classList.add('up');

			document.querySelectorAll('.lists-groups ul').forEach((ul) => {
				ul.style.display = 'none';
			});
		}
		push_data();
	}
});

const traverseBookmarks = (bookmarks) => {
	const regex = /accountId\s*=\s*(\d+);/;

	bookmarks.forEach((bookmark) => {
		if (bookmark.url && regex.test(decodeURIComponent(bookmark.url))) {
			let list_group_ul = document.querySelector('.accounts-list-group');
			let account_id = decodeURIComponent(bookmark.url).match(regex)[1];
			createAcc('main-list', list_group_ul, account_id, bookmark.title);
		}
		if (bookmark.children) {
			traverseBookmarks(bookmark.children);
		}
	});
};

chrome.storage.sync.get('bookmarks_import', (result) => {
	if (!result.bookmarks_import) {
		result.bookmarks_import = {};
	}
	if (!result.bookmarks_import.bookmarks_imported) {
		chrome.bookmarks.getTree((bookmarkTreeNodes) => {
			traverseBookmarks(bookmarkTreeNodes);
			result.bookmarks_import.bookmarks_imported = true;
			chrome.storage.sync.set({ bookmarks_import: result.bookmarks_import }, () => {});
		});
	}
});

window.addEventListener('blur', () => {
	push_data();
});
