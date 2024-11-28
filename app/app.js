/* --- Main Section --- */
//btn-impersonate set form requirement
document.getElementById('btn-impersonate').addEventListener('mouseover', function () {
	document.querySelector('#account-name').removeAttribute('required');
});
document.getElementById('btn-impersonate').addEventListener('mouseout', function () {
	document.querySelector('#account-name').setAttribute('required', '');
});

//account-id input mask
document.getElementById('account-id').addEventListener('input', (event) => {
	event.target.value = event.target.value.replace(/^0+/, '').replace(/[^\d]/g, '');
});

//filter input
document.getElementById('filter-list-input').addEventListener('keyup', function () {
	let filterValue = this.value.toLowerCase().trim();
	let filterWords = filterValue.split(/\s+/);
	let items = document.querySelectorAll('.main-section li');

	items.forEach((item) => {
		let itemText = item.textContent.toLowerCase();
		let match = filterWords.every((word) => itemText.includes(word));

		if (match) {
			item.classList.remove('hidden');
		} else {
			item.classList.add('hidden');
		}
	});
	push_data();
});

//dropdown functionality
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

//impersonate and save accounts form
document.querySelector('.form-set-account').addEventListener('submit', async (event) => {
	event.preventDefault();

	const account_id = document.querySelector('#account-id').value.trim();
	const account_name = document.querySelector('#account-name').value.trim();

	const isImpersonate = event.submitter.id === 'btn-impersonate';
	const list = document.querySelector(isImpersonate ? '.last-impersonated-group' : '.accounts-list-group');

	const accountData = {
		list,
		account_id,
		account_name,
	};

	if (isImpersonate && !(await impersonate(account_id))) {
		return;
	}

	const type = list.classList.contains('last-impersonated-group') ? 'last-impersonated' : 'accounts-list';

	if (!is_account_new(type, account_id)) {
		account_exists_filter(type, account_id);
		chrome.runtime.sendMessage({ event: 'repeated-account-id' });
		return;
	}

	createAcc(accountData);
	push_data();
});

// last 5 impersonated accounts cycling
const last_used_cycle = (list) => {
	if (list.children.length > 4) {
		let first_born = list.lastElementChild;
		list.removeChild(first_born);
		sort_accounts(list);
	}
};

// check if a vwo tab is opened on the active browser window
const check_tabs = (baseUrl, finalUrl) => {
	chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }, (tabs) => {
		let foundTab = false;

		tabs.forEach((tab) => {
			if (tab.url.includes(baseUrl) && !foundTab) {
				foundTab = true;
				chrome.tabs.update(tab.id, { url: finalUrl, active: true });
			}
		});

		if (!foundTab) {
			chrome.tabs.create({ url: finalUrl });
		}
	});
};

// impersonate function
const impersonate = (account_id) => {
	return new Promise((resolve) => {
		const baseUrl = 'https://app.vwo.com';
		const loggedInUrl = `${baseUrl}/access?accountId=${account_id}`;
		const ssoUrl = `${baseUrl}/#/sso`;

		chrome.runtime.sendMessage({ event: 'login-check', url: loggedInUrl }, (response) => {
			const impersonator_URL = response?.loggedIn ? loggedInUrl : ssoUrl;

			if (!response?.loggedIn) {
				chrome.runtime.sendMessage({ event: 'login-required' });
			}

			check_tabs(baseUrl, impersonator_URL);
			resolve(response?.loggedIn || false);
		});
	});
};

//impersonate accounts event listener
const impersonate_event = (btn) => {
	btn.addEventListener('click', async (event) => {
		const account = event.target.parentElement;
		const account_id = account.querySelector('.list-id').innerHTML.trim();
		const account_name = account.querySelector('.list-name').innerHTML.trim();

		const list = document.querySelector('.last-impersonated-group');

		if (!(await impersonate(account_id))) {
			return;
		}

		const accountData = {
			list: list,
			account_id: account_id,
			account_name: account_name,
		};

		createAcc(accountData);
		push_data();
	});
};

//delete accounts event listener
const delete_event = (btn) => {
	btn.addEventListener('click', () => {
		btn.parentElement.remove();
		let acc_list = document.querySelector('.accounts-list-group');
		sort_accounts(acc_list);
		push_data();
	});
};

//pin accounts event listener
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
		let acc_list = document.querySelector('.accounts-list-group');
		sort_accounts(acc_list);
		push_data();
	});
};

//sort lists
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

//check if account is new
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

//filter list if accounts is not new
const account_exists_filter = (type, account_id) => {
	if (type === 'last-impersonated') {
		return;
	}

	const filterInput = document.querySelector('#filter-list-input');
	if (filterInput) {
		filterInput.value = account_id;

		const keyupEvent = new KeyboardEvent('keyup', {
			bubbles: true,
			cancelable: true,
		});
		filterInput.dispatchEvent(keyupEvent);
	}
};

