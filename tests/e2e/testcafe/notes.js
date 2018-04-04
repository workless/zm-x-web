import { profile } from './profile/profile';
import { notes } from './page-model/notes';
import { actions } from './page-model/common';
import { elements } from './page-model/elements';
import { sidebar } from './page-model/sidebar';
import { dialog } from './page-model/dialog';
import { soap } from './utils/soap-client';

fixture `Notes fixture`
	.skip //skip fixture 
	.page(profile.hostURL)
	.before( async ctx => {
		ctx.adminAuthToken = await soap.getAdminAuthToken();
	})
	.beforeEach( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		await t.maximizeWindow();
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
		await actions.clickNavBarMenuItem('Notes');
		await t.expect(sidebar.sidebarContentItemWithText('Unfiled').exists).ok({ timeout: 10000 });
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
	});

test('C428997 L2: Add Note, Default Notebook, Save | C612381 L1: Add Note, Save ', async t => {
	// Get notes parent folder ID
	const parentFolderID = await soap.noteGetFolder(t.ctx.userAuth);
	// Create testNotebook folder
	await soap.noteCreateFolder(t.ctx.userAuth,parentFolderID, 'testNotebook');
	// Refresh browser to load notes
	await t.eval(() => location.reload(true));
	const newNoteName = 'newTempNote';
	const bodyText = 'note body text';
	await notes.clickSidebarContentItem('testNotebook');
	await notes.deleteAllNoteWithTitle(newNoteName);
	await notes.createNewNote(newNoteName, bodyText);
	await t.click(elements.noteCardDraggableSelectorByTitle(newNoteName));
	await t.expect(elements.noteCardContectSelector.innerText).contains(bodyText);
	await notes.deleteNote(newNoteName);
	await t.expect(elements.noteCardDraggableDeleteButtonSelectorByTitle(newNoteName).exists).notOk({ timeout: 10000 });
});

test('C428998 L2: Delete Note (Note View) ', async t => {
	const newNotebookName = 'tempNotebook';
	await notes.deleteAllNotes();
	await notes.createNewNotebook(newNotebookName);
	await notes.clickSidebarContentItem(newNotebookName);
	await t.expect(elements.contactListInner.innerText).contains('Nothing to show');
	await notes.deleteNotebook(newNotebookName);
	await t.expect(sidebar.sidebarContentItemWithText(newNotebookName).exists).notOk({ timeout: 10000 });
});

test('C945622 L1: Move note to trash using toolbar button ', async t => {
	// Get notes parent folder ID
	const parentFolderID = await soap.noteGetFolder(t.ctx.userAuth);
	// Create testNotebook folder
	await soap.noteCreateFolder(t.ctx.userAuth,parentFolderID, 'testNotebook');
	// Refresh browser to load notes
	await t.eval(() => location.reload(true));
	const newNoteName = 'newTempNote';
	await notes.clickSidebarContentItem('testNotebook');
	await notes.createNewNote(newNoteName, newNoteName);
	await t.click(elements.noteCardDraggableSelectorByTitle(newNoteName));
	await t.expect(elements.paneToolBarTrashButton.hasAttribute('disabled')).notOk({ timeout: 3000 });
	await t
		.click(elements.paneToolBarTrashButton)
		.expect(elements.noteCardDraggableSelectorByTitle(newNoteName).exists).notOk({ timeout: 5000 });
});

test('C612876 L2: Move Note, Notebook to Notebook, Drag/Drop ', async t => {
	const dragFromNotebook = 'notebook';
	const dragToNotebook = 'testNotebook';
	const draggableNoteCard = 'Test Notes';
	// Get notes parent folder ID
	const parentFolderID = await soap.noteGetFolder(t.ctx.userAuth);
	// Create dragFromNotebook folder with draggableNoteCard
	await soap.noteCreateFolder(t.ctx.userAuth,parentFolderID, dragFromNotebook)
		.then(dragFromNotebookID => soap.noteCreateNote(t.ctx.userAuth,dragFromNotebookID, draggableNoteCard));
	// Create dragToNotebook folder
	await soap.noteCreateFolder(t.ctx.userAuth,parentFolderID, dragToNotebook);
	// Refresh browser to load notes
	await t.eval(() => location.reload(true));
	await notes.dragNoteToNotebook(draggableNoteCard, dragFromNotebook, dragToNotebook);
	await t.expect(elements.noteCardDraggableSelectorByTitle(draggableNoteCard).exists).notOk({ timeout: 10000 });
	await notes.dragNoteToNotebook(draggableNoteCard, dragToNotebook, dragFromNotebook);
	await t.expect(elements.noteCardDraggableSelectorByTitle(draggableNoteCard).exists).notOk({ timeout: 10000 });
	await notes.clickSidebarContentItem(dragFromNotebook);
	await t.expect(elements.noteCardDraggableSelectorByTitle(draggableNoteCard).exists).ok({ timeout: 10000 });
});

