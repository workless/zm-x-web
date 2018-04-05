/*eslint new-cap: ["error", { "capIsNew": false }]*/

import { profile } from './profile/profile';
import { actions, utilFunc } from './page-model/common';
import { mail } from './page-model/mail';
import { compose } from './page-model/compose';
import { sidebar } from './page-model/sidebar';
import { dialog } from './page-model/dialog';
import { elements } from './page-model/elements';
import { soap } from './utils/soap-client';
import LmtpClient from './utils/lmtp-client';
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

test('C581722 L0: Read Message : Check Subject, Message Count, Condensed Message Body | Smoke ', async t => {
	await t.expect(await mail.getConversationHeaderSubject()).eql(await mail.getMessageSubject(0));
	await t.expect(await mail.getMessageLabelCount()).eql(await mail.getConverstationSectionCount() - 1);
	await mail.openCondensedMessage(0);
	await t.expect(elements.mailViewerBodySelector).ok();
});

test('C881168 L0: Reply, No Attachments Present in Original ', async t => {
	let emailBodyText = 'email body text';
	await mail.openCondensedMessage(0);
	await compose.clickReplyButton();
	await compose.enterBodyText(emailBodyText);
	await compose.sendEmail();
	await t.wait(2000);
	await sidebar.clickSidebarContent('Inbox');
	await t.eval(() => location.reload(true));
	await compose.openNewMessage();
	await t.expect(elements.inboxReadPane().exists).ok({ timeout: 10000 });
	await t.expect(await elements.conversationSectionSelector.innerText).contains(emailBodyText);
});

