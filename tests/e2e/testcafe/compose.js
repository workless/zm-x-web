/*eslint new-cap: ["error", { "capIsNew": false }]*/
import { Selector } from 'testcafe';
import { profile } from './profile/profile';
import { compose } from './page-model/compose';
import { mail } from './page-model/mail';
import { sidebar } from './page-model/sidebar';
import { elements } from './page-model/elements';
import { actions, utilFunc } from './page-model/common';
import { soap } from './utils/soap-client';
import LmtpClient from './utils/lmtp-client';
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
	});

test('L1 | Compose, Send: To Self (basic) | C581664', async t => {
	let emailTo = t.ctx.user.email;
	let emailSubject = 'Daily test new email';
	let emailBodyText = 'Enter sample text in compose body area';
	await compose.clickCompose();
	await compose.enterTextToFieldElement(emailTo, compose.addressFieldTextField('To'));
	await compose.enterTextToFieldElement(emailSubject, elements.composerSubject);
	await compose.enterBodyText(emailBodyText);
	const actualText = await compose.getRichtextareaText();
	await t.expect(actualText).eql(emailBodyText);
	await compose.sendEmail();
	await sidebar.clickSidebarContent('Inbox');
	await t.expect(elements.mailListItemUnread.exists).ok({ timeout: 15000 });
	await compose.openMessageWithSubject(emailSubject);
	await t.expect(elements.inboxReadPane().exists).ok();
	await t.expect(await elements.inboxReadPane().innerText).contains(emailSubject);
	await compose.clickToolbarButtonByName('Delete');
	await t.expect(elements.mailListSubjectSelector.withText(emailSubject).exists).notOk();
});

test('L1 | Compose, Send: CC only (basic) | C581665', async t => {
	let userEmail = t.ctx.user.email;
	let emailSubject = 'test CC';
	await compose.clickCompose();
	await t.click(elements.ccBccButton);
	await compose.enterTextToFieldElement(userEmail, compose.addressFieldTextField('Cc'));
	await compose.enterTextToFieldElement(emailSubject, elements.composerSubject);
	await compose.enterBodyText(emailSubject);
	const actualText = await compose.getRichtextareaText();
	await t.expect(actualText).eql(emailSubject);
	await compose.sendEmail();
	await t.wait(1000);
	await sidebar.clickSidebarContent('Inbox');
	await t.expect(elements.mailListItemUnread.exists).ok({ timeout: 15000 });
	await compose.openMessageWithSubject(emailSubject);
	await t.expect(elements.inboxReadPane().exists).ok({ timeout: 10000 });
	await t.expect(await elements.inboxReadPane().innerText).contains(emailSubject);
});

test('L1 | Compose, Send: BCC only (basic) | C581666', async t => {
	let userEmail = t.ctx.user.email;
	let emailSubject = 'test BCC';
	await compose.clickCompose();
	await t.click(elements.ccBccButton);
	await compose.enterTextToFieldElement(userEmail, compose.addressFieldTextField('Bcc'));
	await compose.enterTextToFieldElement(emailSubject, elements.composerSubject);
	await compose.enterBodyText(emailSubject);
	const actualText = await compose.getRichtextareaText();
	await t.expect(actualText).eql(emailSubject);
	await compose.sendEmail();
	await t.wait(1000);
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
	await compose.clickCompose();
	await compose.enterTextToFieldElement(userEmail, compose.addressFieldTextField('To'));
	await compose.enterBodyText(emailBodyText);
	const actualText = await compose.getRichtextareaText();
	await t.expect(actualText).eql(emailBodyText);
	await compose.sendEmail();
	await t.wait(1000);
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
	await compose.clickCompose();
	await compose.enterTextToFieldElement(userEmail, compose.addressFieldTextField('To'));
	await compose.enterTextToFieldElement(emailSubject, elements.composerSubject);
	await compose.sendEmail();
	await t.wait(1000);
	await sidebar.clickSidebarContent('Inbox');
	await t.expect(elements.mailListItemUnread.exists).ok({ timeout: 15000 });
	await compose.openMessageWithSubject(emailSubject);
	await t.expect(elements.inboxReadPane().exists).ok({ timeout: 10000 });
	await t.expect(await elements.inboxReadPane().innerText).contains(emailSubject);
});

test('L1 | Compose, Send: To 3rd party (basic) | C581663', async t => {
	let userEmail = 'yang.cai@synacor.com';
	let emailSubject = 'email subject';
	await compose.clickCompose();
	await compose.enterTextToFieldElement(userEmail, compose.addressFieldTextField('To'));
	await compose.enterTextToFieldElement(emailSubject, elements.composerSubject);
	await compose.enterBodyText(emailSubject);
	await compose.sendEmail();
	await sidebar.clickSidebarContent('Sent');
	await t.eval(() => location.reload(true));
	await compose.openMessageWithSubject(emailSubject);
	await t.expect(elements.inboxReadPane().exists).ok({ timeout: 10000 });
	await t.expect(await elements.inboxReadPane().innerText).contains(emailSubject);
});

