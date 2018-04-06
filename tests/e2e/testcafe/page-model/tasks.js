/*eslint new-cap: ["error", { "capIsNew": false }]*/
import { t, Selector } from 'testcafe';
import { elements } from './elements';
import { utilFunc } from './common';

class Tasks {

	// Tasks selectors:
    tasksHeaderSelector   = Selector(elements.clientName + '_tasks_header');                     // Tasks app header
    tasksToggleAdd = elements.clientName + '_tasks_toggleAdd';                 // Tasks plus icon
    tasksActionsMenuButtonSelector = Selector(elements.clientName + '_tasks_actionsMenuButton'); // Tasks settings gear icon
    tasksEditTextSelector = Selector(elements.clientName + '_tasks_editText');                   // Tasks quick add task textarea
    menuItemInnerSelector = Selector(elements.clientName + '_menu-item_inner');                  // Already used in Calendar
    textInputSelector = Selector(elements.clientName + '_text-input_input');                     // Text input
    //dateInputSelector = Selector(elements.clientName + '_date-input_input');                     // Date picker
    tasksTaskListSelector = Selector(elements.clientName + '_tasks_taskList');                   // Task Lists
    editTaskSelector = Selector(elements.clientName + '_tasks_isEditing');                       // Edit task
    popupTaskSelector = Selector(elements.clientName + '_tasks_popover');                       // Task detais popup
    renameTaskListSelector = Selector(elements.clientName + '_tasks_renameInput');                     // Rename TaskList
	errorAlertSelector = Selector(elements.clientName + '_error-alert_error');                   // Error alert message
	contextMenuSelector = Selector(elements.actionMenuGroup);									// Task item contextmenu

	dialog =  {

		async isDialogPresent(dialogName){
			const dilaogHeaderSelector = elements.dialogSelector.find('h2').withText(dialogName);
			return await dilaogHeaderSelector.exists;

		},

		async enterNewTaskText(text) {
			const newTaskTextInputSelector = tasks.textInputSelector.withAttribute('placeholder', 'Add Task');
			await t
				.click(newTaskTextInputSelector)
				.pressKey('ctrl+a')
				.pressKey('backspace')
				.typeText(newTaskTextInputSelector, text);
		},

		async enterDate(date) {
			const dateInputSelector = elements.labelSelector.withText('Due Date').sibling().find('input');
			await utilFunc.setDatePicker.with({ dependencies: { selectEl: dateInputSelector } })(date);
		},
	
		async selectPriority(priorityName) {
			const prioritySelector = elements.labelSelector.withText('Priority').sibling('div').find('select');
			await utilFunc.selectOption.with({ dependencies: { selectEl: prioritySelector } })(priorityName);

		},
		
	
		async selectTaskList(taskListName) {
			const listDropdownSelector = elements.labelSelector.withText('List').sibling('div').find('select');
			await utilFunc.selectOption.with({ dependencies: { selectEl: listDropdownSelector } })(taskListName);
		},
		
		async enterNotesText(text) {
			const notesTextInputSelector = elements.labelSelector.withText('Notes').sibling('textarea');
			await t
				.click(notesTextInputSelector)
				.pressKey('ctrl+a')
				.pressKey('backspace')
				.typeText(notesTextInputSelector, text);
		},
		
		async enterNewListText(text) {
			const newTaskListTextInputSelector = tasks.textInputSelector.withAttribute('placeholder', 'New List');
			await t
				.click(newTaskListTextInputSelector)
				.typeText(newTaskListTextInputSelector, text);
		},
		
		async clickModalDialogFooterButton(text) {
			await t.click(elements.calendarModalDialogButtonSelector.find('*').withText(text));
		},
	
		async isModalDialogFooterButtonDisable(text) {
			let IsDisabled;
			IsDisabled = await elements.calendarModalDialogButtonSelector.find('*').withText(text).hasAttribute('disabled');
			return IsDisabled;
		},
		async getErrorMessage() {
			return await tasks.errorAlertSelector.innerText;
		}

	};

