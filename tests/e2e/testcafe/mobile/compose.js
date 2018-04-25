/*eslint new-cap: ["error", { "capIsNew": false }]*/
import { Selector } from 'testcafe';
import { profile } from '../profile/profile';
import { compose } from '../page-model/compose';
import { mail } from '../page-model/mail';
import { sidebar } from '../page-model/sidebar';
import { elements } from '../page-model/elements';
import { actions, utilFunc } from '../page-model/common';
import { soap } from '../utils/soap-client';
import Inject from '../utils/Inject-msg';
const path = require('path');

/**************************************/
/*** Compose: Basic Compose & Send  ***/
/**************************************/

fixture `Compose: Basic Compose & Send`
	.page(profile.hostURL)
	.before( async ctx => {
		ctx.adminAuthToken = await soap.getAdminAuthToken();
	})
	.beforeEach( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
		if (typeof t.ctx.user2 != 'undefined') {
			await soap.deleteAccount(t.ctx.user2.id, t.fixtureCtx.adminAuthToken);
		}
	});

test('L1 | Compose, Send: To Self (basic) | C581664', async t => {
	let emailTo = t.ctx.user.email;
	let emailSubject = 'Daily test new email';
	let emailBodyText = 'Enter sample text in compose body area';
	await compose.clickComposeMobile();
	await compose.enterTextToFieldElement(emailTo, compose.addressFieldTextField('To'));
	await compose.enterTextToFieldElement(emailSubject, elements.composerSubject);
	await compose.enterBodyText(emailBodyText);
	const actualText = await compose.getRichtextareaText();
	await t.expect(actualText).eql(emailBodyText);
	await compose.clickSendEmailMobile();
	await sidebar.clickHamburgerButton();
	await sidebar.clickSidebarContent('Inbox');
	await t.eval(() => location.reload(true));
	await t.expect(elements.mailListItemUnread.exists).ok({ timeout: 15000 });
	await compose.openMessageWithSubject(emailSubject);
	await t.expect(elements.inboxReadPane().exists).ok();
	await t.expect(await elements.inboxReadPane().innerText).contains(emailSubject);
});

test('L1 | Compose, Send: CC only (basic) | C581665', async t => {
	let userEmail = t.ctx.user.email;
	let emailSubject = 'test CC';
	await compose.clickComposeMobile();
	await t.click(elements.ccBccButton);
	await compose.enterTextToFieldElement(userEmail, compose.addressFieldTextField('Cc'));
	await compose.enterTextToFieldElement(emailSubject, elements.composerSubject);
	await compose.enterBodyText(emailSubject);
	const actualText = await compose.getRichtextareaText();
	await t.expect(actualText).eql(emailSubject);
	await compose.clickSendEmailMobile();
	await t.wait(1000);
	await sidebar.clickHamburgerButton();
	await sidebar.clickSidebarContent('Inbox');
	await t.expect(elements.mailListItemUnread.exists).ok({ timeout: 15000 });
	await compose.openMessageWithSubject(emailSubject);
	await t.expect(elements.inboxReadPane().exists).ok({ timeout: 10000 });
	await t.expect(await elements.inboxReadPane().innerText).contains(emailSubject);
});

test('L1 | Compose, Send: BCC only (basic) | C581666', async t => {
	let userEmail = t.ctx.user.email;
	let emailSubject = 'test BCC';
	await compose.clickComposeMobile();
	await t.click(elements.ccBccButton);
	await compose.enterTextToFieldElement(userEmail, compose.addressFieldTextField('Bcc'));
	await compose.enterTextToFieldElement(emailSubject, elements.composerSubject);
	await compose.enterBodyText(emailSubject);
	const actualText = await compose.getRichtextareaText();
	await t.expect(actualText).eql(emailSubject);
	await compose.clickSendEmailMobile();
	await t.wait(1000);
	await sidebar.clickHamburgerButton();
	await sidebar.clickSidebarContent('Inbox');
	await t.expect(elements.mailListItemUnread.exists).ok({ timeout: 15000 });
	await compose.openMessageWithSubject(emailSubject);
	await t.expect(elements.inboxReadPane().exists).ok({ timeout: 10000 });
	await t.expect(await elements.inboxReadPane().innerText).contains(emailSubject);
});

test('L2 | Compose, Send: No Subject (basic) | C581668', async t => {
	let userEmail = t.ctx.user.email;
	let emailSubject = '[No subject]';
	let emailBodyText = 'Send: No Subject';
	await compose.clickComposeMobile();
	await compose.enterTextToFieldElement(userEmail, compose.addressFieldTextField('To'));
	await compose.enterBodyText(emailBodyText);
	const actualText = await compose.getRichtextareaText();
	await t.expect(actualText).eql(emailBodyText);
	await compose.clickSendEmailMobile();
	await t.wait(1000);
	await sidebar.clickHamburgerButton();
	await sidebar.clickSidebarContent('Inbox');
	await t.expect(elements.mailListItemUnread.exists).ok({ timeout: 15000 });
	await compose.openNewMessage();
	await t.expect(elements.inboxReadPane().exists).ok({ timeout: 10000 });
	await t.expect(await elements.inboxReadPane().innerText).contains('No subject');
	await t.expect(elements.mailListSubjectSelector.withText(emailSubject).exists).ok({ timeout: 5000 });
});

test('L2 | Compose, Send: No Message Body (basic) | C581670', async t => {
	let userEmail = t.ctx.user.email;
	let emailSubject = 'Send: No Message Body';
	await compose.clickComposeMobile();
	await compose.enterTextToFieldElement(userEmail, compose.addressFieldTextField('To'));
	await compose.enterTextToFieldElement(emailSubject, elements.composerSubject);
	await compose.clickSendEmailMobile();
	await t.wait(1000);
	await sidebar.clickHamburgerButton();
	await sidebar.clickSidebarContent('Inbox');
	await t.expect(elements.mailListItemUnread.exists).ok({ timeout: 15000 });
	await compose.openMessageWithSubject(emailSubject);
	await t.expect(elements.inboxReadPane().exists).ok({ timeout: 10000 });
	await t.expect(await elements.inboxReadPane().innerText).contains(emailSubject);
});

test('L1 | Compose, Send: To 3rd party (basic) | C581663', async t => {
	let userEmail = 'synacorusa@gmail.com';
	let emailSubject = 'email subject';
	await compose.clickComposeMobile();
	await compose.enterTextToFieldElement(userEmail, compose.addressFieldTextField('To'));
	await compose.enterTextToFieldElement(emailSubject, elements.composerSubject);
	await compose.enterBodyText(emailSubject);
	await compose.clickSendEmailMobile();
	await sidebar.clickHamburgerButton();
	await sidebar.clickSidebarContent('Sent');
	await t.eval(() => location.reload(true));
	await compose.openMessageWithSubject(emailSubject);
	await t.expect(elements.inboxReadPane().exists).ok({ timeout: 10000 });
	await t.expect(await elements.inboxReadPane().innerText).contains(emailSubject);
});