test('L1 | Compose, Send: To, CC, BCC (basic) | C581667 | Bug:PREAPPS-357 | ##TODO-add Bcc verify after', async t => {
	let user1Email = 'yang.cai@synacor.com';
	let user2Email = 'ui.testing@ec2-13-58-225-137.us-east-2.compute.amazonaws.com';
	let user3Email = 'caiiac@hotmail.com';
	let emailSubject = 'email subject';
	await compose.clickCompose();
	await t.click(elements.ccBccButton);
	await compose.enterTextToFieldElement(user1Email, compose.addressFieldTextField('To'));
	if (!elements.ccBccHideButton.exists) {
		await t.click(elements.ccBccButton);
	}
	await compose.enterTextToFieldElement(user2Email, compose.addressFieldTextField('Cc'));
	await compose.enterTextToFieldElement(user3Email, compose.addressFieldTextField('Bcc'));
	await compose.enterTextToFieldElement(emailSubject, elements.composerSubject);
	await compose.enterBodyText(emailSubject);
	await compose.sendEmail();
	await sidebar.clickSidebarContent('Sent');
	await t.eval(() => location.reload(true));
	await compose.openMessageWithSubject(emailSubject);
	await t
		.expect(elements.addressListAddress.find('span').withAttribute('title', user1Email).exists).ok({ timeout: 5000 })
		.expect(elements.addressListAddressType.withText('To').parent('div').find('span').withText('yang cai').exists).ok()
		.expect(elements.addressListAddress.find('span').withAttribute('title', user2Email).exists).ok()
		.expect(elements.addressListAddressType.withText('Cc').parent('div').find('span').withText('ui testing').exists).ok();
});

test('L1 | Reply to Message Containing Inline Attachments | C881169 ', async t => {
	let emailBodyText = 'reply email';
	let replyEmailSubject = 'Re: Inline attachement';
	await compose.openNewMessage();
	await compose.clickReplyButton();
	await compose.enterBodyText(emailBodyText);
	await compose.sendEmail();
	await sidebar.clickSidebarContent('Sent');
	await t.eval(() => location.reload(true));
	await compose.openMessageWithSubject(replyEmailSubject);
	await mail.openCondensedMessage(0);
	await t
		.expect(elements.clientHtmlViewerInner.find('img').exists).ok({ timeout: 5000 })
		.expect(await elements.clientHtmlViewerInner.nth(1).innerText).contains(emailBodyText);
})
	.before( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		const lmtp = new LmtpClient();
		const filePath = path.join(__dirname, './data/mime/emails/single-inline-attachment.txt');
		await lmtp.send(t.ctx.user.email, filePath);
		await t.maximizeWindow();
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
	});

	test('L1 | Reply to Message Containing File Attachments, Add New Recipient, Include Orig. Attachments | C881170', async t => {
		let emailBodyText = 'reply email';
		let replyEmailSubject = 'Re: file attachment';
		let userEmail = 'synacorusa@outlook.com';
		let fileName = 'PDF_Document.pdf';
		await compose.openNewMessage();
		await compose.clickReplyButton();
		await compose.enterTextToFieldElement(userEmail, compose.addressFieldTextField('To'));
		await compose.enterBodyText(emailBodyText);
		await compose.sendEmail();
		await t
			.expect(elements.dialogSelector.exists).ok({ timeout: 5000 })
			.expect(await elements.dialogSelector.innerText).contains('Include original attachments?');
		await t.click(elements.dialogSelector.find('button').withText('Yes'));
		await sidebar.clickSidebarContent('Sent');
		await t.eval(() => location.reload(true));
		await compose.openMessageWithSubject(replyEmailSubject);
		await mail.openCondensedMessage(0);
		await t
			.expect(elements.attachmentNameSelector.withText(fileName)).ok({ timeout: 5000 })
			.expect(await elements.clientHtmlViewerInner.nth(1).innerText).contains(emailBodyText);

	})
		.before( async t => {
			t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
			t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
			const lmtp = new LmtpClient();
			const filePath = path.join(__dirname, './data/mime/emails/single-file-attachment.txt');
			await lmtp.send(t.ctx.user.email, filePath);
			await t.maximizeWindow();
			await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
			await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 }); 
		});

	test('L1 | Reply to Message Containing File Attachments, Add New Recipient, Do Not Include Orig | C881171', async t => {
		let emailBodyText = 'reply email';
		let replyEmailSubject = 'Re: file attachment';
		let userEmail = 'synacorusa@outlook.com';
		let fileName = 'PDF_Document.pdf';
		await compose.openNewMessage();
		await compose.clickReplyButton();
		await compose.enterTextToFieldElement(userEmail, compose.addressFieldTextField('To'));
		await compose.enterBodyText(emailBodyText);
		await compose.sendEmail();
		await t
			.expect(elements.dialogSelector.exists).ok({ timeout: 5000 })
			.expect(await elements.dialogSelector.innerText).contains('Include original attachments?');
		await t.click(elements.dialogSelector.find('button').withText('No'));
		await sidebar.clickSidebarContent('Sent');
		await t.eval(() => location.reload(true));
		await compose.openMessageWithSubject(replyEmailSubject);
		await mail.openCondensedMessage(0);
		await t.expect(await elements.clientHtmlViewerInner.nth(1).innerText).contains(emailBodyText);
		//logout
		
		//switch to user2
		await actions.loginEmailPage(t.ctx.user2.email, t.ctx.user2.password);
		//delete user2

		await t.expect(elements.attachmentNameSelector.withText(fileName)).notOk({ timeout: 5000 })
		await soap.deleteAccount(t.ctx.user2.id, t.fixtureCtx.adminAuthToken);
	})
	.before( async t => {
		t.ctx.user1 = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.user1Auth = await soap.getUserAuthToken(t.ctx.user1.email, t.ctx.user1.password);
		t.ctx.user2 = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.user2Auth = await soap.getUserAuthToken(t.ctx.user2.email, t.ctx.user2.password);
		const lmtp = new LmtpClient();
		const filePath = path.join(__dirname, './data/mime/emails/single-file-attachment.txt');
		await lmtp.send(t.ctx.user1.email, filePath);
		await t.maximizeWindow();
		await actions.loginEmailPage(t.ctx.user1.email, t.ctx.user1.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 }); 
	});