	popup =  {

		async isNotesPresentInPopup(expectedNotes) {
			let actualNotes;
			await t.wait(1000);
			if (await tasks.popupTaskSelector.find('hr').exists === false) {
				return false;
			}
	
			actualNotes = await tasks.popupTaskSelector.find('div.zimbra-client_tasks_notes').innerText;
			if (actualNotes === expectedNotes) {
				return true;
			}
			return false;
		},
	
		async isHorizontalDividerInPopup() {
			await t.wait(1000);
			return await tasks.popupTaskSelector.find('hr').exists;
		},
		
		async isScrollbarforNotesInPopup() {
			await t.wait(1000);
			let notesElement = tasks.popupTaskSelector.find('div.zimbra-client_tasks_notes');
	
			if (notesElement.scrollHeight > notesElement.clientHeight) {
				return true;
			}
			return false;
		},
	
		async isTaskPresentInPopup(expectedTaskName) {
			let actualTaskName;
			await t.wait(1000);
			actualTaskName = String(await tasks.popupTaskSelector.find('div.zimbra-client_tasks_name').innerText);
			if (actualTaskName.indexOf(expectedTaskName) >= 0) {
				return true;
			}
			return false;
		}
	};

	header = {

		async clickTasksSettingsIcon() {
			await t.click(tasks.tasksActionsMenuButtonSelector);
		},
		
		async selectMenuItem(text) {
			await t.click(tasks.menuItemInnerSelector.withText(text));
		}

	};
	
