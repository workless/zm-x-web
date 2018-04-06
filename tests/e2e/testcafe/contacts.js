/*eslint new-cap: ["error", { "capIsNew": false }]*/

import { profile } from './profile/profile';
import { actions, utilFunc } from './page-model/common';
import { compose } from './page-model/compose';
import { contacts } from './page-model/contacts';
import { sidebar } from './page-model/sidebar';
import { elements } from './page-model/elements';
import { soap } from './utils/soap-client';

fixture `Contacts fixture`
	.page(profile.hostURL)
	.before( async ctx => {
		ctx.adminAuthToken = await soap.getAdminAuthToken();
	})
	.beforeEach( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		await t.maximizeWindow();
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await actions.clickNavBarMenuItem('Contacts');
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
	});

test('L1 | Contacts, View Existing | C543079', async t => {
	// Get contacts parents folder ID
	const parentFolderID = await soap.contactGetFolder(t.ctx.userAuth);
	// Create contact
	await soap.createContact(t.ctx.userAuth, parentFolderID, 'Aa', 'Zz' );
	// Refresh browser to load notes
	await t.eval(() => location.reload(true));
	await sidebar.clickSidebarContent('Contacts');
	await t
		.expect(String(await elements.sidebarItemContacts.classNames).includes('active')).ok()
		.expect(elements.chooseContact.exists).ok()
		.expect(elements.chooseContact.innerText).contains('Choose a contact to view or update', 'Verify contacts inner read pane text content');
	await contacts.selectContactByName('Zz, Aa');
	await t.expect(elements.contactCard.innerText).contains('Aa Zz');
});

test('L1 | Contacts, Add Contact after viewing existing contact. | C543080 | L2: Contacts, Phone > 10 digits ', async t => {
	let contactDetailFieldValue = '';
	let contactDetailFieldID = profile.pageElements.id.contacts.detailField;
	let testUserName = contactDetailFieldID.lastName + ', ' + contactDetailFieldID.firstName;

	await contacts.deleteAllContacts('lastName, firstName');
	await t.expect(elements.chooseContact.innerText).contains('Choose a contact to view or update', 'Verify contacts inner read pane text content');

	await contacts.openNewContact();
	await t
		.expect(elements.contactsHeader.exists).ok()
		.expect(elements.saveButton.exists).ok()
		.expect(elements.cancelButton.exists).ok();

	// Enter contact detail info to each of textfield
	for (let key in contactDetailFieldID) {
		await contacts.typeContactDetail(key, contactDetailFieldID[key]);
	}

	await contacts.saveNewContact();
	await t.expect(elements.chooseContact.exists).ok();

	contacts.selectContactByName(testUserName);
	// Verify contact detail info, starting from the 4th object in json. skip check when key=phone
	let keys = Object.keys(contactDetailFieldID);
  
	for (let i = 3; i < keys.length; i++) {
		contactDetailFieldValue = contactDetailFieldID[keys[i]];
		if (keys[i] !== 'website') {
			if (keys[i] === 'birthday' || keys[i] === 'anniversary') {
				contactDetailFieldValue = await utilFunc.convertDate(contactDetailFieldValue);
			}
			await t.expect(elements.contactCard.innerText).contains(contactDetailFieldValue);
		}
	}
	await contacts.clickToobBarButton('Delete');
	// Verify new added contact does not exist in contact list
	await t.expect(elements.contactListItemWithName.withText(testUserName).exists).notOk();
});

test('L0 | Verify the new recipient added to contact (Automated) | C835454 | Smoke ', async t => {
	await contacts.deleteAllContacts('testLastName, testFirstName');
	await t
		.click(elements.newContactButton)
		.expect(elements.contactsHeader.exists).ok();
	await contacts.typeContactDetail('firstName', 'testFirstName');
	await contacts.typeContactDetail('lastName', 'testLastName');
	await contacts.saveNewContact();
	await contacts.selectContactByName('testLastName, testFirstName');
	await contacts.clickToobBarButton('Delete');
});

