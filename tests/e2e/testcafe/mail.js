/*eslint new-cap: ["error", { "capIsNew": false }]*/
import { Selector } from 'testcafe';
import { profile } from './profile/profile';
import { actions, utilFunc } from './page-model/common';
import { settings } from './page-model/settings';
import { mail } from './page-model/mail';
import { compose } from './page-model/compose';
import { sidebar } from './page-model/sidebar';
import { dialog } from './page-model/dialog';
import { elements } from './page-model/elements';
import { soap } from './utils/soap-client';
import Inject from './utils/Inject-msg';
const path = require('path');

/***************************/
/*** Mail: Inbox fixture ***/
/***************************/

fixture `Mail: Inbox fixture`
	.page(profile.hostURL)
	.before( async ctx => {
		ctx.adminAuthToken = await soap.getAdminAuthToken();
	})
	.beforeEach( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await mail.openEmail(0);
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
	});

test('L0 | Read Message : Check Subject, Message Count, Condensed Message Body | C581722 | Smoke ', async t => {
	await t.expect(await mail.getConversationHeaderSubject()).eql(await mail.getMessageSubject(0));
	await t.expect(await mail.getMessageLabelCount()).eql(await mail.getConverstationSectionCount() - 1);
	await mail.openCondensedMessage(0);
	await t.expect(elements.mailViewerBodySelector).ok();
});

test('L0 | Reply, No Attachments Present in Original | C881168', async t => {
	let emailBodyText = 'email body text';
	await mail.openCondensedMessage(0);
	await compose.clickReplyButton();
	await compose.enterBodyText(emailBodyText);
	await compose.sendEmail();
	await sidebar.clickSidebarContent('Inbox');
	await t.eval(() => location.reload(true));
	await compose.openNewMessage();
	await t.expect(elements.inboxReadPane().exists).ok({ timeout: 10000 });
	await t.expect(await elements.conversationSectionSelector.innerText).contains(emailBodyText);
});

test('L1 | Conversation header should display the number of conversation | C727484', async t => {
	await t.expect(elements.mailViewerTitleCountText.exists).ok({ timeout: 5000 });
	await t.expect(await elements.mailViewerTitleCountText.innerText).contains('2');
});

test('L1 | Read a Message within a Conversation | C798471', async t => {
	await t.expect(await mail.getConversationHeaderSubject()).eql(await mail.getMessageSubject(0));
	await t.expect(await mail.getMessageLabelCount()).eql(await mail.getConverstationSectionCount() - 1);
	await mail.openCondensedMessage(0);
	await t.expect(elements.mailViewerBodySelector).ok();
	await t.expect(elements.mailListItemUnread.exists).notOk();
});

test('L0 | Forward, No Attachments Present in Original | C881172', async t => {
	let emailTo = t.ctx.user.email;
	let emailBodyText = 'email body text';
	await mail.openCondensedMessage(0);
	await compose.clickForwardButton();
	await compose.enterTextToFieldElement(emailTo, compose.addressFieldTextField('To'));
	await compose.enterBodyText(emailBodyText);
	await compose.sendEmail();
	await t.wait(2000);
	await sidebar.clickSidebarContent('Inbox');
	await t.eval(() => location.reload(true));
	await compose.openNewMessage();
	await t.expect(elements.inboxReadPane().exists).ok({ timeout: 10000 });
	await t.expect(await elements.conversationSectionSelector.innerText).contains(emailBodyText);
});

test('L1 | Read Message, Refresh Inbox | C581729', async t => {
	await t.expect(elements.conversationSectionSelector.exists).ok({ timeout: 5000 });
	await t.hover(elements.sidebarContentSelector.find('*').withAttribute('title', 'Inbox'));
	await t.click(elements.sidebarRefreshButton);
	await t.expect(elements.mailViewPlaceholderView.exists).ok({ timeout: 5000 });
});


test.skip('L2 | Archive a Conversation | C798475 | PREAPPS-262', async t => {
	let messageSubject = await mail.getMessageSubject(0);
	await mail.clickToolbarButton('Archive');
	await t.expect(await mail.getConversationHeaderSubject()).notEql(messageSubject);
	// await t.expect(await mail.getMessageSubject(0)).notEql(messageSubject);
});