test('C612875 L2: Move Multiple Notes, Drag/Drop ', async t => {
	const dragFromNotebook = 'notebook';
	const dragToNotebook = 'testNotebook';
	const draggableNoteCard = 'Test Notes';
	// Get notes parent folder ID
	const parentFolderID = await soap.noteGetFolder(t.ctx.userAuth);
	// Create dragFromNotebook folder
	const dragFromNotebookID = await soap.noteCreateFolder(t.ctx.userAuth,parentFolderID, dragFromNotebook);
	// Create draggableNoteCard
	await soap.noteCreateNote(t.ctx.userAuth,dragFromNotebookID, draggableNoteCard);
	// Create some random notes in dragFromNotebook folder
	for (let i = 0; i < 10; i++) {
		await soap.noteCreateNote(t.ctx.userAuth,dragFromNotebookID, `RandomNoteSubject ${i}`,`Note Body`);
	}
	// Create dragToNotebook folder
	await soap.noteCreateFolder(t.ctx.userAuth,parentFolderID, dragToNotebook);
	// Refresh browser to load notes
	await t.eval(() => location.reload(true));
	await notes.dragAllNotesToNotebook(draggableNoteCard, dragFromNotebook, dragToNotebook);
	await t.expect(elements.noItemsSelector.exists).ok({ timeout: 10000 });
	await notes.dragAllNotesToNotebook(draggableNoteCard, dragToNotebook, dragFromNotebook);
	await t.expect(elements.noItemsSelector.exists).ok({ timeout: 10000 });
	await notes.clickSidebarContentItem(dragFromNotebook);
	await t.expect(elements.noteCardDraggableSelectorByTitle(draggableNoteCard).exists).ok({ timeout: 10000 });
});

test.skip('Bug:PREAPPS-314 | C612872 L2: Move Note, Notebook to Notebook, Move Button ', async t => {
	const fromNotebook = 'notebook';
	const toNotebook = 'testNotebook';
	const noteCard = 'Test Notes';
	// Get notes parent folder ID
	const parentFolderID = await soap.noteGetFolder(t.ctx.userAuth);
	// Create moveFromNotebook folder with draggableNoteCard
	await soap.noteCreateFolder(t.ctx.userAuth,parentFolderID, fromNotebook)
		.then(dragFromNotebookID => soap.noteCreateNote(t.ctx.userAuth,dragFromNotebookID, noteCard));
	// Create moveToNotebook folder
	await soap.noteCreateFolder(t.ctx.userAuth,parentFolderID, toNotebook);
	// Refresh browser to load notes
	await t.eval(() => location.reload(true));
	await notes.moveNoteToNotebook(noteCard, fromNotebook, toNotebook);
	await t.expect(elements.noteCardDraggableSelectorByTitle(noteCard).exists).notOk({ timeout: 10000 });
	await notes.moveNoteToNotebook(noteCard, toNotebook, fromNotebook);
	await t.expect(elements.noteCardDraggableSelectorByTitle(noteCard).exists).notOk({ timeout: 10000 });
	await t.click(elements.sidebarContactItemWithTextSelector(fromNotebook));
	await t.expect(elements.noteCardDraggableSelectorByTitle(noteCard).exists).ok({ timeout: 10000 });
});

test.skip('Bug:PREAPPS-314 | C612873 L2: Move Multiple Notes, Move Button ', async t => {
	const fromNotebook = 'notebook';
	const toNotebook = 'testNotebook';
	const noteCard = 'Test Notes';
	// Get notes parent folder ID
	const parentFolderID = await soap.noteGetFolder(t.ctx.userAuth);
	// Create moveFromNotebook folder
	const dragFromNotebookID = await soap.noteCreateFolder(t.ctx.userAuth,parentFolderID, fromNotebook);
	// Create draggableNoteCard
	await soap.noteCreateNote(t.ctx.userAuth,dragFromNotebookID, noteCard);
	// Create some random notes in moveFromNotebook folder
	for (let i = 0; i < 10; i++) {
		await soap.noteCreateNote(t.ctx.userAuth,dragFromNotebookID, `RandomNoteSubject ${i}`,`Note Body`);
	}
	// Create moveToNotebook folder
	await soap.noteCreateFolder(t.ctx.userAuth,parentFolderID, toNotebook);
	// Refresh browser to load notes
	await t.eval(() => location.reload(true));
	await notes.moveAllToNotebook(noteCard, fromNotebook, toNotebook);
	await t.expect(elements.noItemsSelector.exists).ok({ timeout: 10000 });
	await notes.moveAllToNotebook(noteCard, toNotebook, fromNotebook);
	await t.expect(elements.noItemsSelector.exists).ok({ timeout: 10000 });
	await t.click(elements.sidebarContactItemWithTextSelector(fromNotebook));
	await t.expect(elements.noteCardDraggableSelectorByTitle(noteCard).exists).ok({ timeout: 10000 });
});