/****************************/
/*** Compose, Functional  ***/

test('L2 | Compose: No Data, Send | C581629 | Smoke', async t => {
	let errorMessage = 'No recipient addresses';
	await compose.clickCompose();
	await compose.sendEmail();
	await t.expect(elements.composerFooter.withText(errorMessage).exists).ok({ timeout: 10000 });
});

test('L1 | Compose: Data Present, Exit (X) | C581630', async t => {
	let userEmail = t.ctx.user.email;
	let emailSubject = 'email subject';
	await compose.clickCompose();
	await compose.enterTextToFieldElement(userEmail, compose.addressFieldTextField('To'));
	await compose.enterTextToFieldElement(emailSubject, elements.composerSubject);
	await compose.enterBodyText(emailSubject);
	await t.wait(2000);
	await compose.closeCompose();
	await t.expect(compose.addressFieldTextField('To').exists).notOk({ timeout: 2000 });
	await sidebar.clickSidebarContent('Drafts');
	await t.eval(() => location.reload(true));
	await compose.openMessageWithSubject(emailSubject);
	await t.expect(elements.inboxReadPane().exists).ok({ timeout: 10000 });
	await t.expect(await elements.inboxReadPane().innerText).contains(emailSubject);
});

test('L1 | Compose: Data visibility | C666681', async t => {
	let emailBodyText = '';
	for (let i = 0; i < 100; i++) {
		emailBodyText = emailBodyText + i + '<br>';
	}
	await compose.clickCompose();
	await compose.enterBodyText(emailBodyText);
	const startRectTop = await elements.richtextareaContainer.getBoundingClientRectProperty('top');
	await utilFunc.scrollElement.with({ dependencies: { scrollPosition: 'down' } })(elements.composerScrollContainer);
	await t.wait(1000);
	const endRectTop = await elements.richtextareaContainer.getBoundingClientRectProperty('top');
	await utilFunc.scrollElement.with({ dependencies: { scrollPosition: 'up' } })(elements.composerScrollContainer);
	await t
		.expect(await elements.richtextareaContainer.getBoundingClientRectProperty('top')).eql(startRectTop)
		.expect(startRectTop > endRectTop).ok();
});

/***************************************/
/*** Compose: Composer view fixture  ***/
/***************************************/

fixture `Compose: Composer view fixture`
	.page(profile.hostURL)
	.before( async ctx => {
		ctx.adminAuthToken = await soap.getAdminAuthToken();
	})
	.beforeEach( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		//const lmtp = new LmtpClient();
		//const filePath = path.join(__dirname, './data/mime/emails/empty.txt');
		//await lmtp.send(t.ctx.user.email, filePath);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await compose.clickCompose();
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
	});

test('L1 | Enter multiple emails to To text field | C945626', async t => {
	let testMailA = 'aa@mail.com';
	let testMailB = 'bb@mail.com';
	let testMailC = 'cc@mail.com';
	await compose.enterTextToFieldElement(testMailA, compose.addressFieldTextField('To'));
	await compose.enterTextToFieldElement(testMailB, compose.addressFieldTextField('To'));
	await compose.enterTextToFieldElement(testMailC, compose.addressFieldTextField('To'));
	await t
		.expect(compose.buttonAddressFieldTokenLabel('aa').exists).ok()
		.expect(compose.buttonAddressFieldTokenLabel('bb').exists).ok()
		.expect(compose.buttonAddressFieldTokenLabel('cc').exists).ok()
		.expect(await elements.buttonListAddressFieldTokenLabel.count).eql(3);
});

test('L1 | Enter email address into Cc/Bcc address field | C945627', async t => {
	let ccMail = 'Cc@mail.com';
	let bccMail = 'Bcc@mail.com';
	await t.click(elements.ccBccButton);
	await compose.enterTextToFieldElement(ccMail, compose.addressFieldTextField('Cc'));
	await compose.enterTextToFieldElement(bccMail, compose.addressFieldTextField('Cc'));
	await compose.enterTextToFieldElement(ccMail, compose.addressFieldTextField(/^Bcc/));
	await compose.enterTextToFieldElement(bccMail, compose.addressFieldTextField(/^Bcc/));
	await t
		.expect(compose.buttonAddressFieldTokenLabel('Cc').exists).ok()
		.expect(compose.buttonAddressFieldTokenLabel('Bcc').exists).ok()
		.expect(await elements.buttonListAddressFieldTokenLabel.count).eql(4);
});

test('L1 | Compose: No Data, Exit (X) | C581628', async t => {
	await t.click(elements.ccBccButton);
	await compose.closeCompose();
	await t.expect(elements.composerBody.exists).notOk({ timeout: 5000 });
});