test('L1 | Move message from inbox to trash | C951764', async t => {
	let messageSubject = await mail.getMessageSubject(0);
	await mail.clickToolbarButton('Move');
	await mail.clickPopoverMenuItem('Trash');
	await sidebar.clickSidebarContent('Trash');
	await t.expect(mail.checkMailExists(messageSubject)).ok();
	await mail.clickMessageWithText(messageSubject);
	await mail.clickToolbarButton('Move');
	await mail.clickPopoverMenuItem('Inbox');
	await t.expect(mail.checkMailExists(messageSubject)).notOk();
});

test('L0 | Delete message | C951765', async t => {
	let messageSubject = await mail.getMessageSubject(0);
	await mail.clickToolbarButton('Delete');
	await sidebar.clickSidebarContent('Trash');
	await t.expect(mail.checkMailExists(messageSubject)).ok();
});


test('L1 | Delete thread by viewing message, conversation view | C727310', async t => {
	await compose.clickToolbarButtonByName('Delete');
	await t.expect(elements.mailListSubjectSelector.withText('ABC').exists).notOk();
});

test('L1 | Delete thread by checking message box, conversation view | C727311', async t => {
	await mail.selectAllMail();
	await compose.clickToolbarButtonByName('Delete');
	await t.expect(elements.mailListSubjectSelector.withText('ABC').exists).notOk();
});

test('L1 | Mark as spam message from inbox | C727320', async t => {
	await compose.clickToolbarButtonByName('Spam');
	await t.expect(elements.mailListSubjectSelector.withText('ABC').exists).notOk({ timeout: 5000 });
	await t.click(sidebar.sidebarContentItemWithText('Junk'));
	await t.expect(elements.mailListSubjectSelector.withText('ABC').exists).ok({ timeout: 5000 });
});

test('L1 | Mark as not spam from Junk folder | C727324', async t => {
	await t.click(sidebar.sidebarContentItemWithText('Junk'));
	await t.expect(elements.mailListSubjectSelector.withText('empty').exists).ok({ timeout: 5000 });
	await mail.openEmail(0);
	await compose.clickToolbarButtonByName('Not Spam');
	await t.expect(elements.mailListSubjectSelector.withText('empty').exists).notOk({ timeout: 5000 });
	await t.click(sidebar.sidebarContentItemWithText('Inbox'));
	await t.expect(elements.mailListSubjectSelector.withText('empty').exists).ok({ timeout: 5000 });
}).before(async t => {
	t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
	t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
	const inject = new Inject();
	const filePath = path.join(__dirname, './data/mime/emails/empty.txt');
	inject.send(t.ctx.userAuth, filePath, 'Junk');
	await t.maximizeWindow();
	await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
});

test.skip('L1 | Mark as star from more options | C727488 | PREAPPS-388', async t => {
	await mail.clickToolbarButton('More');
	await mail.clickPopoverMenuItem('Star');
	await t.expect(mail.checkStarEnabledInMailList()).ok();
	await mail.clickToolbarButton('More');
	await mail.clickPopoverMenuItem('Clear Star');
});

test('L1 | Star message by hover action in the message list view | C727480', async t => {
	await t.click(mail.mailListStarIconButtonBySubject('ABC'));
	await t.expect(String(await mail.mailListStarIconButtonBySubject('ABC').classNames)).contains('item_starred');
});

test('L1 | Read Message, Inline Attachment | C581719', async t => {
	const emailBodyText = 'test text';
	await compose.openNewMessage();
	await t.expect(elements.clientHtmlViewerInner.find('img').nth(0).exists).ok({ timeout: 5000 });
	await t.expect(await elements.clientHtmlViewerInner.innerText).contains(emailBodyText);
	const startRectTop = await elements.clientHtmlViewerInner.find('img').nth(0).getBoundingClientRectProperty('top');
	await utilFunc.scrollElement.with({ dependencies: { scrollPosition: 'down' } })(elements.inboxReadPane);
	await t.wait(1000);
	const endRectTop = await elements.clientHtmlViewerInner.find('img').nth(0).getBoundingClientRectProperty('top');
	await t.expect(startRectTop > endRectTop);
})
	.before( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/multi-inline-attachment.txt');
		inject.send(t.ctx.userAuth, filePath);
		await t.maximizeWindow();
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
	});

