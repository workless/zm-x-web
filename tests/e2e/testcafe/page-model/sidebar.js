import { t } from 'testcafe';
import { elements } from './elements';

class SideBar {

	// Click on side bar content element
	async clickSidebarContent(sideBarText) {
		await t.click(elements.sidebarContentSelector.find('*').withAttribute('title', sideBarText));
	}

	// Click folder to collapse
	async clickFolder(folderName) {
		if (!String(await elements.folderToggleSelector.withText(folderName).prevSibling().getAttribute('class')).includes('zimbra-client_collapsible-control_open')) {
			await t
				.click(elements.folderToggleSelector.withText(folderName));
		}
	}

	// Click sub folder angle icon to collapse
	async clickAngleToExpandSubFolder(folderName) {
		await t.click(elements.folderListItemSelector.withText(folderName).find(elements.angleRight));
	}

	// Create a folder
	async createNewFolder(parentFolderName, folderName) {
		await t
			.hover(elements.folderToggleSelector.withText(parentFolderName))
			.click(elements.folderToggleSelector.withText(parentFolderName).find(elements.iconPlus))
			.click(elements.folderInputContainerSelector.find(elements.folderInput))
			.typeText(elements.folderInputContainerSelector.find(elements.folderInput),folderName)
			.pressKey('Enter');
	}

	// Search a folder
	async searchFolder(parentFolderName, folderName) {
		await t
			.hover(elements.folderToggleSelector.withText(parentFolderName))
			.click(elements.folderToggleSelector.withText(parentFolderName).find(elements.iconSearch))
			.click(elements.folderInputContainerSelector.find(elements.folderInput))
			.typeText(elements.folderInputContainerSelector.find(elements.folderInput),folderName)
			.pressKey('Enter');
	}

	// Delete a folder
	async deleteFolder(folderName) {
		await this.selectFolderPopupMenuAction(folderName, 'Delete folder');
	}

	// Rename a folder from fromName to toName
	async renameFolder(fromName, toName) {
		await this.selectFolderPopupMenuAction(fromName, 'Rename folder');
		await t
			.click(elements.folderInput)
			.pressKey('ctrl+a delete')
			.typeText(elements.folderInput,toName)
			.pressKey('Enter');
	}

	// Move folder into another folder
	async moveFolder(folderName, toName) {
		await this.selectFolderPopupMenuAction(folderName, 'Move folder');
		await t.click(elements.contextMenusDefaultContainerSelector.find('a').withText(toName));
	}

	// Dismiss text input by clicking x button
	async folderTextInputClose() {
		await t.click(elements.folderInputContainerSelector.find(elements.iconClose));
	}

	// Right click on a folder and select context menu item
	async selectFolderPopupMenuAction(folderName, selectText) {
		await t
			.rightClick(this.sidebarContentItemWithText(folderName))
			.click(elements.contextMenuDefaultContainerSelector.find('a').withText(selectText));
	}

	// Get sidebar content item count number
	async getSidebarContentItemIndex(itemTitle) {
		let itemIndex = 0;
		const itemCount = await elements.sidebarContentSelector.find('a').count;
		for (let i = 0; i < itemCount; i++ ) {
			if (String(await elements.sidebarContentSelector.find('a').nth(i).innerText).includes(itemTitle)) {
				itemIndex = i;
				break;
			}
		}
		return itemIndex;
	}
	

    sidebarContentItemWithText = withText => elements.sidebarContentSelector.find('*').withAttribute('title', withText)
    checkSidebarItemExists = text => elements.sidebarContentSelector.find('*').withAttribute('title', text).exists;
	checkSidebarFolderExists = text => elements.folderToggleSelector.withText(text).exists;
	

	// Mobile - Click hamburgermenu button
	async clickHamburgerButton() {
		await t.click(elements.toolBarActionButton);
	}

}

export let sidebar = new SideBar();