test('C881172 L0: Forward, No Attachments Present in Original ', async t => {
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

test.skip('Bug:PREAPPS-262 | C798475 L2: Archive a Conversation ', async t => {
	let messageSubject = await mail.getMessageSubject(0);
	await mail.clickToolbarButton('Archive');
	await t.expect(await mail.getConversationHeaderSubject()).notEql(messageSubject);
	// await t.expect(await mail.getMessageSubject(0)).notEql(messageSubject);
});

test('C951764 L1: Move message from inbox to trash ', async t => {
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

test('C951765 L0: Delete message ', async t => {
	let messageSubject = await mail.getMessageSubject(0);
	await mail.clickToolbarButton('Delete');
	await sidebar.clickSidebarContent('Trash');
	await t.expect(mail.checkMailExists(messageSubject)).ok();
});

test.skip('Bug:PREAPPS-388 | C727488 L1 :Mark as star from more options ', async t => {
	await mail.clickToolbarButton('More');
	await mail.clickPopoverMenuItem('Star');
	await t.expect(mail.checkStarEnabledInMailList()).ok();
	await mail.clickToolbarButton('More');
	await mail.clickPopoverMenuItem('Clear Star');
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

test('C945625 L1: Dragging a mail into a folder ', async t => {
	await sidebar.clickFolder(/^Folders/);
	//##todo: drag all emails from testFolder to inbox
	await t.dragToElement(mail.selectMail(0), sidebar.sidebarContentItemWithText('testFolder'));
	await sidebar.clickSidebarContent('testFolder');
	let messageCountBefore = await mail.getMailCount();
	await t.dragToElement(mail.selectMail(0), sidebar.sidebarContentItemWithText('Inbox'));
	await mail.waitProgressIndicator();
	let messageCountAfter = await mail.getMailCount();
	await t.expect(messageCountBefore - messageCountAfter).eql(1);
});

test('C726324 L1 : Create folder from context menu | SKIP: Hover is not working', async t => {
	let newFolderName = 'newFolderName';
	await sidebar.createNewFolder(/^Folders/, newFolderName);
	await t.click(sidebar.sidebarContentItemWithText(newFolderName));
	await sidebar.deleteFolder(newFolderName);
	await dialog.clickDialogOverlayButton('OK');
	await t.expect(elements.blocksDialogOverlaySelector.exists).notOk();
	await t.expect(sidebar.sidebarContentItemWithText(newFolderName).exists).notOk();
});

test('C607274 L2: Default Folder, Rename/Delete ', async t => {
	await sidebar.clickFolder(/^Folders/);
	let expectName = 'testFolder';
	let newName = 'renameFolderTest';
	await sidebar.renameFolder(expectName, newName);
	await t.expect(sidebar.sidebarContentItemWithText(newName).exists).ok();
	await sidebar.renameFolder(newName, expectName);
	await t.expect(sidebar.sidebarContentItemWithText(expectName).exists).ok();
});

test('C945624 L1: Collapse folder Folder context menu ', async t => {
	await t.expect(sidebar.sidebarContentItemWithText('testFolder').exists).notOk();
	await sidebar.clickFolder(/^Folders/);
	await t.expect(sidebar.sidebarContentItemWithText('testFolder').exists).ok();
});

test('C826803 L1 : Tap on search icon to search folder. SKIP: Hover is not working', async t => {
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

test('C726329 L1 : Move user created folder from context menu into/out from another folder (Fixed:PREAPPS-196)', async t => {
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


/************************************/
/*** Mail: Compose scroll fixture ***/
/************************************/

fixture `Mail: Compose scroll fixture`
	.page(profile.hostURL)
	.before( async ctx => {
		ctx.adminAuthToken = await soap.getAdminAuthToken();
	})
	.beforeEach( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		const lmtp = new LmtpClient();
		const filePath = path.join(__dirname, './data/mime/emails/empty.txt');
		await lmtp.send(t.ctx.user.email, filePath);
		await t.resizeWindow(1200,600);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
	});

test('C565544 - L2: Images tab, Endless Scroll', async t => {
	await mail.openEmail(0);
	await mail.clickToolbarButton(0);
	await compose.clickPlusSign();
	const startRectTop = await elements.plusSignMenuPhotoFromEmailAreaItemButton.nth(0).getBoundingClientRectProperty('top');
	await utilFunc.scrollElement.with({ dependencies: { scrollPosition: 'down' } })(elements.plusSignScrollVirtualListSelector);
	await t.wait(1000);
	const endRectTop = await elements.plusSignMenuPhotoFromEmailAreaItemButton.nth(0).getBoundingClientRectProperty('top');
	await utilFunc.scrollElement.with({ dependencies: { scrollPosition: 'up' } })(elements.plusSignScrollVirtualListSelector);
	await t
		.expect(await elements.plusSignMenuPhotoFromEmailAreaItemButton.nth(0).getBoundingClientRectProperty('top')).eql(startRectTop)
		.expect(startRectTop > endRectTop).ok();
})
	.before( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		const lmtp = new LmtpClient();
		const filePath = path.join(__dirname, './data/mime/emails/images.txt');
		await lmtp.send(t.ctx.user.email, filePath);
		await t.resizeWindow(1200,600);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
	});

test('C565545 - L2: Files tab, Endless Scroll', async t => {
	let fileName = 'PDFFile.pdf';
	await mail.openEmail(0);
	await mail.clickToolbarButton(0);
	await compose.clickPlusSign();
	await compose.clickPlusSignMenuNavItem(1);
	const startRectTop = await elements.plusSignMenuFileFromEmailAreaItemButton.withAttribute('title', fileName).getBoundingClientRectProperty('top');
	await utilFunc.scrollElement.with({ dependencies: { scrollPosition: 'down' } })(elements.plusSignScrollVirtualListSelector);
	await t.expect(elements.plusSignMenuFileFromEmailAreaItemButton.withAttribute('title', 'ExcelDocFile.xlsx').exists).ok(); // Check last file in list exists
	const endRectTop = await elements.plusSignMenuFileFromEmailAreaItemButton.withAttribute('title', fileName).getBoundingClientRectProperty('top');
	await utilFunc.scrollElement.with({ dependencies: { scrollPosition: 'up' } })(elements.plusSignScrollVirtualListSelector);
	await t
		.expect(await elements.plusSignMenuFileFromEmailAreaItemButton.withAttribute('title', fileName).getBoundingClientRectProperty('top')).eql(startRectTop)
		.expect(startRectTop > endRectTop).ok();
})
	.before( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		const lmtp = new LmtpClient();
		const filePath = path.join(__dirname, './data/mime/emails/attachments.txt');
		await lmtp.send(t.ctx.user.email, filePath);
		await t.resizeWindow(1200,600);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
	});

test('C565546 - L2: GIF tab, Endless Scroll', async t => {
	let buttonText = 'thumbs up';
	await mail.openEmail(0);
	await mail.clickToolbarButton(0);
	await compose.clickPlusSign();
	await compose.clickPlusSignMenuNavItem(2);
	await compose.clickSuggestedSearchButton(buttonText);
	const scrollItemCount = await elements.plusSignMenuGifsItemButton.count;
	const startRectTop = await elements.plusSignMenuGifsItemButton.nth(0).getBoundingClientRectProperty('top');
	await utilFunc.scrollElement.with({ dependencies: { scrollPosition: 'down' } })(elements.plusSignScrollVirtualListSelector.nth(0));
	await t
		.wait(500)
		.expect(elements.plusSignMenuGifsItemButton.nth(scrollItemCount).exists).ok({ timeout: 10000 });
	const endRectTop = await elements.plusSignMenuGifsItemButton.nth(0).getBoundingClientRectProperty('top');
	await t.expect(startRectTop > endRectTop);
});

test.skip('Bug:PREAPPS-305 | C565547 - L2: Web link tab, Endless Scroll', async t => {
	let searchText = 'shopping';
	await mail.openEmail(0);
	await mail.clickToolbarButton(0);
	await compose.clickPlusSign();
	await compose.clickPlusSignMenuNavItem(3);
	await compose.clickSuggestedSearchButton(searchText);
	const scrollItemCount = await elements.plusSignMenuSearchesItemButton.count;
	const startRectTop = await elements.plusSignMenuSearchesItemButton(0).getBoundingClientRectProperty('top');
	await utilFunc.scrollElement.with({ dependencies: { scrollPosition: 'down' } })(elements.plusSignScrollVirtualListSelector.nth(0));
	await t
		.wait(500)
		.expect(elements.plusSignMenuSearchesItemButton(scrollItemCount).exists).ok({ timeout: 10000 });
	const endRectTop = await elements.plusSignMenuSearchesItemButton(0).getBoundingClientRectProperty('top');
	await t.expect(startRectTop > endRectTop);
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
		const lmtp = new LmtpClient();
		const filePath = path.join(__dirname, './data/mime/emails/empty.txt');
		await lmtp.send(t.ctx.user.email, filePath);
		await t.maximizeWindow();
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await mail.openEmail(0);
		await mail.clickToolbarButton(0);
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
	});

test('C612377 - L2: RTE Toolbar Elements', async t => {
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

test.skip('Bug:PREAPPS-206 | C612378 - L1: Responsive Composer Toolbar ', async t => {
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

test('C769871 - L2: Attachments > Attach Photo From Email ', async t => {
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Attachments', 'Attach Photo From Email');
	await t.expect(elements.plusSignMenuPhotoFromEmailAreaItemButton.nth(0).exists).ok({ timeout: 10000 });
})
	.before( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		const lmtp = new LmtpClient();
		const filePath = path.join(__dirname, './data/mime/emails/images.txt');
		await lmtp.send(t.ctx.user.email, filePath);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await mail.openEmail(0);
		await mail.clickToolbarButton(0);
	});

test('C769872 - L2: Attachments > Attach File From Email', async t => {
	let fileName = 'WordDocFile.docx';
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Attachments', 'Attach File From Email');
	await t.expect(elements.plusSignMenuFileFromEmailAreaItemButton.withAttribute('title', fileName).exists).ok({ timeout: 10000 });
})
	.before( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		const lmtp = new LmtpClient();
		const filePath = path.join(__dirname, './data/mime/emails/attachments.txt');
		await lmtp.send(t.ctx.user.email, filePath);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await mail.openEmail(0);
		await mail.clickToolbarButton(0);
	});

test('C769873 - L2: Attachments > Attach GIF', async t => {
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Attachments', 'Attach GIF');
	await t.expect(elements.plusSignMenuPopularGIFsItemButton.nth(0).exists).ok({ timeout: 10000 });
});

test('C769874 - L2: Attachments > Attach Web Link', async t => {
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Attachments', 'Attach Web Link');
	await t.expect(elements.buttonWithText('shopping').exists).ok({ timeout: 10000 });
});

test.skip('Bug:PREAPPS-250 | C769875 - L2: Font > Type', async t => {
	let emailBodyText = 'Font';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Font', 'Classic');
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('font').getAttribute('face')).contains('TimesNewRoman');
});

test.skip('C813884 - L2: Font > Size', async t => {
	let emailBodyText = 'Size';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Font', 'Large');
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('font').getAttribute('size')).eql('5');
});

test.skip('C813885 - L2: Font > Bold', async t => {
	let emailBodyText = 'Bold';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await t.click(compose.toolbarButtonsSelector('Bold'));
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('b').exists).ok();
});

test.skip('C813886 - L2: Font > Italics', async t => {
	let emailBodyText = 'Test';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await t.click(compose.toolbarButtonsSelector('Italic'));
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('i').exists).ok();
});

test.skip('C813887 - L2: Font > Underline', async t => {
	let emailBodyText = 'Test';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await t.click(compose.toolbarButtonsSelector('Underline'));
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('u').exists).ok();
});

test.skip('Bug:PREAPPS-250 | C818253 - L2: Font > Text, Background Color', async t => {
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

test('C826615 - L2: Font > Bulleting ', async t => {
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

test('C826662 - L2: Font > Indent', async t => {
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

test.skip('Bug:PREAPPS-250 | C826709 - L2: Font > Alignment', async t => {
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

test('C826805 - L2: Hyperlink > Insert Link (Bug:PREAPPS-274)', async t => {
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

test.skip('Bug:PREAPPS-305 | C828576 - L2: Hyperlink > Search for Web Link', async t => {
	let searchText = 'shopping';
	  await compose.selectComposeToolbarPopmenu('Link', 'Search For Web Link');
	  await t.wait(500);
	  await compose.clickSuggestedSearchButton(searchText);
	  await t
		  .expect(elements.plusMenuBlockSpinner.exists).notOk({ timeout: 30000 })
		  .expect(elements.plusSignMenuSearchesItemButton(0).innerText).contains('Shopping', 'verify search result contains shopping')
		  .expect(elements.buttonWithText(searchText).exists).notOk();
	  await compose.clearComposeSearchText();
	  await t.expect(elements.buttonWithText(searchText).exists).ok({ timeout: 5000 });
});

test.skip('Bug:PREAPPS-250 | C828577 - L1: Emoticon button ', async t => {
	const expectedEmojiData = await compose.insertEmoji(0);
	const actualEmojiData = await elements.richtextareaTextContentSelector.find('img').getAttribute('src');
	await t.expect(expectedEmojiData).eql(actualEmojiData);
});