test('C945623 L2: Create duplicate notebook ', async t => {
	// Get notes parent folder ID
	const parentFolderID = await soap.noteGetFolder(t.ctx.userAuth);
	// Create testNotebook folder
	await soap.noteCreateFolder(t.ctx.userAuth,parentFolderID, 'testNotebook');
	// Refresh browser to load notes
	await t.eval(() => location.reload(true));
	const notebookName = 'testNotebook';
	await notes.createNewNotebook(notebookName);
	await t.expect(elements.markupPopoverSelector.exists).ok({ timeout: 15000 });
	await t.expect(String(await elements.markupPopoverSelector.innerText).includes('already exists')).ok();
});

test('C607274 - L2: Default Folder, Rename/Delete', async t => {
	await notes.rightClickSidebarContentItem('Unfiled');
	await t
		.expect(elements.contextMenuBackdropSelector.find('a').withText('Rename Notebook').getAttribute('disabled')).ok({ timeout: 2000 })
		.expect(elements.contextMenuBackdropSelector.find('a').withText('Delete Notebook').getAttribute('disabled')).ok();
});

test('C612475 - L2: Add Note, Dont Save', async t => {
	// Get notes parent folder ID
	const parentFolderID = await soap.noteGetFolder(t.ctx.userAuth);
	// Create 'notebook' folder
	await soap.noteCreateFolder(t.ctx.userAuth,parentFolderID, 'notebook');
	// Refresh browser to load notes
	await t.eval(() => location.reload(true));
	const newNoteName = 'newTempNote';
	notes.clickNewNoteButton();
	notes.enterNoteTitle(newNoteName);
	notes.enterNoteBodyText(newNoteName);
	await notes.clickSidebarContentItem('notebook');
	await t.click(dialog.dialogButtonsWithText('No'));
	await notes.clickSidebarContentItem('Unfiled');
	await t.expect(elements.contactListInner.innerText).contains('Nothing to show',{ timeout: 3000 });
});

test('C607273 - L2: Add Note, Cancel Button', async t => {
	const newNoteName = 'newTempNote';
	notes.clickNewNoteButton();
	notes.enterNoteTitle(newNoteName);
	notes.enterNoteBodyText(newNoteName);
	notes.clickCancelButtonToCancelSaveNote();
	await t.expect(elements.dialogSelector.find('h2').withText('Discard Changes?').exists).ok({ timeout: 5000 });
	await t.click(dialog.dialogButtonsWithText('Yes'));
	await t.expect(elements.contactListInner.innerText).contains('Nothing to show',{ timeout: 3000 });
});

test('C429001 - L2: Delete Note (Hover), Undo', async t => {
	const newNoteName = 'newTempNote';
	await notes.clickSidebarContentItem('Unfiled');
	await notes.createNewNote(newNoteName, newNoteName);
	await notes.deleteNote(newNoteName);
	await notes.clickUndoButton();
	await t.expect(elements.noteCardDraggableSelectorByTitle(newNoteName).exists).ok({ timeout: 10000 });
	await notes.deleteNote(newNoteName);
	await t.expect(elements.contactListInner.innerText).contains('Nothing to show',{ timeout: 3000 });
});

test('C429000 - L2: Delete Multiple Notes (Note list)', async t => {
	// Get notes parent folder ID
	const parentFolderID = await soap.noteGetFolder(t.ctx.userAuth);
	// Create 'removeAllNotes' folder
	await soap.noteCreateFolder(t.ctx.userAuth,parentFolderID, 'removeAllNotes');
	// Refresh browser to load notes
	await t.eval(() => location.reload(true));
	const noteName1 = 'firstNote';
	const noteName2 = 'secondNote';
	await notes.clickSidebarContentItem('removeAllNotes');
	await t.expect(elements.paneToolBarTrashButton.hasAttribute('disabled')).ok();
	await notes.createNewNote(noteName1, noteName1);
	await notes.createNewNote(noteName2, noteName2);
	await t
		.expect(elements.noteCardDraggableSelectorByTitle(noteName1).exists).ok({ timeout: 5000 })
		.expect(elements.noteCardDraggableSelectorByTitle(noteName2).exists).ok({ timeout: 5000 });
	await notes.checkAllNotes();
	await t.expect(elements.paneToolBarTrashButton.hasAttribute('disabled')).notOk({ timeout: 3000 });
	await t.click(elements.paneToolBarTrashButton);
	await t.expect(elements.noItemsSelector.exists).ok({ timeout: 10000 });
});