	panel = {
		async clickTaskListPlusIcon(taskListName) {
			taskListName = String(taskListName).toUpperCase();
			await t.click(tasks.tasksTaskListSelector.find('*').withAttribute('title', taskListName).parent().find(tasks.tasksToggleAdd));
		},
	
		async clickPriorityListPlusIcon(priorityName) {
			await t.click(tasks.tasksTaskListSelector.find('*').withText(priorityName).parent().find(tasks.tasksToggleAdd));
		},
	
		async clickDueListPlusIcon(dueName) {
			await t.click(tasks.tasksTaskListSelector.find('*').withText(dueName).parent().find(tasks.tasksToggleAdd));
		},
		
		async enterAddTaskText(taskListName, taskName) {
			taskListName = String(taskListName).toUpperCase();
			const addTaskSelector = tasks.tasksTaskListSelector.find('*').withAttribute('title', taskListName).parent().nextSibling().find('*').withAttribute('placeholder', 'Add Task');
			await t
				.hover(tasks.tasksTaskListSelector.find('*').withAttribute('title', taskListName))
				.click(addTaskSelector)
				.typeText(addTaskSelector, taskName)
				.pressKey('enter');
		},
	
		async hoveroverTaskList(taskListName) {
			taskListName = String(taskListName).toUpperCase();
			await t
				.hover(tasks.tasksTaskListSelector.find('*').withAttribute('title', taskListName));
		},
	
		async rightClickonTaskListAndSelectOption(taskListName,option) {
			taskListName = String(taskListName).toUpperCase();
			await t
				.rightClick(await tasks.tasksTaskListSelector.find('*').withAttribute('title', taskListName))
				.click(await tasks.contextMenuSelector.find('span').withText(option));
		},
	
		async getTaskElement(parentName,taskName,taskView = 'Listview') {
			
			let taskElement = null;
	
			if (taskView === 'Listview') {
				taskElement = await tasks.tasksTaskListSelector.find('*').withAttribute('title', parentName).parent().nextSibling().find('*').withAttribute('title', taskName);
			}
			else if (taskView === 'Doneview') {
				taskElement = await tasks.tasksTaskListSelector.find('*').withAttribute('title', taskName);
			}
			else if (taskView === 'Priorityview') {
				taskElement = await tasks.tasksTaskListSelector.find('*').withAttribute('title',parentName).parent().nextSibling().find('*').withAttribute('title', taskName);
			}
			else { // DueDateview
				taskElement = await tasks.tasksTaskListSelector.find('*').withText(parentName).parent().nextSibling().find('*').withAttribute('title', taskName);
			}
	
			return taskElement;
		},
	
		async checkTaskExists(parentName, taskName, taskView = 'Listview') {
			parentName = String(parentName).toUpperCase();
			let taskElement = await this.getTaskElement(parentName,taskName,taskView);
			await t.wait(4000);
			return await taskElement.exists;
		},
	
		async checkTaskListExists(taskListName) {
			return await tasks.tasksTaskListSelector.find('*').withAttribute('title', String(taskListName).toUpperCase()).exists;
		},

		async isCheckboxDisable(taskListName) {
			return await tasks.tasksTaskListSelector.find('*').withAttribute('title', String(taskListName).toUpperCase()).parent().nextSibling().find('*').withAttribute('placeholder', 'Add Task').parent().find('input').withAttribute('disabled','').exists;
		},

		async isCheckboxEnable(taskListName, taskName) {
			let status = await tasks.tasksTaskListSelector.find('*').withAttribute('title', String(taskListName).toUpperCase()).parent().nextSibling().find('*').withAttribute('title', taskName).prevSibling('*').withAttribute('disabled','').exists;
			return !status;
		},
		
		async rightClickonTaskAndSelectOption(taskListName,taskName,option,taskView = 'Listview') {
			taskListName = String(taskListName).toUpperCase();
			let taskElement = await this.getTaskElement(taskListName,taskName,taskView);
	
			await t
				.rightClick(taskElement)
				.click(await tasks.contextMenuSelector.find('span').withText(option));
		},
	
	
		async doubleClickonTask(taskListName,taskName) {
			taskListName = String(taskListName).toUpperCase();
			await t
				.doubleClick(await tasks.tasksTaskListSelector.find('*').withAttribute('title', taskListName).parent().nextSibling().find('*').withAttribute('title', taskName));
		},
	
		async doubleClickonTaskList(taskListName) {
			taskListName = String(taskListName).toUpperCase();
			await t
				.doubleClick(await tasks.tasksTaskListSelector.find('*').withAttribute('title', taskListName));
		},
	
		async singleClickonTask(taskListName,taskName,taskView = 'Listview') {
			let taskElement = null;
			taskListName = String(taskListName).toUpperCase();
			if (taskView === 'Listview') {
				taskElement = tasks.tasksTaskListSelector.find('*').withAttribute('title',taskListName).parent().nextSibling().find('*').withAttribute('title', taskName);
			}
			else if (taskView === 'Doneview') {
				taskElement = tasks.tasksTaskListSelector.find('*').withAttribute('title', taskName);
			}
			else {
				taskElement = null;
			}
	
			await t
				.click(taskElement);
		},

		async taskExclamationMark(taskListName, taskName) {
			taskListName = String(taskListName).toUpperCase();
			let firstLine = tasks.tasksTaskListSelector.find('*').withAttribute('title', taskListName).parent().nextSibling().find('*').withAttribute('title', taskName).parent();
			return await firstLine.innerText;
		},
	
		// return task due date value placed at below the task name in the Tasks -List view
		async taskDueDateVal(taskListName, taskName) {
			taskListName = String(taskListName).toUpperCase();
			let secondLine = tasks.tasksTaskListSelector.find('*').withAttribute('title', taskListName).parent().nextSibling().find('*').withAttribute('title', taskName).parent().nextSibling();
			return await secondLine.innerText;
		},
	
		async markTaskAsDone(taskListName, taskName) {
			taskListName = String(taskListName).toUpperCase();
			await t.click(tasks.tasksTaskListSelector.find('*').withAttribute('title', taskListName).parent().nextSibling().find('*').withAttribute('title', taskName).parent().find('input[type=checkbox]'));
		},
	
		async unMarkDoneTask(taskName) {
			await t.click(tasks.tasksTaskListSelector.find('*').withAttribute('title', taskName).parent().find('input[type=checkbox]'));
		},

		async editTaskText(taskName) {
			await t
				.pressKey('ctrl+a')
				.pressKey('backspace')
				.typeText(tasks.editTaskSelector.find('form input'), taskName)
				.pressKey('enter');
		},
	
		async editTaskListText(taskListName) {
	
			await t
				.pressKey('ctrl+a')
				.pressKey('backspace')
				.typeText(await tasks.renameTaskListSelector.find('input'), taskListName)
				.pressKey('enter');
		}
	};
	 
}


export let tasks = new Tasks();