test('L1 | Read Message, Preview Attachment, Close Preview | C666728', async t => {
	await compose.openNewMessage();
	await t
		.click(elements.mailViewAttachmentPrevewButton)
		.expect(elements.mailViewAttachmentViewer.exists).ok({ timeout: 5000 })
		.expect(elements.mailViewAttachmentViewer.find(elements.previewPDFviewContainer).find('canvas').exists).ok()
		.expect(elements.previewToolbarDownloadButton.exists).ok();
	await t
		.click(elements.previewToolbarFullScreenButton)
		.expect(elements.overlayView.exists).ok({ timeout: 5000 });
	await mail.closePreviewFullScreen();
	await t.expect(elements.overlayView.exists).notOk({ timeout: 5000 });
	await t
		.click(elements.previewToolbarCloseButton)
		.expect(elements.mailViewAttachmentViewer.exists).notOk({ timeout: 5000 });
})
	.before( async t => {
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/single-file-attachment.txt');
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		inject.send(t.ctx.userAuth, filePath);
		await t.maximizeWindow();
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
	});

/*****************************/
/*** Mail: Folders fixture ***/
/*****************************/

fixture `Mail: Folders fixture`
	.page(profile.hostURL)
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

test('L0 | Read a Message | C778022', async t => {
	await compose.openNewMessage();
	await t.expect(elements.conversationSectionSelector.exists).ok({ timeout: 2000 });
});

test('L1 | Move message to folder by drag-drop | C726318', async t => {
	await sidebar.clickFolder(/^Folders/);
	await t.dragToElement(mail.selectMail(0), sidebar.sidebarContentItemWithText('testFolder'));
	await sidebar.clickSidebarContent('testFolder');
	let messageCountBefore = await mail.getMailCount();
	await t.dragToElement(mail.selectMail(0), sidebar.sidebarContentItemWithText('Inbox'));
	await mail.waitProgressIndicator();
	let messageCountAfter = await mail.getMailCount();
	await t.expect(messageCountBefore - messageCountAfter).eql(1);
});

test('L1 | Move message to draft folder by drag-drop | C726319', async t => {
	await t.dragToElement(mail.selectMail(0), sidebar.sidebarContentItemWithText('Drafts'));
	await t.expect(elements.mailListFooterSelector.exists).ok({ timeout: 5000 });
	await t.expect(await elements.mailListFooterSelector.innerText).contains('folder is empty');
	await t.click(sidebar.sidebarContentItemWithText('Drafts'));
	await t.expect(mail.selectMail(0).exists).ok({ timeout: 5000 });
});

test('L1 | Move message from draft folder by drag-drop | C726320', async t => {
	await t.dragToElement(mail.selectMail(0), sidebar.sidebarContentItemWithText('Drafts'));
	await t.expect(elements.mailListFooterSelector.exists).ok({ timeout: 5000 });
	await t.click(sidebar.sidebarContentItemWithText('Drafts'));
	await t.expect(mail.selectMail(0).exists).ok({ timeout: 5000 });
	await t.dragToElement(mail.selectMail(0), sidebar.sidebarContentItemWithText('Junk'));
	await t.expect(elements.mailListFooterSelector.exists).ok({ timeout: 5000 });
	await t.expect(await elements.mailListFooterSelector.innerText).contains('folder is empty');
	await t.click(sidebar.sidebarContentItemWithText('Junk'));
	await t.expect(mail.selectMail(0).exists).ok({ timeout: 5000 });
});

test('L1 | Create folder from context menu | C726324', async t => {
	let newFolderName = 'newFolderName';
	await sidebar.createNewFolder(/^Folders/, newFolderName);
	await t.click(sidebar.sidebarContentItemWithText(newFolderName));
	await sidebar.deleteFolder(newFolderName);
	await dialog.clickDialogOverlayButton('OK');
	await t.expect(elements.blocksDialogOverlaySelector.exists).notOk();
	await t.expect(sidebar.sidebarContentItemWithText(newFolderName).exists).notOk();
});

