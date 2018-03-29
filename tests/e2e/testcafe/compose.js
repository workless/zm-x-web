/*eslint new-cap: ["error", { "capIsNew": false }]*/
import { Selector } from 'testcafe';
import { profile } from './profile/profile';
import { compose } from './page-model/compose';
import { sidebar } from './page-model/sidebar';
import { elements } from './page-model/elements';
import { actions, utilFunc } from './page-model/common';
import { soap } from './utils/soap-client';
import LmtpClient from './utils/lmtp-client';
const path = require('path');

/************************************/
/*** Compose: Send Email Fixture  ***/
/************************************/

fixture `Compose: Send Email Fixture`
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

test('C581664 L1: Compose, Send: To Self (basic) ', async t => {
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

test('C581665 - L1: Compose, Send: CC only (basic) ', async t => {
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

test('C581666 - L1: Compose, Send: BCC only (basic)', async t => {
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

test('C581668 - L2: Compose, Send: No Subject (basic) ', async t => {
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

test('C581670 - L2: Compose, Send: No Message Body (basic)', async t => {
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

test('C581629 - L2: Compose: No Data, Send | Smoke ', async t => {
	let errorMessage = 'No recipient addresses';
	await compose.clickCompose();
	await compose.sendEmail();
	await t.expect(elements.composerFooter.withText(errorMessage).exists).ok({ timeout: 10000 });
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

test('C945626 L1: Enter multiple emails to To text field ', async t => {
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

test('C945627 L1: Enter email address into Cc/Bcc address field ', async t => {
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

test('C581628 - L1: Compose: No Data, Exit (X)', async t => {
	await t.click(elements.ccBccButton);
	await compose.closeCompose();
	await t.expect(elements.composerBody.exists).notOk({ timeout: 5000 });
});

test.skip('Compose: Hover and click plus sign menu image thumbnail to add/remove attachments | SKIP: Hover is not working ', async t => {
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

test('C565555 L2: Images Tab, Drag/Drop into ATTACH drop zone ', async t => {
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

test('C565554 L2: Images Tab, Drag/Drop into EMBED drop zone ', async t => {
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

test('C548609 L1: Images Tab, Filtering |C648032 L2: Images Tab, Search ', async t => {
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

test('C548610 L1: Files Tab, Filtering | C648033 L2: Files Tab, Search (Automated)', async t => {
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

test('C565556 L2: Files Tab, Drag/Drop into EMBED drop zone ', async t => {
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

test('C565557 L2: Files Tab, Drag/Drop into ATTACH drop zone ', async t => {
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

test.skip('Bug:PREAPPS-175 | C733285 L2: GIF Hover, click to add popular gifs as inline attachments ', async t => {
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

test('C648034 L2: GIF Tab, Search |C548611 L1: GIF Tab, Filtering ', async t => {
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

test.skip('Bug:PREAPPS-305 | C548612 L1: Web Link Tab, Filtering ', async t => {
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

test('C581633 L1: Compose: Data visibility (view, addresses, subject) Compose: Test address field suggestions', async t => {
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

test('C581673 L2: Compose, Autocompleter, CC - Match on Email Address, select', async t => {
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

test('C581674 L2: Compose, Autocompleter, BCC - Match on Email Address, select', async t => {
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

test('C548608 L1: General Behavior, Open/Close', async t => {
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

test('C500831 - L2: Images tab, Endless Scroll', async t => {
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

test('C500832 - L2: Files tab, Endless Scroll', async t => {
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

test('C500833 - L2: GIF tab, Endless Scroll', async t => {
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

test.skip('Bug:PREAPPS-305 | C500834 - L2: Web link tab, Endless Scroll', async t => {
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

test('C610129 - L2: RTE Toolbar Elements', async t => {
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

test('C610130 - L1: Responsive Composer Toolbar (Fixed:PREAPPS-206)', async t => {
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

test('C648038 - L2: Attachments > Attach Photo From Email', async t => {
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

test('C648039 - L2: Attachments > Attach File From Email ', async t => {
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

test('C648040 - L2: Attachments > Attach GIF', async t => {
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Attachments', 'Attach GIF');
	await t.expect(elements.plusSignMenuPopularGIFsItemButton.nth(0).exists).ok({ timeout: 10000 });
});

test('C648041 - L2: Attachments > Attach Web Link', async t => {
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Attachments', 'Attach Web Link');
	await t.expect(elements.buttonWithText('shopping').exists).ok({ timeout: 10000 });
});

test.skip('Bug:PREAPPS-250 | C665561 - L2: Font > Type ', async t => {
	let emailBodyText = 'Font';
	//await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.click(elements.richtextareaTextContentSelector);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Font', 'Classic');
	await compose.enterBodyText(emailBodyText);
	await t.expect(await elements.richtextareaTextContentSelector.find('font').getAttribute('face')).contains('TimesNewRoman');
});

test.skip('Bug:PREAPPS-250 | C665562 - L2: Font > Size', async t => {
	let emailBodyText = 'Size';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Font', 'Large');
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('font').getAttribute('size')).eql('5');
});

test.skip('C665611 - L2: Font > Bold', async t => {
	let emailBodyText = 'Bold';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await t.click(compose.toolbarButtonsSelector('Bold'));
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('b').exists).ok();
});

test.skip('C665612 - L2: Font > Italics', async t => {
	let emailBodyText = 'Test';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await t.click(compose.toolbarButtonsSelector('Italic'));
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('i').exists).ok();
});

test.skip('C665613 - L2: Font > Underline', async t => {
	let emailBodyText = 'Test';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await t.click(compose.toolbarButtonsSelector('Underline'));
	await t.wait(500);
	await t.expect(await elements.richtextareaTextContentSelector.find('u').exists).ok();
});

test.skip('C665614 - L2: Font > Text, Background Color', async t => {
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

test('C668231 - L2: Font > Bulleting ', async t => {
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

test('C668232 - L2: Font > Indent ', async t => {
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

test('C668233 - L2: Font > Alignment ', async t => {
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

test('C668234 - L2: Hyperlink > Insert Link (Fixed:PREAPPS-274) ', async t => {
	let emailBodyText = 'test';
	let linkUrl = 'http://www.google.ca';
	await compose.enterBodyText(emailBodyText);
	await t.wait(500);
	await t.selectText(elements.richtextareaTextContentSelector, 0, emailBodyText.length);
	await compose.selectComposeToolbarPopmenu('Link', 'Insert Link');
	await t.wait(500);
	await compose.insertTextLink(linkUrl);
	await t
		.expect(await elements.richtextareaTextContentSelector.find('a').withText(emailBodyText).exists).ok()
		.expect(await elements.richtextareaTextContentSelector.find('a').getAttribute('href')).eql(linkUrl)
		.expect(await elements.richtextareaTextContentSelector.find('tbody').find('h2').innerText).eql('Google')
		.expect((await elements.richtextareaTextContentSelector.innerText).split(emailBodyText).length - 1).eql(1);
});

test.skip('Bug:PREAPPS-305 | C668237 - L2: Hyperlink > Search for Web Link', async t => {
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

test.skip('Bug:PREAPPS-383 | C668238 - L1: Emoticon button ', async t => {
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

test('C581643 L2: Compose, Send: File Attachment, No Message Body | C548614 L1: Add Attachments ', async t => {
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

test('C581642 L2: Compose, Send: File Attachment, Message Body ', async t => {
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

test('C813888 L2: Compose, Send, File Attachment, File Type Support ', async t => {
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
