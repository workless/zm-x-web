/*eslint new-cap: ["error", { "capIsNew": false }]*/
/*eslint no-mixed-spaces-and-tabs: "off"*/
import { t } from 'testcafe';
import { dialog } from './dialog';
import { sidebar } from './sidebar';
import { elements } from './elements';

class Notes {
        
	async createNewNote(titleName, bodyText) {
        	this.clickNewNoteButton();
        	this.enterNoteTitle(titleName);
        	this.enterNoteBodyText(bodyText);
        	this.clickSaveButtonToSaveNote();
	}
        
	async clickNewNoteButton() {
        	await t.click(elements.sidebarContactItemWithTextSelector('New Note'));
	}

	async enterNoteTitle(titleName) {
        	await t
        		.click(elements.noteSubjectSelector)
        		.typeText(elements.noteSubjectSelector, titleName, { speed: 0.5 });
	}

	async enterNoteBodyText(bodyText) {
        	await t
        		.click(elements.noteBodyTextareaSelector)
        		.typeText(elements.noteBodyTextareaSelector, bodyText);
	}

	async clickSaveButtonToSaveNote() {
        	await t
        		.click(elements.saveButtonSelector)
        		.wait(1000);
	}

	async clickCancelButtonToCancelSaveNote() {
        	await t
        		.click(elements.cancelButtonSelector)
        		.wait(1000);
	}

	async createNewNotebook(notebookName) {
        	await t
        		.click(elements.sidebarContentSelector.find('input').withAttribute('placeholder', 'New Notebook'))
        		.typeText(elements.sidebarContentSelector.find('input').withAttribute('placeholder', 'New Notebook'), notebookName, { speed: 0.5 })
        		.wait(1000)
        		.pressKey('enter');
	}
    
	async clickSidebarContentItem(itemText) {
        	await t
        		.click(elements.sidebarContactItemWithTextSelector(itemText))
        		.wait(1000);
	}
        
	async rightClickSidebarContentItem(itemText) {
        	await t
        		.rightClick(elements.sidebarContactItemWithTextSelector(itemText))
        		.wait(1000);
	}

	async deleteNotebook(notebookName) {
        	await sidebar.selectFolderPopupMenuAction(notebookName, 'Delete Notebook');
        	await dialog.clickDialogOverlayButton('OK');
	}
        
	async dragNoteToNotebook(noteName, fromNotebook, toNotebook) {
        	await this.clickSidebarContentItem(fromNotebook);
        	await this.dragNote(noteName, toNotebook);
	}

	async dragAllNotesToNotebook(noteName, fromNotebook, toNotebook) {
        	await this.clickSidebarContentItem(fromNotebook);
        	await this.checkAllNotes();
        	await this.dragNote(noteName, toNotebook);
	}

	async dragNote(noteName, toNotebook) {
        	const dragElement = await elements.noteCardDraggableSelectorByTitle(noteName)();
        	await t.dragToElement(dragElement, elements.sidebarContactItemWithTextSelector(toNotebook));
	}

	async checkAllNotes() {
        	await t
        		.click(elements.listToolbarSelector.find('input').withAttribute('type', 'checkbox'))
        		.wait(1000);
	}

	async moveNoteToNotebook(notebook, fromNotebook, toNotebook) {
        	await t
        		.click(elements.sidebarContactItemWithTextSelector(fromNotebook))
        		.click(elements.noteCardDraggableSelectorByTitle(notebook))
        		.click(elements.paneToolBarMoveButton);
        	await this.selectMoveMenu(toNotebook);
	}

	async moveAllToNotebook(notebook, fromNotebook, toNotebook) {
        	await t.click(elements.sidebarContactItemWithTextSelector(fromNotebook));
        	await this.checkAllNotes();
        	await t.click(elements.paneToolBarMoveButton);
        	await this.selectMoveMenu(toNotebook);
	}

	async selectMoveMenu(toNotebook) {
        	await t
        		.click(elements.blocksPopoverActiveSelector.find('a').withText(toNotebook))
        		.wait(1000);
	}

	async clickUndoButton() {
        	await t.click(elements.undoButtonSelector);
	}

	async deleteNote(noteTitle) {
        	await t.click(elements.noteCardDraggableSelectorByTitle(noteTitle));
        	await t.click(elements.paneToolBarTrashButton);
	}

	async deleteAllNoteWithTitle(noteTitle) {
        	await t.wait(2000);
        	while (await elements.noteCardDraggableDeleteButtonSelectorByTitle(noteTitle).exists){
        		this.deleteNote(noteTitle);
        		await t.wait(2000);
        	}
	}

	async deleteAllNotes() {
        	await this.checkAllNotes();
        	await t.click(elements.paneToolBarTrashButton);
	}
}

export let notes = new Notes();