test.skip('Lx | Compose: Hover and click plus sign menu image thumbnail to add/remove attachments | Cxxxxxx | SKIP: Hover is not working ', async t => {
	for (let i = 0; i < 4; i ++) {
		await compose.clickPlusSign();
		await t
			.hover(elements.plusSignMenuPhotoFromEmailAreaItemButton.nth(i))
			.expect(elements.plusSignMenuPhotoFromEmailAreaItemButton.nth(i).child('.blocks_scrim').exists).ok({ timeout: 30000 })
			.click(elements.plusSignMenuPhotoFromEmailAreaItemButton.nth(i));
	}
	let expectedAttachedImageIdArray = await compose.getAttachedImageDataCidArray();
	await t.expect(await compose.getNumberOfAttachedImage()).eql(4);
	for (let i=0; i < 2; i ++) {
		await compose.removeTopAttachedImage();
	}
	await t.expect(await compose.getNumberOfAttachedImage()).eql(2);
	let actualAttachedImageIdArray = await compose.getAttachedImageDataCidArray();
	expectedAttachedImageIdArray.splice(0,2);
	//check remove attached image by verifing the attached images in the richtextarea by checking the attached image 'data-cid' (this id is unique id)
	await t.expect(actualAttachedImageIdArray).eql(expectedAttachedImageIdArray);
})
	.before( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		const lmtp = new LmtpClient();
		const filePath = path.join(__dirname, './data/mime/emails/images.txt');
		await lmtp.send(t.ctx.user.email, filePath);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await compose.clickCompose();
	});

test.skip('L2 | Images Tab, Drag/Drop into ATTACH drop zone | C565555 | SKIP:PREAPPS-302', async t => {
	await compose.clickPlusSign();
	await utilFunc.verifyDragDropArea.with({ dependencies: { getDropzone: elements.dragDropFileArea } })();
	await t.dragToElement(elements.plusSignMenuPhotoFromEmailAreaItemButton.nth(0), elements.richtextToolbarContainer, { speed: 0.1 });
	await t.expect(await t.eval(() => window.dropZoneExist)).ok();
	for (let i = 1; i< 3; i ++) {
		await t.dragToElement(elements.plusSignMenuPhotoFromEmailAreaItemButton.nth(i), elements.richtextToolbarContainer, { speed: 0.2 });
	}
	await t.expect(elements.attachedFileList.count).eql(3);
	await compose.removeAttachedFile(0);
	await t.expect(elements.attachedFileList.count).eql(2);
})
	.before( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		const lmtp = new LmtpClient();
		const filePath = path.join(__dirname, './data/mime/emails/images.txt');
		await lmtp.send(t.ctx.user.email, filePath);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await compose.clickCompose();
	});

test.skip('L2 | Images Tab, Drag/Drop into EMBED drop zone | C565554 | SKIP:PREAPPS-302 | ##TODO: C648032 L2: Images Tab, Search', async t => {
	await compose.clickPlusSign();
	await utilFunc.verifyDragDropArea.with({ dependencies: { getDropzone: elements.dragDropInlineImageArea } })();
	await t.dragToElement(elements.plusSignMenuPhotoFromEmailAreaItemButton.nth(0), elements.richtextarea, { speed: 0.1 });
	await t.expect(await t.eval(() => window.dropZoneExist)).ok();
	for (let i = 0; i < 2; i++) {
		await t.dragToElement(elements.plusSignMenuPhotoFromEmailAreaItemButton.nth(i), elements.richtextarea, { speed: 0.5 });
	}
	await t.expect(await compose.getNumberOfAttachedImage()).eql(3);
})
	.before( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		const lmtp = new LmtpClient();
		const filePath = path.join(__dirname, './data/mime/emails/images.txt');
		await lmtp.send(t.ctx.user.email, filePath);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await compose.clickCompose();
	});

test.skip('L1 | Images Tab, Filtering | C548609 | SKIP:PREAPPS-302', async t => {
	let searchText = 'zimbra-logo-color';
	await compose.clickPlusSign();
	//enter "a" to search field
	await compose.enterTextToFieldElement('a', elements.searchField);
	await t.expect(elements.plusMenuBlockSpinner.exists).notOk({ timeout: 30000 });
	await t.expect(await elements.plusSignMenuPhotoFromEmailArea.innerText).contains('No results found for "a". Try searching', 'Verify that no results found from photos', { timeout: 5000 });
	//click remove button on the search field to remove the searched text
	await compose.clearComposeSearchText();
	await t.expect(elements.plusMenuBlockSpinner.exists).notOk({ timeout: 30000 });
	let numberPhotos = await elements.plusSignMenuPhotoFromEmailAreaItemButton.count;
	await t.expect(numberPhotos > 0).ok();
	//enter "testImage" to search field
	await compose.enterTextToFieldElement(searchText, elements.searchField);
	await t.expect(elements.plusMenuBlockSpinner.exists).notOk({ timeout: 30000 });
	await t.expect(await elements.plusSignMenuPhotoFromEmailAreaItemButton.count > 0).ok();
})
	.before( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		const lmtp = new LmtpClient();
		const filePath = path.join(__dirname, './data/mime/emails/images.txt');
		await lmtp.send(t.ctx.user.email, filePath);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await compose.clickCompose();
	});

