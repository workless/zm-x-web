import { profile } from './profile/profile';
import { actions, utilFunc } from './page-model/common';
import { mail } from './page-model/mail';
import { compose } from './page-model/compose';
import { sidebar } from './page-model/sidebar';
import { elements } from './page-model/elements';
import { soap } from './utils/soap-client';
import Inject from './utils/Inject-msg';
const path = require('path');

/************************************/
/*** Mail: Compose scroll fixture ***/
/************************************/

fixture.skip `Mail: Compose scroll fixture`
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
		await t.resizeWindow(1200,600);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
	});

test('L2 | Images tab, Endless Scroll | C565544', async t => {
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
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/images.txt');
		inject.send(t.ctx.userAuth, filePath);
		await t.resizeWindow(1200,600);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
	});

test('L2 | Files tab, Endless Scroll | C565545', async t => {
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
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/attachments.txt');
		inject.send(t.ctx.userAuth, filePath);
		await t.resizeWindow(1200,600);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
	});

test('L2 | GIF tab, Endless Scroll | C565546', async t => {
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

test('L2 | Web link tab, Endless Scroll | C565547 | PREAPPS-305', async t => {
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


test('L2 | Attachments > Attach Photo From Email | C769871', async t => {
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Attachments', 'Attach Photo From Email');
	await t.expect(elements.plusSignMenuPhotoFromEmailAreaItemButton.nth(0).exists).ok({ timeout: 10000 });
})
	.before( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/images.txt');
		inject.send(t.ctx.userAuth, filePath);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await mail.openEmail(0);
		await mail.clickToolbarButton(0);
	});

test('L2 | Attachments > Attach File From Email | C769872', async t => {
	let fileName = 'WordDocFile.docx';
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Attachments', 'Attach File From Email');
	await t.expect(elements.plusSignMenuFileFromEmailAreaItemButton.withAttribute('title', fileName).exists).ok({ timeout: 10000 });
})
	.before( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/attachments.txt');
		inject.send(t.ctx.userAuth, filePath);
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await mail.openEmail(0);
		await mail.clickToolbarButton(0);
	});

test('L2 | Attachments > Attach GIF | C769873', async t => {
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Attachments', 'Attach GIF');
	await t.expect(elements.plusSignMenuPopularGIFsItemButton.nth(0).exists).ok({ timeout: 10000 });
});


test.skip('L2 | Hyperlink > Search for Web Link | C828576 | PREAPPS-305 ', async t => {
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

test('L2 | Attachments > Attach Web Link | C769874', async t => {
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Attachments', 'Attach Web Link');
	await t.expect(elements.buttonWithText('shopping').exists).ok({ timeout: 10000 });
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
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await t.expect(sidebar.checkSidebarItemExists('Inbox')).ok({ timeout: 15000 });
		await compose.clickCompose();
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
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
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/images.txt');
		inject.send(t.ctx.userAuth, filePath);
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
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/images.txt');
		inject.send(t.ctx.userAuth, filePath);
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
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/images.txt');
		inject.send(t.ctx.userAuth, filePath);
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
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/images.txt');
		inject.send(t.ctx.userAuth, filePath);
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
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/attachments.txt');
		inject.send(t.ctx.userAuth, filePath);
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
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/attachments.txt');
		inject.send(t.ctx.userAuth, filePath);
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
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/attachments.txt');
		inject.send(t.ctx.userAuth, filePath);
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
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/empty.txt');
		inject.send(t.ctx.userAuth, filePath);
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
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/images.txt');
		inject.send(t.ctx.userAuth, filePath);
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
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/attachments.txt');
		inject.send(t.ctx.userAuth, filePath);
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

	
test.skip('L2 | Attachments > Attach Photo From Email | C648038 | SKIP:PREAPPS-302', async t => {
	await t.expect(elements.componentsToolbarMiddleSelector.exists).ok({ timeout: 10000 });
	await compose.selectComposeToolbarPopmenu('Attachments', 'Attach Photo From Email');
	await t.expect(elements.plusSignMenuPhotoFromEmailAreaItemButton.nth(0).exists).ok({ timeout: 10000 });
})
	.before( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/images.txt');
		inject.send(t.ctx.userAuth, filePath);
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
		const inject = new Inject();
		const filePath = path.join(__dirname, './data/mime/emails/attachments.txt');
		inject.send(t.ctx.userAuth, filePath);
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