test('L2 | Default Folder, Rename/Delete | C607274', async t => {
	await sidebar.clickFolder(/^Folders/);
	let expectName = 'testFolder';
	let newName = 'renameFolderTest';
	await sidebar.renameFolder(expectName, newName);
	await t.expect(sidebar.sidebarContentItemWithText(newName).exists).ok();
	await sidebar.renameFolder(newName, expectName);
	await t.expect(sidebar.sidebarContentItemWithText(expectName).exists).ok();
});

test('L1 | Collapse folder Folder context menu | C945624', async t => {
	await t.expect(sidebar.sidebarContentItemWithText('testFolder').exists).notOk();
	await sidebar.clickFolder(/^Folders/);
	await t.expect(sidebar.sidebarContentItemWithText('testFolder').exists).ok();
});

test('L1 | Tap on search icon to search folder. SKIP: Hover is not working | C826803', async t => {
	let testFolderName = 'testFolder';
	await sidebar.searchFolder(/^Folders/, testFolderName);
	await t
		.expect(sidebar.sidebarContentItemWithText('Chats').exists).notOk()
		.expect(sidebar.sidebarContentItemWithText(testFolderName).exists).ok();
	await sidebar.folderTextInputClose();
	await t
		.expect(sidebar.sidebarContentItemWithText('Chats').exists).ok()
		.expect(sidebar.sidebarContentItemWithText(testFolderName).exists).ok();
});

test('L1 | Move user created folder from context menu into/out from another folder | C726329 | Fixed:PREAPPS-196', async t => {
	let moveFolderName = 'moveFolder';
	let moveToFolder = 'testFolder';
	await sidebar.clickFolder(/^Folders/);
	await sidebar.clickAngleToExpandSubFolder(moveToFolder);
	await sidebar.moveFolder(moveFolderName, `Place at top level`);
	await t.expect(elements.folderListCollapsibleControlSelector.nth(1).exists).notOk({ timeout: 2000 });
	await sidebar.moveFolder(moveFolderName, moveToFolder);
	await t.expect(elements.folderListCollapsibleControlSelector.nth(1).exists).ok({ timeout: 2000 });
	await t.expect(await sidebar.getSidebarContentItemIndex(moveFolderName) - await sidebar.getSidebarContentItemIndex(moveToFolder) === 1).ok();
	await sidebar.moveFolder(moveFolderName, 'Place at top level');
	await t.expect(elements.folderListCollapsibleControlSelector.nth(1).exists).notOk({ timeout: 2000 });
}).before(async t => {
	t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
	t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
	const folderID =await soap.mailCreateFolder(t.ctx.userAuth, '1', 'testFolder');
	await soap.mailCreateFolder(t.ctx.userAuth, folderID, 'moveFolder');
	await t.maximizeWindow();
	await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
});

/*************************************************/
/*** Mail: Settings Folder settings multi-user ***/
/*************************************************/

fixture `Mail: Settings Folder settings multi-user`
	.page(profile.hostURL)
	.before( async ctx => {
		ctx.adminAuthToken = await soap.getAdminAuthToken();
	})
	.beforeEach( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		t.ctx.user2 = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.user2Auth = await soap.getUserAuthToken(t.ctx.user2.email, t.ctx.user2.password);
		await soap.mailCreateFolder(t.ctx.userAuth, '1', 'testFolder');
		await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarFolderExists('Folders')).ok({ timeout: 15000 });
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
		await soap.deleteAccount(t.ctx.user2.id, t.fixtureCtx.adminAuthToken);
	});

