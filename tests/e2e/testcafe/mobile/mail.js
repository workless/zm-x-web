/*eslint new-cap: ["error", { "capIsNew": false }]*/

import { profile } from '../profile/profile';
import { actions } from '../page-model/common';
import { mail } from '../page-model/mail';
import { compose } from '../page-model/compose';
import { sidebar } from '../page-model/sidebar';
import { elements } from '../page-model/elements';
import { soap } from '../utils/soap-client';

/***************************/
/*** Mail: Inbox fixture ***/
/***************************/

fixture `Mail: Inbox fixture`
	.page(process.env.URL || profile.hostURL)
	.before( async ctx => {
		ctx.adminAuthToken = await soap.getAdminAuthToken();
	})
	.beforeEach( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
	});

test('C581722 L0: Read Message : Check Subject, Message Count, Condensed Message Body', async t => {
	let messageSubject = await mail.getMessageSubject(0);
	let messageLabelCount = await mail.getMessageLabelCount();
	await mail.openEmail(0);
	await t.expect(messageSubject).eql(await mail.getConversationHeaderSubject());
	await t.expect(messageLabelCount).eql(await mail.getConverstationSectionCount() - 1);
	await mail.openCondensedMessage(0);
	await t.expect(elements.mailViewerBodySelector).ok();
});

test('C881168 L0: Reply, No Attachments Present in Original ', async t => {
	let emailBodyText = 'email body text';
	await mail.openEmail(0);
	await mail.openCondensedMessage(0);
	await compose.clickReplyButton();
	await compose.enterBodyText(emailBodyText);
	await compose.clickSendEmail();
	await compose.clickBackArrow();
	await t.wait(1000);
	await sidebar.clickHamburgerButton();
	await sidebar.clickSidebarContent('Inbox');
	await t.wait(1000);
	await compose.openNewMessage();
	await t.expect(elements.inboxReadPane().exists).ok({ timeout: 10000 });
	await t.expect(await elements.conversationSectionSelector.innerText).contains(emailBodyText);
});

test('C881172 L0: Forward, No Attachments Present in Original ', async t => {
	let emailTo = t.ctx.user.email;
	let emailBodyText = 'email body text';
	await mail.openEmail(0);
	await mail.openCondensedMessage(0);
	await compose.clickForwardButton();
	await compose.enterTextToFieldElement(emailTo, compose.addressFieldTextField('To'));
	await compose.enterBodyText(emailBodyText);
	await compose.clickSendEmail();
	await compose.clickBackArrow();
	await t.wait(2000);
	await sidebar.clickHamburgerButton();
	await sidebar.clickSidebarContent('Inbox');
	await compose.openNewMessage();
	await t.expect(elements.inboxReadPane().exists).ok({ timeout: 10000 });
	await t.expect(await elements.conversationSectionSelector.innerText).contains(emailBodyText);
});

/*****************************/
/*** Mail: Folders fixture ***/
/*****************************/

fixture `Mail: Folders fixture`
	.page(process.env.URL || profile.hostURL)
	.before( async ctx => {
		ctx.adminAuthToken = await soap.getAdminAuthToken();
	})
	.beforeEach( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		await soap.mailCreateFolder(t.ctx.userAuth, '1', 'testFolder');
		await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarFolderExists('Folders')).ok({ timeout: 15000 });
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
	});


test('Folder: Rename a folder', async t => {
	await sidebar.clickHamburgerButton();
	await sidebar.clickFolder(/^Folders/);
	let expectName = 'testFolder';
	let newName = 'renameFolderTest';
	await sidebar.renameFolder(expectName, newName);
	await t.expect(sidebar.sidebarContentItemWithText(newName).exists).ok();
	await sidebar.renameFolder(newName, expectName);
	await t.expect(sidebar.sidebarContentItemWithText(expectName).exists).ok();
});

test('Folder: Collapse folder', async t => {
	await sidebar.clickHamburgerButton();
	await t.expect(sidebar.sidebarContentItemWithText('testFolder').exists).notOk();
	await sidebar.clickFolder(/^Folders/);
	await t.expect(sidebar.sidebarContentItemWithText('testFolder').exists).ok();
});
