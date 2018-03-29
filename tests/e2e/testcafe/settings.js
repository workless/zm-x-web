/*eslint new-cap: ["error", { "capIsNew": false }]*/
import { profile } from './profile/profile';
import { actions } from './page-model/common';
import { settings } from './page-model/settings';
import { elements } from './page-model/elements';
import { Selector } from 'testcafe';
import { soap } from './utils/soap-client';

fixture `Settings fixture`
	.page(profile.hostURL)
	.before( async ctx => {
		ctx.adminAuthToken = await soap.getAdminAuthToken();
	})
	.beforeEach( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		await t.maximizeWindow();
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
	});

test('Add and Remove Filter', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filter');
	await settings.clickSubsectionBodyButton('Add');
	await settings.enterEditFilterText('Filter Name', 'filter');
	await settings.enterEditFilterText('From', 'ABCD');
	await settings.clickModalDialogFooterButton('Save');
	await settings.clickDialogButton('Save');
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filter');
	await t.expect(elements.settingsFiltersList.find('*').withText('filter').exists).ok();
	await settings.clickFilterFromFiltersList('filter');
	await settings.clickSubsectionBodyButton('Remove');
	await settings.clickModalDialogFooterButton('Yes');
	await t.expect(elements.settingsFiltersList.find('*').withText('filter').exists).notOk();
	await settings.clickDialogButton('Save');
});

test('Enable and disable vacation response', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Vacation Response');
	await t.expect(elements.labelSelector.withText('Enable automatic response during these dates (inclusive)').exists).ok();
	await t.expect(elements.checkBoxSelector.checked).notOk(); // checkbox not checked
	await t.expect(Selector('button').withText('Send sample copy to me').hasAttribute('disabled')).ok(); // Send me copy button disabled
	await t.click(elements.checkBoxSelector);
	await t.expect(elements.checkBoxSelector.checked).ok();
	await settings.clickEnterVacationResponse('Sample vacation response text');
	await settings.clickDialogButton('Save'); // Enable vacation response
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Vacation Response');
	await t.expect(elements.checkBoxSelector.checked).ok();
	await settings.clickClearVacationResponse();
	await t.click(elements.checkBoxSelector);
	await settings.clickDialogButton('Save'); // Disable vacation response
});