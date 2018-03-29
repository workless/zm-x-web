/*eslint new-cap: ["error", { "capIsNew": false }]*/
import { profile } from '../profile/profile';
import { ClientFunction } from 'testcafe';
import { actions } from '../page-model/common';
import validator from 'html-validator';
import fs from 'fs';

const getPageHTML = ClientFunction(() => document.documentElement.outerHTML);

async function validate(savePageHTML, getPageOuterHTML) {
	await fs.writeFile(savePageHTML, getPageOuterHTML, (err) => {
		if (err) {
			throw err;
		}
	});

	const options = {
		format: 'text',
		ignore: ['Error: Attribute “target-hammerhead-stored-value” not allowed on element “a” at this point.',
			'Error: Attribute “target-hammerhead-stored-value” not allowed on element “button” at this point.'
		]
	};

	fs.readFile(savePageHTML, 'utf8', (err, html) => {
		if (err) {
			throw err;
		}

		options.data = html;

		validator(options)
			.then((data) => {
				console.log(data);
			})
			.catch((error) => {
				console.error(error);
			});
	});
}


fixture.skip `HMTL Validator fixture`
	.page(profile.hostURL)
	.beforeEach( async t => {
		await actions.loginEmailPage(profile.loginInfo.userName, profile.loginInfo.password);
		await t.wait(5000);
	});

test('Mail page', async t => {
	validate('./mail.html', await getPageHTML());
	await t.wait(1000);
});

test('Contacts page', async t => {
	await actions.clickNavBarMenuItem('Contacts');
	validate('./contacts.html', await getPageHTML());
	await t.wait(1000);
});

test('Calendar page', async t => {
	await actions.clickNavBarMenuItem('Calendar');
	validate('./calendar.html', await getPageHTML());
	await t.wait(1000);
});

test('Notes page', async t => {
	await actions.clickNavBarMenuItem('Notes');
	validate('./notes.html', await getPageHTML());
	await t.wait(1000);
});