test('L1 | Verify the filter with respect to custom folder | C830220', async t => {
	const filterName = 'testFilter';
	const ruleFolder = 'testFolder';
	//setup filter rule for user2
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filter');
	await settings.clickSubsectionBodyButton('Add');
	await settings.enterEditFilterText('Filter Name', filterName);
	await settings.selectFilterSelectByLabel('Then move the messages to this folder', ruleFolder);
	await settings.enterEditFilterText('From', t.ctx.user2.email);
	await settings.clickModalDialogFooterButton('Save');
	await t
		.expect(elements.settingsFiltersListEntrySelector.exists).ok({ timeout: 5000 })
		.expect(await elements.settingsSubsectionBodySelector.innerText).contains(filterName)
		.expect(await elements.settingsSubsectionBodySelector.innerText).contains(ruleFolder);
	await settings.clickDialogButton('Save');
	await actions.logoutEmailPage(t.ctx.user.email);
	//login user2 send email
	await actions.loginEmailPage(t.ctx.user2.email, t.ctx.user2.password);
	await compose.clickCompose();
	await compose.enterTextToFieldElement(t.ctx.user.email, compose.addressFieldTextField('To'));
	await compose.enterTextToFieldElement(filterName, elements.composerSubject);
	await compose.enterBodyText(ruleFolder);
	await compose.sendEmail();
	await actions.logoutEmailPage(t.ctx.user2.email);
	//login user verify folder
	await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
	await sidebar.clickFolder(/^Folders/);
	await t.click(sidebar.sidebarContentItemWithText(ruleFolder));
	await compose.openMessageWithSubject(filterName);
	await t.expect(await elements.clientHtmlViewerInner.innerText).contains(ruleFolder);
});

/******************************/
/*** Mail: Rich Text Editor ***/
/******************************/

fixture `Mail: Reply, Rich Text Editor fixture`
	.page(profile.hostURL)
	.before( async ctx => {
		ctx.adminAuthToken = await soap.getAdminAuthToken();
	})
	.beforeEach( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/empty.txt');
		inject.send(t.ctx.userAuth, filePath);
		await t.maximizeWindow();
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await mail.openEmail(0);
		await mail.clickToolbarButton(0);
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
	});

test('L2 | RTE Toolbar Elements | C612377', async t => {
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	const toolbarItemCount = await elements.componentsToolbarMiddleSelector.child().count;
	await t
		.click(compose.toolbarButtonsSelector('Switch to Plain Text'))
		.wait(500);
	const toolbarItemCount2 = await elements.componentsToolbarMiddleSelector.child().count;
	await t
		.expect(toolbarItemCount > toolbarItemCount2).ok()
		.click(compose.toolbarButtonsSelector('Switch to Rich Text'))
		.wait(500);
	await t
		.expect(await elements.componentsToolbarMiddleSelector.child().count).eql(toolbarItemCount);
});

test.skip('L1 | Responsive Composer Toolbar | C612378 | PREAPPS-206', async t => {
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	const toolbarItemCount = await elements.componentsToolbarMiddleSelector.child().count;
	await t
		.resizeWindow(720,600)
		.wait(2000);
	const toolbarItemCount2 = await elements.componentsToolbarMiddleSelector.child().count;
	await t.expect(toolbarItemCount > toolbarItemCount2).ok();
	await t
		.maximizeWindow()
		.wait(2000);
	await t
		.expect(await elements.componentsToolbarMiddleSelector.child().count).eql(toolbarItemCount);
});

test.skip('L2 | Font > Type | C769875 | PREAPPS-250', async t => {
	let emailBodyText = 'Font';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Font', 'Classic');
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('font').getAttribute('face')).contains('TimesNewRoman');
});

test.skip('L2 | Font > Size | C813884', async t => {
	let emailBodyText = 'Size';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Font', 'Large');
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('font').getAttribute('size')).eql('5');
});

test.skip('L2 | Font > Bold | C813885', async t => {
	let emailBodyText = 'Bold';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await t.click(compose.toolbarButtonsSelector('Bold'));
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('b').exists).ok();
});

test.skip('L2 | Font > Italics | C813886', async t => {
	let emailBodyText = 'Test';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await t.click(compose.toolbarButtonsSelector('Italic'));
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('i').exists).ok();
});

test.skip('L2 | Font > Underline | C813887', async t => {
	let emailBodyText = 'Test';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await t.click(compose.toolbarButtonsSelector('Underline'));
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('u').exists).ok();
});