test('L1 | Sort by First Name | C432590 | C432591 C432592  C432593 Last Name, Email and Reverse Sort Order', async t => {
	let actionItemText = '';
	let contactName1 = 'Zz, Aa';
	let contactName2 = 'Aa, Zz';
	let user1Index = 0;
	let user2Index = 0;
	let indexDiff = 0;
  
	// Get contacts parents folder ID
	const parentFolderID = await soap.contactGetFolder(t.ctx.userAuth);
	// Create contact
	await soap.createContact(t.ctx.userAuth, parentFolderID, 'Aa', 'Zz', 'Aa@zimbra.com' );
	await soap.createContact(t.ctx.userAuth, parentFolderID, 'Zz', 'Aa', 'Zz@zimbra.com' );
	// Refresh browser to load notes
	await t.eval(() => location.reload(true));

	await contacts.openToolbarActions();
	await t.wait(2000);
	user1Index = await contacts.getContactListItemIndex(contactName1);
	user2Index = await contacts.getContactListItemIndex(contactName2);
	indexDiff = user1Index - user2Index;
	//check 'Reverse Sort Order'
	actionItemText = 'Reverse Sort Order';
	await contacts.clickToolbarActionsByText(actionItemText);
	user1Index = await contacts.getContactListItemIndex(contactName1);
	user2Index = await contacts.getContactListItemIndex(contactName2);
	await t.expect(indexDiff * (user1Index - user2Index) < 0).ok();
	await contacts.openToolbarActions();
	await t.expect(await contacts.isToolbarActionItemChecked(actionItemText)).ok();
	//check 'Sort by First Name'
	actionItemText = 'Sort by First Name';
	await contacts.clickToolbarActionsByText(actionItemText);
	user1Index = await contacts.getContactListItemIndex(contactName1);
	user2Index = await contacts.getContactListItemIndex(contactName2);
	await t.expect(user2Index - user1Index < 0).ok();
	await contacts.openToolbarActions();
	await t.expect(await contacts.isToolbarActionItemChecked(actionItemText)).ok();
	//uncheck 'Reverse Sort Order'
	actionItemText = 'Reverse Sort Order';
	await contacts.clickToolbarActionsByText(actionItemText);
	user1Index = await contacts.getContactListItemIndex(contactName1);
	user2Index = await contacts.getContactListItemIndex(contactName2);
	await t.expect(user2Index - user1Index > 0).ok();
	await contacts.openToolbarActions();
	await t
		.expect(await contacts.isToolbarActionItemChecked(actionItemText)).notOk()
		.expect(await contacts.isToolbarActionItemChecked('Sort by First Name')).ok();
	//check 'Sort by Last Name'
	actionItemText = 'Sort by Last Name';
	await contacts.clickToolbarActionsByText(actionItemText);
	user1Index = await contacts.getContactListItemIndex(contactName1);
	user2Index = await contacts.getContactListItemIndex(contactName2);
	await t.expect(user2Index - user1Index < 0).ok();
	await contacts.openToolbarActions();
	await t
		.expect(await contacts.isToolbarActionItemChecked(actionItemText)).ok()
		.expect(await contacts.isToolbarActionItemChecked('Sort by First Name')).notOk();
	//check 'Sort by Email'
	actionItemText = 'Sort by Email';
	await contacts.clickToolbarActionsByText(actionItemText);
	await t
		.expect(await contacts.getContactListItemIndex(contactName1) === 0).ok();
	await contacts.openToolbarActions();
	await t
		.expect(await contacts.isToolbarActionItemChecked(actionItemText)).ok()
		.expect(await contacts.isToolbarActionItemChecked('Sort by Last Name')).notOk();
});

test('L2 | select single/multi/all contacts from contact list | C543083 | C543084', async t => {
	// Get contacts parents folder ID
	const parentFolderID = await soap.contactGetFolder(t.ctx.userAuth);
	// Create contacts
	await soap.createContact(t.ctx.userAuth, parentFolderID, 'Aa', 'Zz' );
	await soap.createContact(t.ctx.userAuth, parentFolderID, 'Zz', 'Aa' );
	await soap.createContact(t.ctx.userAuth, parentFolderID, 'sam', 'cafe' );
	await soap.createContact(t.ctx.userAuth, parentFolderID, 'Test', 'zimbra' );
	// Refresh browser to load notes
	await t.eval(() => location.reload(true));
  
	await t.expect(await contacts.isContactListButtonSelectedByIndex(0)).notOk();
	//select first contact
	await contacts.clickContactListButtonsByIndex(0);
	await t.expect(await contacts.isContactListButtonSelectedByIndex(0)).ok();
	//select second contact
	await contacts.clickContactListButtonsByIndex(1);
	await t.expect(await contacts.isContactListButtonSelectedByIndex(1)).ok();
	//unselect first contact
	await contacts.clickContactListButtonsByIndex(0);
	await t.expect(await contacts.isContactListButtonSelectedByIndex(0)).notOk();
	//unselect second contact
	await contacts.clickContactListButtonsByIndex(1);
	await t.expect(await contacts.isContactListButtonSelectedByIndex(1)).notOk();
	//select all contact from the toolbar
	await contacts.clickToolbarSelectAll();
	let checkboxListCount = await elements.checkboxList.count;
	await t.expect(checkboxListCount > 0).ok();
	for (let i=0; i < checkboxListCount; i++) {
		await t.expect(await contacts.isContactListButtonSelectedByIndex(i)).ok();
	}
	//uncheck all contact from the toolbar
	await contacts.clickToolbarSelectAll();
	checkboxListCount = await elements.checkboxList.count;
	await t.expect(checkboxListCount > 0).ok();
	for (let i=0; i < checkboxListCount; i++) {
		await t
			.expect(await contacts.isContactListButtonSelectedByIndex(i)).notOk();
	}
});