test.skip('L1 | Files Tab, Filtering | C548610 | SKIP:PREAPPS-302 | ##TODO: C648033 L2: Files Tab, Search ', async t => {
	let fileName = 'PDFFile.pdf';
	await compose.clickPlusSign();
	await compose.clickPlusSignMenuNavItem(1);
	await t.expect(await elements.plusSignMenuFileFromEmailArea.innerText).contains(fileName, 'Verify plus-sign-menu-tab contains file. ', { timeout: 10000 });
	await compose.clickFileFromEmail(fileName);
	await t.expect(await elements.attachedFileList.count).eql(1);
})
	.before( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		const lmtp = new LmtpClient();
		const filePath = path.join(__dirname, './data/mime/emails/attachments.txt');
		await lmtp.send(t.ctx.user.email, filePath);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await compose.clickCompose();
	});

test.skip('L2 | Files Tab, Drag/Drop into EMBED drop zone | C565556 | SKIP:PREAPPS-302', async t => {
	let fileName = 'PDFFile.pdf';
	await compose.clickPlusSign();
	await compose.clickPlusSignMenuNavItem(1);
	await utilFunc.verifyDragDropArea.with({ dependencies: { getDropzone: elements.dragDropInlineImageArea } })();
	await t.dragToElement(elements.plusSignMenuFileFromEmailAreaItemButton.withAttribute('title', fileName), elements.richtextToolbarContainer, { speed: 0.1 });
	await t.expect(await t.eval(() => window.dropZoneExist)).ok();
	await t
		.expect(await elements.attachedFileList.count).eql(1)
		.expect(compose.getAttachmentInnerText()).contains(fileName, 'verify that files are attached to the email', { timeout: 5000 });
})
	.before( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		const lmtp = new LmtpClient();
		const filePath = path.join(__dirname, './data/mime/emails/attachments.txt');
		await lmtp.send(t.ctx.user.email, filePath);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await compose.clickCompose();
	});

test.skip('L2 | Files Tab, Drag/Drop into ATTACH drop zone | C565557 | SKIP:PREAPPS-302', async t => {
	let fileName = 'PDFFile.pdf';
	await compose.clickPlusSign();
	await compose.clickPlusSignMenuNavItem(1);
	await utilFunc.verifyDragDropArea.with({ dependencies: { getDropzone: elements.dragDropInlineImageArea } })();
	await t.dragToElement(elements.plusSignMenuFileFromEmailAreaItemButton.withAttribute('title', fileName), elements.richtextarea, { speed: 0.1 });
	await t.expect(await t.eval(() => window.dropZoneExist)).ok();
	await t
		.expect(await elements.attachedFileList.count).eql(1)
		.expect(compose.getAttachmentInnerText()).contains(fileName, 'verify that files are attached to the email', { timeout: 10000 });
})
	.before( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		const lmtp = new LmtpClient();
		const filePath = path.join(__dirname, './data/mime/emails/attachments.txt');
		await lmtp.send(t.ctx.user.email, filePath);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await compose.clickCompose();
	});

test.skip('L2 | GIF Hover, click to add popular gifs as inline attachments | C733285 | Bug:PREAPPS-175 | SKIP:PREAPPS-302', async t => {
	await compose.clickPlusSign();
	await compose.clickPlusSignMenuNavItem(2);
	for (let i = 0; i < 4; i ++) {
		await t
			.hover(elements.plusSignMenuPopularGIFsItemButton.nth(i))
			.wait(3000)
			.expect(elements.plusSignMenuPopularGIFsItemButton.nth(i).child('.blocks_scrim').exists).ok()
			.click(elements.plusSignMenuPopularGIFsItemButton.nth(i));
	}
	let expectedAttachedImageIdArray = await compose.getAttachedImageDataCidArray();
	await t.expect(await compose.getNumberOfAttachedImage()).eql(4);
	for (let i=0; i < 2; i ++) {
		await compose.removeTopAttachedImage();
	}
	await t.expect(await compose.getNumberOfAttachedImage()).eql(2);
	let actualAttachedImageIdArray = await compose.getAttachedImageDataCidArray();
	expectedAttachedImageIdArray.splice(0,2);
	//check remove attached image by verifing the attached images in the richtextarea by checking the attached image 'data-cid' (this id is unique id)
	await t.expect(actualAttachedImageIdArray).eql(expectedAttachedImageIdArray);
});

test.skip('L2 | GIF Tab, Search | C648034 | SKIP:PREAPPS-302 | ##TODO:C548611 L1: GIF Tab, Filtering ', async t => {
	let buttonText = 'thumbs up';
	await compose.clickPlusSign();
	await compose.clickPlusSignMenuNavItem(2);
	await compose.clickSuggestedSearchButton(buttonText);
	await t
		.expect(elements.buttonWithText(buttonText).exists).notOk({ timeout: 5000 })
		.expect(elements.plusSignMenuGifsItemButton.nth(0).exists).ok();
	await compose.clearComposeSearchText();
	await t
		.expect(elements.buttonWithText(buttonText).exists).ok({ timeout: 5000 })
		.expect(elements.plusSignMenuGifsItemButton.nth(0).exists).ok();
});

