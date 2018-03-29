import { profile } from '../profile/profile';
import { actions } from '../page-model/common';
import axeCheck from 'axe-testcafe';
import { soap } from '../utils/soap-client';

fixture.skip `Accessibility fixture`
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

test('Automated accessibility testing', async t => {
	await axeCheck(t);
});