//Fixed bugs:PREAPPS-191
test.skip('L1 | Assign/unassign single contact to a contact list C432966 | PREAPPS-260 | C679095', async t => {
	// Get contacts parents folder ID
	const parentFolderID = await soap.contactGetFolder(t.ctx.userAuth);
	// Create contact
	await soap.createContact(t.ctx.userAuth, parentFolderID, 'contact1', 'test' );
	await soap.createContactList(t.ctx.userAuth, parentFolderID, 'testContactList' );
	// Refresh browser to load notes
	await t.eval(() => location.reload(true));
  
	let contactUser = 'test, contact1';
	let contactList = 'testContactList';
	//Test prep: unassign all contacts from contactList
	await contacts.unassignContactsFromContactList(contactList);
	//assign signle contact to contactList
	await sidebar.clickSidebarContent(contactList);
	await t.expect(elements.contactListInner.innerText).contains('Nothing to show', 'verify nothing in contact list', { timeout: 5000 });
	await sidebar.clickSidebarContent('Contacts');
	await t
		.expect(elements.contactListInner.withText('Nothing to show.').exists).notOk({ timeout: 4000 })
		.expect(elements.contactsReadPane.innerText).contains('Choose a contact to view or update', { timeout: 3000 });
	await contacts.assignContactsToContactList([contactUser], [contactList]);
	await sidebar.clickSidebarContent(contactList);
	await t.expect(contacts.listItemCheckboxWithName(contactUser)).ok({ timeout: 3000 });
	//unassign all contacts from contactList
	await contacts.unassignContactsFromContactList(contactList);
	await t.expect(elements.contactListInner.withText('Nothing to show.').exists).ok({ timeout: 10000 });
});

test.skip('L1 | Assign/unassign multiple contacts to a contact list | C679096 | PREAPPS-260 | C679097', async t => {
	// Get contacts parents folder ID
	const parentFolderID = await soap.contactGetFolder(t.ctx.userAuth);
	// Create contacts
	await soap.createContact(t.ctx.userAuth, parentFolderID, 'contact2', 'test' );
	await soap.createContact(t.ctx.userAuth, parentFolderID, 'contact3', 'test' );
	await soap.createContactList(t.ctx.userAuth, parentFolderID, 'testContactList' );
	// Refresh browser to load notes
	await t.eval(() => location.reload(true));
  
	let contactUser2 = 'test, contact2';
	let contactUser3 = 'test, contact3';
	let contactList = 'testContactList';
	//Test prep: unassign all contacts from contactList
	await contacts.unassignContactsFromContactList(contactList);
	//assign multi-contacts to contactList
	await sidebar.clickSidebarContent('Contacts');
	await contacts.assignContactsToContactList([contactUser2,contactUser3], [contactList]);
	await sidebar.clickSidebarContent(contactList);
	await t
		.expect(contacts.listItemCheckboxWithName(contactUser2)).ok({ timeout: 3000 })
		.expect(contacts.listItemCheckboxWithName(contactUser3)).ok();
	//unassign all contacts from contactList
	await contacts.unassignContactsFromContactList(contactList);
	await t.expect(elements.contactListInner.withText('Nothing to show.').exists).ok({ timeout: 10000 });
});

test('L1 | Contacts, Scroll | C543076', async t => {
	// Get contacts parents folder ID
	const parentFolderID = await soap.contactGetFolder(t.ctx.userAuth);
	// Create contacts
	for (let i = 0; i < 20; i++) {
		await soap.createContact(t.ctx.userAuth, parentFolderID, `Test${i}`, `zimbra${i}` );
	}
	// Refresh browser to load notes
	await t.eval(() => location.reload(true));
  
	await t.wait(2000);
	let startRectTop = await elements.checkboxList.getBoundingClientRectProperty('top');
	await utilFunc.scrollElement.with({ dependencies: { scrollPosition: 'down' } })(elements.contactListInner);
	await t.wait(2000);
	let endRectTop = await elements.checkboxList.getBoundingClientRectProperty('top');
	await t.expect(startRectTop > endRectTop).ok();
	await utilFunc.scrollElement.with({ dependencies: { scrollPosition: 'up' } })(elements.contactListInner);
	await t.wait(2000);
	await t.expect(await elements.checkboxList.getBoundingClientRectProperty('top')).eql(startRectTop);
});

test('L1 | Contacts, Return to Mail | C543075 | C835454 L0: Verify the new recipient added to contact ', async t => {
	let emailTo = t.ctx.user.email;
	let emailBodyText = 'test';
	await sidebar.clickSidebarContent('Emailed Contacts');
	await t.expect(elements.contactListInner.withText('Nothing to show.').exists).ok({ timeout: 4000 });
	await actions.clickNavBarMenuItem('Mail');
	await compose.clickCompose();
	await compose.enterTextToFieldElement(emailTo, compose.addressFieldTextField('To'));
	await compose.enterBodyText(emailBodyText);
	await compose.sendEmail();
	await t.wait(2000);
	await sidebar.clickSidebarContent('Inbox');
	await t.eval(() => location.reload(true));
	await t.expect(elements.mailListItemUnread.exists).ok({ timeout: 15000 });
	await compose.openNewMessage();
	await actions.clickNavBarMenuItem('Contacts');
	await sidebar.clickSidebarContent('Emailed Contacts');
	await t.expect(elements.contactListItemWithName.withText(emailTo.substr(0, emailTo.indexOf('@'))).exists).ok({ timeout: 10000 });
});