test.skip('L1 | Web Link Tab, Filtering | C548612 | Bug:PREAPPS-305', async t => {
	let searchText = 'shopping';
	await compose.clickPlusSign();
	await compose.clickPlusSignMenuNavItem(3);
	await compose.clickSuggestedSearchButton(searchText);
	await t
		.expect(elements.plusMenuBlockSpinner.exists).notOk({ timeout: 30000 })
		.expect(elements.plusSignMenuSearchesItemButton(0).innerText).contains('Shopping', 'verify search result contains shopping')
		.expect(elements.buttonWithText(searchText).exists).notOk();
	await compose.clearComposeSearchText();
	await t.expect(elements.buttonWithText(searchText).exists).ok({ timeout: 5000 });
});

test('L1 | Compose: Data visibility (view, addresses, subject) | C581633 | Compose: Test address field suggestions ', async t => {
	let labelText = 'ui.testing';
	let selectLabelText = 'test user';
	await t
		.click(compose.addressFieldTextField('To'))
		.typeText(compose.addressFieldTextField('To'), labelText)
		.expect(elements.addressFieldSuggestions.nth(0).exists).ok({ timeout: 30000 });
	await t
		.expect(await elements.addressFieldSuggestions.count > 0).ok();
	compose.clickAddressFieldSuggesstionByIndex(0);
	await t
		.expect(elements.addressFieldSuggestions.nth(0).exists).notOk({ timeout: 20000 });
	await t.click(compose.buttonAddressFieldTokenLabel(selectLabelText));
	await t.expect(await elements.blocksTooltip.innerText).contains(labelText, 'verify tooltip content. ', { timeout: 3000 });
})
	.before( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		// Get contacts parents folder ID
		const parentFolderID = await soap.contactGetFolder(t.ctx.userAuth);
		// Create contact
		await soap.createContact(t.ctx.userAuth, parentFolderID, 'test user', '' , 'ui.testing@abc.com');
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await compose.clickCompose();
	});

test('L2 | Compose, Autocompleter, CC - Match on Email Address, select | C581673', async t => {
	let labelText = 'ui.testing';
	let selectLabelText = 'test user';
	await t.click(elements.ccBccButton);
	await t
		.click(compose.addressFieldTextField('Cc'))
		.typeText(compose.addressFieldTextField('Cc'), labelText)
		.expect(elements.addressFieldSuggestions.nth(0).exists).ok({ timeout: 30000 });
	await t
		.expect(await elements.addressFieldSuggestions.count > 0).ok();
	compose.clickAddressFieldSuggesstionByIndex(0);
	await t
		.expect(elements.addressFieldSuggestions.nth(0).exists).notOk({ timeout: 20000 });
	await t.click(compose.buttonAddressFieldTokenLabel(selectLabelText));
	await t.expect(await elements.blocksTooltip.innerText).contains(labelText, 'verify tooltip content. ', { timeout: 3000 });
})
	.before( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		// Get contacts parents folder ID
		const parentFolderID = await soap.contactGetFolder(t.ctx.userAuth);
		// Create contact
		await soap.createContact(t.ctx.userAuth, parentFolderID, 'test user', '' , 'ui.testing@abc.com');
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await compose.clickCompose();
	});

test('L2 | Compose, Autocompleter, BCC - Match on Email Address, select | C581674', async t => {
	let labelText = 'ui.testing';
	let selectLabelText = 'test user';
	await t.click(elements.ccBccButton);
	await t
		.click(compose.addressFieldTextField('Bcc'))
		.typeText(compose.addressFieldTextField('Bcc'), labelText)
		.expect(elements.addressFieldSuggestions.nth(0).exists).ok({ timeout: 30000 });
	await t
		.expect(await elements.addressFieldSuggestions.count > 0).ok();
	compose.clickAddressFieldSuggesstionByIndex(0);
	await t
		.expect(elements.addressFieldSuggestions.nth(0).exists).notOk({ timeout: 20000 });
	await t.click(compose.buttonAddressFieldTokenLabel(selectLabelText));
	await t.expect(await elements.blocksTooltip.innerText).contains(labelText, 'verify tooltip content. ', { timeout: 3000 });
})
	.before( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		// Get contacts parents folder ID
		const parentFolderID = await soap.contactGetFolder(t.ctx.userAuth);
		// Create contact
		await soap.createContact(t.ctx.userAuth, parentFolderID, 'test user', '' , 'ui.testing@abc.com');
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await compose.clickCompose();
	});

test.skip('L1 | General Behavior, Open/Close | C548608 | SKIP:PREAPPS-302', async t => {
	await t.expect(elements.menuSearchSelector.exists).notOk({ timeout: 2000 });
	await compose.clickPlusSign();
	await t.expect(elements.menuSearchSelector.visible).ok({ timeout: 2000 });
	await compose.clickPlusSign();
	await t.expect(elements.menuSearchSelector.visible).notOk({ timeout: 2000 });
});


/************************************/
/*** Compose: Scroll fixture ***/
/************************************/

fixture `Compose: Scroll fixture`
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
		await compose.clickCompose();
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
	});

test.skip('L2 | Images tab, Endless Scroll | C500831 | SKIP:PREAPPS-302', async t => {
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
		await compose.clickCompose();
	});

test.skip('L2 | Files tab, Endless Scroll | C500832 | SKIP:PREAPPS-302', async t => {
	let fileName = 'PDFFile.pdf';
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
		await compose.clickCompose();
	});

test.skip('L2 | GIF tab, Endless Scroll | C500833 | SKIP:PREAPPS-302', async t => {
	let buttonText = 'thumbs up';
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
	await t
		.expect(startRectTop > endRectTop);
});