test.skip('L2 | Font > Text, Background Color | C818253 | PREAPPS-250', async t => {
	let expectedFontColor = '#888888';
	let expectedFontBackgroundColor = 'rgb(136, 136, 136)';
	let emailBodyText = 'Test';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await t.click(compose.toolbarButtonsSelector('Text Color'));
	await t.wait(500);
	await t.click(compose.toolbarButtonsSelector('Text Color'));
	await t.wait(500);
	await compose.selectComoposeToolbarFontColor('Text', 1);
	await compose.selectComoposeToolbarFontColor('Highlight', 1);
	await t.expect(await elements.richtextareaTextContentSelector.find('font').getStyleProperty('background-color')).eql(expectedFontBackgroundColor);
	await t.expect(await elements.richtextareaTextContentSelector.find('font').getAttribute('color')).eql(expectedFontColor);
});

test('L2 | Font > Bulleting | C826615', async t => {
	let emailBodyText = 'This is line 1<br>This is line 2';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 15, 30);
	await compose.selectComposeToolbarListsByIndex('Lists', 0);
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('ul').find('li').exists).ok();
	await compose.selectComposeToolbarListsByIndex('Lists', 1);
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('ol').find('li').exists).ok();
});

test('L2 | Font > Indent | C826662', async t => {
	let emailBodyText = 'This is line 1<br>This is line 2';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 15, 30);
	await compose.selectComposeToolbarListsByIndex('Indentation', 0);
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('blockquote').exists).ok();
	await compose.selectComposeToolbarListsByIndex('Indentation', 1);
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('blockquote').exists).notOk();
});

test.skip('L2 | Font > Alignment | C826709 | PREAPPS-250', async t => {
	let emailBodyText = 'Test';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await compose.selectComposeToolbarListsByIndex('Text Alignment', 1);
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('div').getStyleProperty('text-align')).eql('center');
	await compose.selectComposeToolbarListsByIndex('Text Alignment', 0);
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('div').getStyleProperty('text-align')).eql('left');
	await compose.selectComposeToolbarListsByIndex('Text Alignment', 2);
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('div').getStyleProperty('text-align')).eql('right');
});

test('L1 | Verify the insert link with respect to the cursor position | C871114 | (Bug:PREAPPS-274)', async t => {
	let emailBodyText = 'test';
	let linkUrl = 'http://www.google.ca';
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await compose.selectComposeToolbarPopmenu('Link', 'Insert Link');
	await t.wait(500);
	await compose.insertDisplayText(emailBodyText);
	await compose.insertTextLink(linkUrl);
	await t
		.expect(elements.richtextareaTextContentSelector.find('a').withText(emailBodyText).exists).ok({ timeout: 2000 })
		.expect(await elements.richtextareaTextContentSelector.find('a').getAttribute('href')).eql(linkUrl)
		.expect(await elements.richtextareaTextContentSelector.find('tbody').find('h2').innerText).eql('Google')
		.expect((await elements.richtextareaTextContentSelector.innerText).split(emailBodyText).length - 1).eql(1);
});

test.skip('L1 | Emoticon button | C828577 | PREAPPS-250', async t => {
	const expectedEmojiData = await compose.insertEmoji(0);
	const actualEmojiData = await elements.richtextareaTextContentSelector.find('img').getAttribute('src');
	await t.expect(expectedEmojiData).eql(actualEmojiData);
});

fixture `Mail: Forward functions multi-user`
	.page(profile.hostURL)
	.before( async ctx => {
		ctx.adminAuthToken = await soap.getAdminAuthToken();
	})
	.beforeEach( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		t.ctx.user2 = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.user2Auth = await soap.getUserAuthToken(t.ctx.user2.email, t.ctx.user2.password);
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/empty.txt');
		inject.send(t.ctx.userAuth, filePath);
		await t.maximizeWindow();
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
		await soap.deleteAccount(t.ctx.user2.id, t.fixtureCtx.adminAuthToken);
	});

test('L1 | Immediately refresh conversation view once a forward is sent | C727483', async t => {
	let emailBodyText = 'forward email';
	let fwdEmailSubject = 'Fwd: empty';
	let userEmail = t.ctx.user2.email;
	await compose.openNewMessage();
	await compose.clickForwardButton();
	await compose.enterTextToFieldElement(userEmail, compose.addressFieldTextField('To'));
	await compose.enterBodyText(emailBodyText);
	await compose.sendEmail();
	await sidebar.clickSidebarContent('Sent');
	await t.eval(() => location.reload(true));
	await compose.openMessageWithSubject(fwdEmailSubject);
	await mail.openCondensedMessage(0);
	await t.expect(await elements.clientHtmlViewerInner.nth(1).innerText).contains(emailBodyText);
});