//function to create features of each account
const createFeatures = (type, new_account) => {
	let btn_impersonate = document.createElement('button');
	btn_impersonate.textContent = '🎭';
	impersonate_event(btn_impersonate);
	btn_impersonate.classList.add('btn-impersonate');

	if (type !== 'last-impersonated') {
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

//function to create new accounts
const createAcc = ({ list, account_id, account_name }) => {
	const type = list.classList.contains('last-impersonated-group') ? 'last-impersonated' : 'accounts-list';

	if (!is_account_new(type, account_id)) {
		return;
	}

	let new_account = document.createElement('li');
	let new_account_id = document.createElement('p');
	let new_account_name = document.createElement('p');

	if (type === 'last-impersonated') {
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

//push accounts list to storage
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

//push all data to sync storage
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
};

//return storage data in readable format
const formatBytes = (bytes) => {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

//log  storage data for debug purpose
const logSyncStorageDetails = () => {
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

//pull accounts list from sync storage
const pull_account = (li, ul) => {
	let type = 'accounts-list-group';

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

//pull data from sync storage
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

		if (popup.last_impersonated_dropdown == true) {
			document.querySelector('.last-impersonated button.dropdown').classList.add('up');
			document.querySelector('.last-impersonated-groups').style.display = 'none';
		}

		if (popup.list_group_dropdown == true) {
			document.querySelector('.accounts-list button.dropdown').classList.add('up');
			document.querySelector('.lists-groups').style.display = 'none';
		}
	}
});

window.addEventListener('blur', () => {
	push_data();
});

/* --- Settings Modal Section --- */

//open settings
document.getElementById('btn-info').addEventListener('click', () => {
	const modal = document.getElementById('settings-modal');
	const mainSection = document.querySelector('.main-section');

	const { top, left, width, height } = mainSection.getBoundingClientRect();

	modal.style.top = `${top}px`;
	modal.style.left = `${left}px`;
	modal.style.width = `${width}px`;

	updateAccountInfo();

	modal.classList.remove('hidden');
	document.querySelector('body').style.height = '265px';
	document.querySelector('.main-section').classList.add('hidden');
});

//close settings
document.getElementById('btn-close').addEventListener('click', () => {
	const modal = document.getElementById('settings-modal');
	modal.classList.add('hidden');
	document.querySelector('body').style.height = 'auto';
	document.querySelector('.main-section').classList.remove('hidden');
});

//export impersonator data
document.getElementById('btn-export').addEventListener('click', async () => {
	chrome.storage.sync.get(null, (items) => {
		const jsonData = JSON.stringify(items, null, 2);
		const blob = new Blob([jsonData], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = 'sync-data.json'; // File name
		anchor.style.display = 'none';
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
		URL.revokeObjectURL(url);
	});
	setTimeout(() => {
		chrome.runtime.sendMessage({ event: 'export-data' });
	}, 200);
});

//import impersonator data
document.getElementById('btn-import').addEventListener('click', () => {
	const fileInput = document.createElement('input');
	fileInput.type = 'file';

	fileInput.click();

	fileInput.addEventListener('change', () => {
		const file = fileInput.files[0];
		if (file) {
			const reader = new FileReader();

			reader.onload = () => {
				const jsonData = JSON.parse(reader.result);
				chrome.runtime.sendMessage({ event: 'import-data', data: jsonData });
			};
			reader.readAsText(file);
		}
	});
});

//import bookmarks
document.getElementById('btn-bookmarks').addEventListener('click', () => {
	chrome.bookmarks.getTree(async (bookmarks) => {
		traverseBookmarks(bookmarks);
	});

	setTimeout(() => {
		updateAccountInfo();
		chrome.runtime.sendMessage({ event: 'bookmarks-imported' });
	}, 125);
});

// Update Account List Number and Size
const updateAccountInfo = () => {
	const accountList = document.querySelector('.accounts-list');
	const numAccounts = accountList ? accountList.querySelectorAll('li').length : 0;

	const accNumElement = document.querySelector('.acc-num');
	if (accNumElement) {
		accNumElement.textContent = `${numAccounts} 👤`;
	}

	chrome.storage.sync.getBytesInUse(null, (bytesInUse) => {
		const accByteElement = document.querySelector('.acc-byte');
		if (accByteElement) {
			accByteElement.textContent = `${formatBytes(bytesInUse)} 🔋`;
		}
	});
};

// Traverse Bookmarks
const traverseBookmarks = (bookmarks) => {
	const regex = /accountId\s*=\s*(\d+);/;

	bookmarks.forEach((bookmark) => {
		if (bookmark.url && regex.test(decodeURIComponent(bookmark.url))) {
			let account_id = decodeURIComponent(bookmark.url).match(regex)[1];
			let list_group_ul = document.querySelector('.accounts-list-group');

			const accountData = {
				list: list_group_ul,
				account_id,
				account_name: bookmark.title,
			};
			createAcc(accountData);
		}

		if (bookmark.children) {
			traverseBookmarks(bookmark.children);
		}
	});
};