test.skip('L2 | Web link tab, Endless Scroll | C500834 | Bug:PREAPPS-305', async t => {
	let searchText = 'shopping';
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
	await t
		.expect(startRectTop > endRectTop);
});

/*********************************/
/*** Compose: Rich Text Editor ***/
/*********************************/

fixture `Compose: Rich Text Editor fixture`
	.page(profile.hostURL)
	.before( async ctx => {
		ctx.adminAuthToken = await soap.getAdminAuthToken();
	})
	.beforeEach( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		await t.maximizeWindow();
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await compose.clickCompose();
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
	});

test('L2 | RTE Toolbar Elements | C610129', async t => {
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

test('L1 | Responsive Composer Toolbar | C610130 | Fixed:PREAPPS-206', async t => {
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	const toolbarItemCount = await elements.componentsToolbarMiddleSelector.child().count;
	await t
		.resizeWindow(720,720)
		.wait(2000);
	const toolbarItemCount2 = await elements.componentsToolbarMiddleSelector.child().count;
	await t.expect(toolbarItemCount > toolbarItemCount2).ok();
	await t
		.maximizeWindow()
		.wait(2000);
	await t
		.expect(await elements.componentsToolbarMiddleSelector.child().count).eql(toolbarItemCount);
});

test.skip('L2 | Attachments > Attach Photo From Email | C648038 | SKIP:PREAPPS-302', async t => {
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
		await compose.clickCompose();
	});

test.skip('L2 | Attachments > Attach File From Email | C648039 | SKIP:PREAPPS-302', async t => {
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
		await compose.clickCompose();
	});

test.skip('L2 | Attachments > Attach GIF | C648040 | SKIP:PREAPPS-302', async t => {
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Attachments', 'Attach GIF');
	await t.expect(elements.plusSignMenuPopularGIFsItemButton.nth(0).exists).ok({ timeout: 10000 });
});

test.skip('L2 | Attachments > Attach Web Link | C648041 | SKIP:PREAPPS-302', async t => {
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Attachments', 'Attach Web Link');
	await t.expect(elements.buttonWithText('shopping').exists).ok({ timeout: 10000 });
});

test.skip('L2 | Font > Type | C665561 | Bug:PREAPPS-250', async t => {
	let emailBodyText = 'Font';
	//await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.click(elements.richtextareaTextContentSelector);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Font', 'Classic');
	await compose.enterBodyText(emailBodyText);
	await t.expect(await elements.richtextareaTextContentSelector.find('font').getAttribute('face')).contains('TimesNewRoman');
});

test.skip('L2 | Font > Size | C665562 | Bug:PREAPPS-250', async t => {
	let emailBodyText = 'Size';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Font', 'Large');
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('font').getAttribute('size')).eql('5');
});

test.skip('L2 | Font > Bold | C665611', async t => {
	let emailBodyText = 'Bold';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await t.click(compose.toolbarButtonsSelector('Bold'));
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('b').exists).ok();
});

test.skip('L2 | Font > Italics | C665612', async t => {
	let emailBodyText = 'Test';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await t.click(compose.toolbarButtonsSelector('Italic'));
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('i').exists).ok();
});

test.skip('L2 | Font > Underline | C665613', async t => {
	let emailBodyText = 'Test';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await t.click(compose.toolbarButtonsSelector('Underline'));
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('u').exists).ok();
});

test.skip('L2 | Font > Text, Background Color | C665614', async t => {
	let expectedFontColor = '#888888';
	let expectedFontBackgroundColor = 'rgb(136, 136, 136)';
	let emailBodyText = 'Test';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComoposeToolbarFontColor('Text', 1);
	await compose.selectComoposeToolbarFontColor('Highlight', 1);
	await t.expect(await elements.richtextareaTextContentSelector.find('font').getStyleProperty('background-color')).eql(expectedFontBackgroundColor);
	await t.expect(await elements.richtextareaTextContentSelector.find('font').getAttribute('color')).eql(expectedFontColor);
});

test('L2 | Font > Bulleting | C668231', async t => {
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

test('L2 | Font > Indent | C668232', async t => {
	let emailBodyText = 'This is line 1<br>This is line 2';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 15, 30);
	await compose.selectComposeToolbarListsByIndex('Indentation', 0);
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('blockquote').exists).ok();
	await compose.selectComposeToolbarListsByIndex('Indentation', 1);
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('blockquote').exists).notOk({ timeout: 30000 });
});