/*******************************************/
/*** Mail: Forward functions single user ***/
/*******************************************/

fixture `Mail: Forward functions single user`
	.page(profile.hostURL)
	.before( async ctx => {
		ctx.adminAuthToken = await soap.getAdminAuthToken();
	})
	.beforeEach( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/empty.txt');
		inject.send(t.ctx.userAuth, filePath);
		await t.maximizeWindow();
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await compose.openNewMessage();
		await compose.clickForwardButton();
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
	});

test('L1 | Forward email Add Attachments | C906307 | PREAPPS-565', async t => {
	const filePath = path.join(__dirname, './data/files/JPEG_Image.jpg');
	let emailBodyText = 'forward email';
	let fwdEmailSubject = 'Fwd: empty';
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Attachments', 'Attach From My Computer');
	await t.setFilesToUpload(Selector('input').withAttribute('type', 'file'), filePath);
	await t
		.expect(elements.attachmentNameSelector.exists).ok({ timeout: 5000 })
		.expect(elements.attachmentNameSelector.innerText).contains('JPEG_Image');
});

test('L1 | Responsive Composer Toolbar | C979092', async t => {
	await t.expect(compose.toolbarButtonsSelector('Switch to Plain Text').exists).ok({ timeout: 5000 });
	await t
		.resizeWindow(1020,600)
		.wait(2000);
	await t.expect(elements.richtextToolbarContainer.find('button').withText('Send').exists).notOk({ timeout: 5000 });
	await t.maximizeWindow();
	await t.expect(compose.toolbarButtonsSelector('Switch to Plain Text').exists).ok({ timeout: 5000 });
});

test('L1 | Emoticon button | C979109', async t => {
	const expectedEmojiData = await compose.insertEmoji(0);
	const actualEmojiData = await elements.richtextareaTextContentSelector.find('img').getAttribute('src');
	await t.expect(expectedEmojiData).eql(actualEmojiData);
});

/****************************/
/*** Mail: Draft Messages ***/
/****************************/

fixture `Mail: Forward functions single user`
	.page(profile.hostURL)
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

test('L1 | Automatically save draft for new compose | C730222', async t => {
	let emailTo = t.ctx.user.email;
	let emailContent = 'testDraft';
	await compose.clickCompose();
	await compose.enterTextToFieldElement(emailTo, compose.addressFieldTextField('To'));
	await compose.enterTextToFieldElement(emailContent, elements.composerSubject);
	await compose.enterBodyText(emailContent);
	await t.wait(3000);
	await compose.closeCompose();
	await sidebar.clickSidebarContent('Drafts');
	await t.eval(() => location.reload(true));
	await compose.openMessageWithSubject(emailContent);
	await t.expect(elements.inboxReadPane().exists).ok();
	await t.expect(await elements.inboxReadPane().innerText).contains(emailContent);
});

test.skip('L1 | Automatically save draft for reply message | C730223 | PREAPPS-585', async t => {
	let emailTo = t.ctx.user.email;
	let emailBodyText = 'reply email';
	await compose.openNewMessage();
	await compose.clickReplyButton();
	await compose.enterBodyText(emailBodyText);
	await t.wait(3000);
	await t.debug();
	await sidebar.clickSidebarContent('Drafts');
	await compose.openMessageWithSubject("ABC");
	await mail.openCondensedMessage(0);
	await t.expect(await elements.clientHtmlViewerInner.nth(1).innerText).contains(emailBodyText);
});

test('L1 | Delete draft confirmation message | C730226', async t => {
	await sidebar.clickSidebarContent('Drafts');
	await compose.openMessageWithSubject("empty");
	await mail.clickToolbarButton('Delete');
	await t.expect(elements.mailListSubjectSelector.withText('empty').exists).notOk();
}).before(async t => {
	t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
	t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
	const inject = new Inject();
	const filePath = path.join(__dirname, './data/mime/emails/empty.txt');
	inject.send(t.ctx.userAuth, filePath, 'Drafts');
	await t.maximizeWindow();
	await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
});