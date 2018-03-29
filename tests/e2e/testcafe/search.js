import { profile } from './profile/profile';
import { actions } from './page-model/common';
import { search } from './page-model/search';
import { sidebar } from './page-model/sidebar';
import { soap } from './utils/soap-client';

fixture `Smart Folder fixture`
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
 
// Feature: PREAPPS-167
test('Saving search creates smart folder', async t => {
	await search.clickSearch();
	await search.enterText('test');
	await search.hitEnter();
	await search.clickSaveButton();
	await search.clickFolder('Smart Folders');
	await t.expect(sidebar.sidebarContentItemWithText('test').exists).ok();
});