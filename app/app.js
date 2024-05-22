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
			}
		});
		if (!foundTab) {
			chrome.tabs.create({ url: impersonator_URL });
		}
	});

	console.log(`Account: ${account_id} impersonated`);
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
	});
};

const delete_event = (btn) => {
	btn.addEventListener('click', () => {
		btn.parentElement.remove();
	});
};

const sort_list = (list) => {
	list.childNodes.forEach((li) => {
		console.log(li);
		console.log(li.classList.value);
		if (!li.querySelector('button').classList.contains('pin-down')) {
			for (let index = 1; index <= list.length; index++) {
				parseInt(li.classList.value.split('-')[1]) == index;
				list.appendChild(li);
			}
		}
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
	});
};

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

const createFeatures = (type, new_account) => {
	let btn_impersonate = document.createElement('button');
	btn_impersonate.innerHTML = '🎭';
	impersonate_event(btn_impersonate);
	btn_impersonate.classList.add('btn-impersonate');

	if (type == 'main-list') {
		/* 		let btn_move = document.createElement('button');
		btn_move.innerHTML = '📁';
		btn_move.classList.add('btn-folder');
		new_account.appendChild(btn_move); */

		let btn_delete = document.createElement('button');
		btn_delete.innerHTML = '🗑';
		btn_delete.classList.add('btn-delete');
		delete_event(btn_delete);
		new_account.appendChild(btn_delete);

		let btn_pin = document.createElement('button');
		btn_pin.innerHTML = '📌';
		btn_pin.classList.add('btn-pin');
		pin_event(btn_pin);
		new_account.appendChild(btn_pin);
	}

	new_account.appendChild(btn_impersonate);
};

const createAcc = (type, list, account_id, account_name) => {
	let new_account = document.createElement('li');
	let new_account_id = document.createElement('p');
	let new_account_name = document.createElement('p');

	if (type == 'recent-used') {
		new_account.classList.add(`account`);
	} else {
		new_account.classList.add(`account-${list.children.length + 1}`);
	}

	new_account_id.innerHTML = account_id;
	new_account_id.classList.add('account-id', 'list-id');
	new_account.appendChild(new_account_id);

	new_account_name.innerHTML = account_name;
	new_account_name.classList.add('account-name', 'list-name', 'full');
	new_account.appendChild(new_account_name);

	createFeatures(type, new_account);

	list.appendChild(new_account);
};

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
	});
});

const dropdown_event_listener = (dropdown) => {
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
	});
};
