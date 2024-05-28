const btn_impersonate = document.querySelector('#btn-impersonate');

btn_impersonate.addEventListener('mouseover', function () {
	document.querySelector('#account-name').removeAttribute('required');
});

btn_impersonate.addEventListener('mouseout', function () {
	document.querySelector('#account-name').setAttribute('required', '');
});

document.querySelectorAll('.btn-impersonate').forEach((btn) => {
	btn_event_listener(btn);
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

		let thisList = gran_parent.querySelectorAll('ul');

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
		list = document.querySelector('.last-used-group');
		type = 'recent-used';
	}

	createAcc(type, list, account_id, account_name);
	document.querySelector('#account-id').value = '';
	document.querySelector('#account-name').value = '';

	if (event.submitter.id == 'btn-impersonate') {
		impersonate(account_id, list);
	}
});

const last_used_cycle = (list) => {
	if (list.children.length > 5) {
		let first_born = list.firstElementChild;
		list.removeChild(first_born);
	}
};

const impersonate = (account_id, list) => {
	if (typeof account_id !== 'string') {
		account_id = account_id.innerHTML;
	}

	let impersonator_URL = `https://app.vwo.com/access?accountId=${account_id}`;

	chrome.tabs.query({}, (tabs) => {
		let foundTab = false;
		tabs.forEach((tab) => {
			if (tab.url.includes('app.vwo.com') && !foundTab) {
				foundTab = true;
				chrome.tabs.update(tab.id, { url: impersonator_URL });
				chrome.tabs.update(tab.id, { active: true });
			}
		});
		if (!foundTab) {
			chrome.tabs.create({ url: impersonator_URL });
		}
	});
	last_used_cycle(list);
};

const impersonate_event = (btn) => {
	btn.addEventListener('click', function (event) {
		let account = this.parentElement;
		let account_id = account.querySelector('.list-id');
		let account_name = account.querySelector('.list-name');

		account_id = account_id.innerHTML.trim();
		account_name = account_name.innerHTML.trim();

		list = document.querySelector('.last-used-group');
		type = 'recent-used';

		createAcc(type, list, account_id, account_name);

		impersonate(account_id, list);
		push_data();
	});
};

const delete_event = (btn) => {
	btn.addEventListener('click', () => {
		btn.parentElement.remove();
		push_data();
	});
};

const sort_account_list = () => {
	let ul = document.querySelector('.accounts-list-group');
	let liArray = Array.from(ul.querySelectorAll('li'));

	liArray.sort(function (a, b) {
		let aClass = a.className;
		let bClass = b.className;
		return aClass.localeCompare(bClass);
	});

	ul.innerHTML = '';
	liArray.forEach((li) => {
		ul.appendChild(li);
	});
	push_data();
};

const pin_event = (btn) => {
	btn.addEventListener('click', () => {
		let li = btn.parentElement;
		let ul_main = document.querySelector('.accounts-list-group');
		let ul_pinned = document.querySelector('.accounts-pinned-group');

		if (btn.classList.contains('pinned-down')) {
			li.classList.remove('pinned-down');
			ul_main.classList.add('odd');
			ul_main.classList.remove('even');
			btn.classList.remove('pinned-down');
			ul_main.appendChild(li);
		} else {
			li.classList.add('pinned-down');
			ul_main.classList.remove('odd');
			ul_main.classList.add('even');
			btn.classList.add('pinned-down');
			ul_pinned.appendChild(li);
		}
		sort_account_list();
		push_data();
	});
};

const is_account_new = (type, list, account_id) => {
	let is_account_new = true;

	list.querySelectorAll('li').forEach((li) => {
		let list_account = li.querySelector('.account-id').textContent;
		if (list_account == account_id) is_account_new = false;
	});

	console.log('Is account new? ' + is_account_new);
	return is_account_new;
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
	if (!is_account_new(type, list, account_id)) {
		return;
	}

	let new_account = document.createElement('li');
	let new_account_id = document.createElement('p');
	let new_account_name = document.createElement('p');

	if (type == 'recent-used') {
		new_account.classList.add(`account`);
	} else {
		new_account.classList.add(`account-${list.children.length + 1}`);
	}

	new_account_id.textContent = account_id;
	new_account_id.classList.add('account-id', 'list-id');
	new_account.appendChild(new_account_id);

	new_account_name.textContent = account_name;
	new_account_name.classList.add('account-name', 'list-name', 'full');
	new_account.appendChild(new_account_name);

	createFeatures(type, new_account);

	console.log('account created')
	list.appendChild(new_account);
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

	if (ul.classList.contains('last-used-group')) {
		type = 'recent-used';
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
	/* 	const id_input = document.querySelector('#account-id').value;
	const name_input = document.querySelector('#account-name').value; */
	const filter_input = document.querySelector('#filter-list-input').value;

	const recently_impersonated = document.querySelectorAll('.last-used-group li');
	const pinned_group = document.querySelectorAll('.accounts-pinned-group li');
	const list_group = document.querySelectorAll('.accounts-list-group li');

	const recently_impersonated_dropdown = document.querySelector('.last-used button.dropdown').classList.contains('up');
	const list_group_dropdown = document.querySelector('.accounts-list button.dropdown').classList.contains('up');

	const prefs = {
		popup: {
			/* id_input: id_input,
			name_input: name_input, */

			recently_impersonated: push_list(recently_impersonated),
			pinned_group: push_list(pinned_group),
			list_group: push_list(list_group),

			recently_impersonated_dropdown: recently_impersonated_dropdown,
			list_group_dropdown: list_group_dropdown,

			filter_input: filter_input,
		},
	};
	chrome.runtime.sendMessage({ event: 'save', prefs });
};

chrome.storage.local.get('popup', (result) => {
	const { popup } = result;

	/* 	document.querySelector('#account-id').value = popup.id_input;
	document.querySelector('#account-name').value= popup.name_input; */

	document.querySelector('#filter-list-input').value = popup.filter_input;

	const recently_impersonated_ul = document.querySelector('.last-used-group');
	const pinned_group_ul = document.querySelector('.accounts-pinned-group');
	const list_group_ul = document.querySelector('.accounts-list-group');

	popup.recently_impersonated.forEach((li) => {
		pull_account(li, recently_impersonated_ul);
	});
	popup.pinned_group.forEach((li) => {
		pull_account(li, pinned_group_ul);
	});
	popup.list_group.forEach((li) => {
		pull_account(li, list_group_ul);
	});

	if (popup.recently_impersonated_dropdown == true) {
		document.querySelector('.last-used button.dropdown').classList.add('up');
		document.querySelector('.last-used-group').style.display = 'none';
	}

	if (popup.list_group_dropdown == true) {
		document.querySelector('.accounts-list button.dropdown').classList.add('up');

		document.querySelectorAll('.lists-groups ul').forEach((ul) => {
			ul.style.display = 'none';
		});
	}

	push_data();
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

chrome.bookmarks.getTree((bookmarkTreeNodes) => {
	traverseBookmarks(bookmarkTreeNodes);
});