test('L2 | Font > Alignment | C668233', async t => {
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

test('L2 | Hyperlink > Insert Link | C668234 | Fixed:PREAPPS-274', async t => {
	let emailBodyText = 'test';
	let linkUrl = 'http://www.google.ca';
	await compose.selectComposeToolbarPopmenu('Link', 'Insert Link');
	await compose.insertDisplayText(emailBodyText);
	await compose.insertTextLink(linkUrl);
	await t
		.expect(await elements.richtextareaTextContentSelector.find('a').withText(emailBodyText).exists).ok()
		.expect(await elements.richtextareaTextContentSelector.find('a').getAttribute('href')).eql(linkUrl)
		.expect(await elements.richtextareaTextContentSelector.find('tbody').find('h2').innerText).eql('Google')
		.expect((await elements.richtextareaTextContentSelector.innerText).split(emailBodyText).length - 1).eql(1);
});

test.skip('L2 | Hyperlink > Search for Web Link | C668237 | Bug:PREAPPS-305', async t => {
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

test.skip('L1 | Emoticon button | C668238 | Bug:PREAPPS-383', async t => {
	const expectedEmojiData = await compose.insertEmoji(0);
	const actualEmojiData = await elements.richtextareaTextContentSelector.find('img').getAttribute('src');
	await t.expect(expectedEmojiData).eql(actualEmojiData);
});

/*****************************************/
/*** Compose: Attachement upload Files ***/
/*****************************************/

fixture `Compose: Attachement upload Files`
	.page(profile.hostURL)
	.before( async ctx => {
		ctx.adminAuthToken = await soap.getAdminAuthToken();
	})
	.beforeEach( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await compose.clickCompose();
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
	});

test('L2 | Compose, Send: File Attachment, No Message Body | C581643 | ##TODO: C548614 L1: Add Attachments ', async t => {
	let emailSubject = '[No subject]';
	let emailTo = t.ctx.user.email;
	const filePath = path.join(__dirname, './data/files/JPEG_Image.jpg');
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Attachments', 'Attach From My Computer');
	await t.setFilesToUpload(Selector('input').withAttribute('type', 'file'), filePath);
	await t
		.expect(elements.attachmentNameSelector.exists).ok({ timeout: 5000 })
		.expect(elements.attachmentNameSelector.innerText).contains('JPEG_Image');
	await compose.enterTextToFieldElement(emailTo, compose.addressFieldTextField('To'));
	await compose.sendEmail();
	await t.wait(1000);
	await sidebar.clickSidebarContent('Inbox');
	await t.eval(() => location.reload(true));
	await t.expect(elements.mailListItemUnread.exists).ok({ timeout: 15000 });
	await compose.openNewMessage();
	await t.expect(elements.inboxReadPane().exists).ok({ timeout: 10000 });
	await t.expect(await elements.inboxReadPane().innerText).contains('No subject');
	await t.expect(elements.mailListSubjectSelector.withText(emailSubject).exists).ok({ timeout: 5000 });
	await t
		.expect(elements.attachmentNameSelector.exists).ok({ timeout: 5000 })
		.expect(elements.attachmentNameSelector.innerText).contains('JPEG_Image');
});

test('L2 | Compose, Send: File Attachment, Message Body | C581642', async t => {
	let emailContent = 'email text';
	let emailTo = t.ctx.user.email;
	const filePath = path.join(__dirname, './data/files/JPEG_Image.jpg');
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Attachments', 'Attach From My Computer');
	await t.setFilesToUpload(Selector('input').withAttribute('type', 'file'), filePath);
	await t
		.expect(elements.attachmentNameSelector.exists).ok({ timeout: 5000 })
		.expect(elements.attachmentNameSelector.innerText).contains('JPEG_Image');
	await compose.enterTextToFieldElement(emailTo, compose.addressFieldTextField('To'));
	await compose.enterTextToFieldElement(emailContent, elements.composerSubject);
	await compose.enterBodyText(emailContent);
	const actualText = await compose.getRichtextareaText();
	await t.expect(actualText).eql(emailContent);
	await compose.sendEmail();
	await t.wait(1000);
	await sidebar.clickSidebarContent('Inbox');
	await t.eval(() => location.reload(true));
	await t.expect(elements.mailListItemUnread.exists).ok({ timeout: 15000 });
	await compose.openNewMessage();
	await t.expect(elements.inboxReadPane().exists).ok({ timeout: 10000 });
	await t.expect(await elements.inboxReadPane().innerText).contains(emailContent);
	await t.expect(elements.mailListSubjectSelector.withText(emailContent).exists).ok({ timeout: 5000 });
	await t
		.expect(elements.attachmentNameSelector.exists).ok({ timeout: 5000 })
		.expect(elements.attachmentNameSelector.innerText).contains('JPEG_Image');
});

test('L2 | Compose, Send, File Attachment, File Type Support | C813888', async t => {
	let fs = require('fs');
	let emailTo = t.ctx.user.email;
	const folderPath = path.join(__dirname, './data/files/');
	let fileList = fs.readdirSync(folderPath);
	for (let i = 0; i < fileList.length; i ++) {
		fileList[i] = folderPath + fileList[i];
	}
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.enterTextToFieldElement(emailTo, compose.addressFieldTextField('To'));
	await compose.selectComposeToolbarPopmenu('Attachments', 'Attach From My Computer');
	await t.setFilesToUpload(Selector('input').withAttribute('type', 'file'), fileList);
	await t.expect(elements.attachmentNameSelector.exists).ok({ timeout: 20000 });
	await compose.sendEmail();
	await t.wait(2000);
	await sidebar.clickSidebarContent('Inbox');
	await t.eval(() => location.reload(true));
	await t.expect(elements.mailListItemUnread.exists).ok({ timeout: 15000 });
	await compose.openNewMessage();
	await t.expect(elements.inboxReadPane().exists).ok({ timeout: 10000 });
	await t.expect(elements.attachmentNameSelector.exists).ok({ timeout: 10000 });
	for (let i = 0; i < await elements.attachmentNameSelector.count; i ++) {
		await t.expect(fileList[i]).contains(await elements.attachmentNameSelector.nth(i).innerText);
	}
});
