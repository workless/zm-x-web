/*eslint new-cap: ["error", { "capIsNew": false }]*/
/*eslint no-mixed-spaces-and-tabs: ["off", "smart-tabs"]*/
import { Selector, t } from 'testcafe';
import { elements } from './elements';
import { sidebar } from './sidebar';
import { utilFunc } from './common';
import { calendar } from './calendar';

class Contacts {
    
	async clickToobBarButton(buttonText) {
    	await t.click(elements.contactListToolBar.find('span').withText(buttonText).parent('a'));
	}
    
	async selectContactByName(contactName) {
    	await t.click(elements.contactListItemWithName.withText(contactName));
	}

	async typeContactDetail(toFieldId, enteredText) {
		if (toFieldId === 'birthday' || toFieldId === 'anniversary') {
			await t.click(Selector(elements.addContactInfoItem(toFieldId)));
			await calendar.sidepanel.clickDayInMinicalendar('15');
		}
		else {
			await t.typeText(Selector(elements.addContactInfoItem(toFieldId)), enteredText);
		}
	}

	async openNewContact() {
    	await t.click(elements.newContactButton);
	}

	async saveNewContact() {
    	await t.click(elements.saveButton);
	}

	async openToolbarActions() {
    	await t.click(elements.toolbarActionsButton);
	}

	async clickToolbarActionsByText(actionText) {
    	await t.click(elements.actionItemsListToolbar.withText(actionText));
	}

	async clickContactListButtonsByIndex(index) {
    	await t.click(elements.checkboxList.nth(index));
	}
    
	async clickToolbarSelectAll() {
    	await t.click(elements.toolbarCheckboxButton);
	}

	async clickToolbarReadPaneButton(buttonText) {
    	await t
    		.click(this.toolbarReadPaneButton(buttonText))
    		.wait(1000);
	}

	async assignContactsToContactList(contacts, contactLists) {
    	for (let i = 0; i < contacts.length; i ++) {
    		await t
    			.click(this.listItemCheckboxWithName(contacts[i]))
    			.wait(1000);
    	}
    	if (await contacts.length > 1) {
    		await t.click(this.readPaneButtonWithText('Assign Contacts'));
    	}
    	else {
    		await this.clickToolbarReadPaneButton('Assign to Lists');
    	}
        
    	for (let i = 0; i < contactLists.length; i ++) {
    		await t
    			.click(this.popupEditListsDialogCheckbox(contactLists[i]))
    			.wait(1000);
    	}
    	await t.click(this.popupEditListsDialogButtonWithText('Done'));
	}

	async unassignContactsFromContactList(contactList) {
    	let isSwitched = await this.isContactSideBarItemSelected(contactList);
    	if (!isSwitched) {
    		let contactlistCount = await elements.checkboxList.count;
    		await sidebar.clickSidebarContent(contactList);
    		while (contactlistCount === await elements.checkboxList.count) {
    			await t.wait(1000);
    		}
    	}
    	if (await elements.checkboxList.nth(0).exists) {
    		if (!await this.isContactListButtonSelectedByIndex(0)) {
    			await this.clickToolbarSelectAll();
    		}
    		let contactListButtonCount = await elements.checkboxList.count;
    		if (contactListButtonCount > 0) {
    			if (contactListButtonCount > 1) {
    				await t.click(this.readPaneButtonWithText('Assign Contacts'));
    			}
    			else {
    				await this.clickToolbarReadPaneButton('Assign to Lists');
    			}
    			await t
    				.click(this.popupEditListsDialogCheckbox(contactList))
    				.click(this.popupEditListsDialogButtonWithText('Done'));
    		}
    	}
	}

	//helper functions
	async getContactListItemIndex(contactText) {
    	let index = 0;
    	let listItems = await elements.contactListItemWithName;
    	let count = await listItems.count;
    	for (let i = 0; i < count; i++) {
    		if (await listItems.nth(i).innerText === contactText) {
    			index = i;
    			break;
    		}
    	}
    	return index;
	}

	async isToolbarActionItemChecked(actionText) {
    	return await elements.actionItemsListToolbar.withText(actionText).find(elements.toolbarActionItemlistCheckIcon).exists;
	}

	async isContactListButtonSelectedByIndex(byIndex) {
    	return await elements.checkboxList.nth(byIndex).checked;
	}

	async deleteAllContacts(contactNames) {
    	let listEls = await elements.contactListItemWithName.withText(contactNames);
    	let elCount = await listEls.count;
    	for (let i = 0; i < elCount; i ++) {
    		await this.selectContactByName(contactNames);
    		await this.clickToobBarButton('Delete');
    		await t.wait(3000);
    	}
	}

	async isContactSideBarItemSelected(contactName) {
    	return utilFunc.isElementClassNamesContainsStr(sidebar.sidebarContentItemWithText(contactName), 'active');
	}

	readPaneButtonWithText = withText => elements.contactsReadPane.find('button').withText(withText);
	listItemCheckboxWithName = withName => elements.contactListItemWithName.withText(withName).parent().sibling().find('input').withAttribute('type','checkbox');
	popupEditListsDialogButtonWithText = buttonText => elements.popupEditListsDialog.find('button').withText(buttonText);
	popupEditListsDialogCheckbox = checkboxText => elements.popupEditListsDialog.find('*').withText(checkboxText).sibling().withAttribute('type','checkbox');
	toolbarReadPaneButton = buttonText => elements.toolBarReadPane.find('*').withText(buttonText);
}

export let contacts = new Contacts();