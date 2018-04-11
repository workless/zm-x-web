/*eslint new-cap: ["error", { "capIsNew": false }]*/
import { t, Selector } from 'testcafe';
import { elements } from './elements';
import { utilFunc } from './common';

class Calendar {
	
	 // Calendar Elements
	calendarActionButtonSelector = Selector(elements.clientName + '_calendar_toolbar_toolbarTop');
    calendarSidebarPrimaryButtonSelector = Selector(elements.clientName + '_sidebar-primary-button_button');
    calendarModalDialogTextInputSelector = Selector('input');
    calendarListGroupNameSelector = Selector(elements.clientName + '_calendar_calendar-list_groupName');
	calendarMenuItemSelector = Selector(elements.clientName + '_menu-item_inner');
	dialogEventInputSelector = Selector(elements.clientName + '_text-input_input').withAttribute('autofocus');
	attachmentSelector = Selector('button').withAttribute('title','Add Attachment');
	eventSelector = Selector(elements.clientName + '_calendar_event');
	timeSlotSelector = Selector('.rbc-time-column');
	timeHeaderSelector = Selector('.rbc-time-header');
	toolbarbuttonSelector = Selector(elements.clientName + '_action-button_text');
	listGroupSelector = Selector(elements.clientName + '_calendar_calendar-list_groupName');
	dialogTextInputSelector = Selector(elements.clientName + '_text-input_input');
	dialogColorSelector = Selector(elements.clientName + '_calendar_create-calendar-modal_colorPicker');
	actionMenuSelector = Selector(elements.clientName + '_action-menu_label');
	actionListSelector = Selector(elements.clientName + '_action-menu_dropdown');
	dateblockInMonthViewSelector =  Selector(elements.clientName + '_calendar_date-header_dateHeader').filter((node) => { if (node.className.indexOf('zimbra-client_calendar_date-header_isOffRange') < 0) return node;});
	minicalendarSelector = Selector(elements.clientName + '_calendar_mini-cal_monthView');
	poupOptionSelector = Selector(elements.clientName + '_fixed-popover_popover');
	labelSelector = Selector('label');
	buttonSelector = Selector('button');
	shareContactPreviewSelector = Selector(elements.clientName + '_share-dialog_contactPreviewAddress');
	toastSelector = Selector(elements.clientName +'_modal-toast_modalToast');
	dialogSelector = Selector(elements.clientName + '_modal-dialog_dialog');
	calendarListDropdownSelector = Selector(elements.clientName + '_select');
	miniCalendarYearButton = Selector(elements.clientName+'_calendar_mini-cal_button');
	yearListDropDown = Selector('.blocks_select_right');
	errorAlertSelector = Selector(elements.clientName + '_error-alert_error');

	
	appointment = {
		organizerEmail: null,
		eventName: null,
		notes: null,
		startDate: null,
		startTime: null,
		endDate: null,
		endTime: null,
		isPrivate: null,
		repeatOption: null,
		invitees: null,
		isAllDay: null,
		reminder: null,
		isMobileDesktop: null,
		isEmailNotify: null,
		showAs: null
	};

	dialog = {

		async isDialogDisplay(dialogTitle) {
			return await calendar.dialogSelector.find('h2').withText(dialogTitle).exists;
		},

		async clickModalDialogFooterButton(text) {
			await t.click(elements.calendarModalDialogButtonSelector.find('*').withText(text));
		},
		async enterStartDate(date) { // Test:: done working
			const dateInputSelector = elements.labelSelector.withText('Start').sibling().find('input[type=text]');
			await utilFunc.setDatePicker.with({ dependencies: { selectEl: dateInputSelector } })(date);
		},

		async enterEndDate(date) {
			const dateInputSelector = elements.labelSelector.withText('End').sibling().find('input[type=text]');
			await utilFunc.setDatePicker.with({ dependencies: { selectEl: dateInputSelector } })(date);
		},

		async enterStartTime(time) {
			const timeSelector = elements.labelSelector.withText('Start').sibling('input[type=time]');
			await utilFunc.setTime.with({ dependencies: { selectEl: timeSelector } })(time);
		},
		
		async enterEndTime(time) {
			const timeSelector = elements.labelSelector.withText('End').sibling('input[type=time]');
			await utilFunc.setTime.with({ dependencies: { selectEl: timeSelector } })(time);
		},
		
		async setAllDayEvent() {
			const allDaySelector = elements.labelSelector.withText('All Day').child('input[type=checkbox]');
			await t.click(allDaySelector);
		},

		async setPrivateEvent(toChecked) {
			const privatSelector = elements.labelSelector.withText('Private').child('input[type=checkbox]');
			let current = await privatSelector.checked;
			if (toChecked !== current) {
				await t.click(privatSelector);
			}
		},

		async enterInvitees(email) {
			const inviteeSelector = elements.labelSelector.withText('Invitees').sibling('div').find('input');
			await t.typeText(inviteeSelector, email);
		},

		async selectRepeatOption(repeatOption) {
			const repeateSelector = elements.labelSelector.withText('Repeat').sibling('div').find('select');
			await utilFunc.selectOption.with({ dependencies: { selectEl: repeateSelector } })(repeatOption);
		},

		async enterNotes(notes) {
			const notesSelector = elements.labelSelector.withText('Notes').sibling('div').find('textarea');
			await t.typeText(notesSelector, notes);
		},

		async selectReminder(reminder) {
			const reminderSelector = elements.labelSelector.withText('Remind').sibling('div').find('select');
			await utilFunc.selectOption.with({ dependencies: { selectEl: reminderSelector } })(reminder);
		},

		async setMobileDesktopReminder(toChecked) {
			const mobiledesktopSelector = elements.labelSelector.withText('Mobile/Desktop').child('input[type=checkbox]');
			let current = await mobiledesktopSelector.checked;
			if (toChecked !== current) {
				await utilFunc.fireChange.with({ dependencies: { selectEl: mobiledesktopSelector } })();
			}
		},

		async setEmailReminder(toChecked) {
			const emailSelector = elements.labelSelector.withText('Email').child('input[type=checkbox]');
			let current =  await emailSelector.checked;
			if (toChecked !== current) {
				await utilFunc.fireChange.with({ dependencies: { selectEl: emailSelector } })();
			}
		},

		async selectShowAs(eventStatus) {
			const showAsSelector = elements.labelSelector.withText('Show as').sibling('div').find('select');
			await utilFunc.selectOption.with({ dependencies: { selectEl: showAsSelector } })(eventStatus);
		},

		async clickAddAttachment(path) {
			const attachSelector = calendar.attachmentSelector;
			await t.doubleClick(attachSelector);
			await utilFunc.fireClick.with({ dependencies: { selectEl: attachSelector } })();
			await t.pressKey(path.split('').join(' '));
		},

		async enterCalendarname(name) {
			await t.typeText(calendar.dialogTextInputSelector, name);
		},

		async selectColor(index) {
			let color = calendar.dialogColorSelector.child().child('div:nth-child(' + index  +')');
			await t.click(color);
		},

		async selectHolidayFromDropdown(holidayName) {
			const holidayElement = calendar.dialogSelector.find('select');
			await utilFunc.selectOption.with({ dependencies: { selectEl: holidayElement } })(holidayName);
		},

		async shareCalendarAsPublic(toEnable, calendarName){
			if (!(await calendar.dialog.isDialogDisplay('Share Calendar: ' + calendarName))){
				throw new Error('Share calendar '+ calendarName +' does not appeared');
			}

			let option = calendar.labelSelector.withText('Enable my public calendar (easiest, least private)').child('input');
			let optionStatus = option.checked;
			if (optionStatus !== toEnable) {
				await utilFunc.fireChange.with({ dependencies: { selectEl: option } })();
			}
			await calendar.dialog.clickModalDialogFooterButton('Save');
		},

		async shareCalendarWithUserWithRights(toEnable, calendarName, userEmail = null, rightsName= 'view'){
			if (!(await calendar.dialog.isDialogDisplay('Share Calendar: ' + calendarName))){
				throw new Error('Share calendar '+ calendarName +' does not appeared');
			}


			let option = calendar.labelSelector.withText('Invite people by email (most flexible)').child('input');
			let optionStatus = option.checked;
			if (optionStatus !== toEnable) {
				await utilFunc.fireChange.with({ dependencies: { selectEl: option } })();
			}
			if (toEnable) {
				let emailElement = calendar.calendarModalDialogTextInputSelector.withAttribute('placeholder','Enter names or email addresses…');
				await t.typeText(emailElement, userEmail);
				let rightDropdownSelector = Selector('span').withText('Anyone with the link can').find('select');
				await utilFunc.selectOption.with({ dependencies: { selectEl: rightDropdownSelector } })(rightsName);
			}
			await calendar.dialog.clickModalDialogFooterButton('Save');
		},

		async getToastMessage(){
			return await calendar.toastSelector.innerText;
		},

		async removeUserFromShare(calendarName, email){
			if (!(await calendar.dialog.isDialogDisplay('Share Calendar: ' + calendarName))){
				throw new Error('Share calendar '+ calendarName +' does not appeared');
			}

			let changeLink = calendar.buttonSelector.withText('Change');
			if (!(await changeLink.exists)){
				throw new Error('Change link does not appeared');
			}
			await t.click(changeLink);

			let emailPreviewElement = calendar.shareContactPreviewSelector.withText(email);
			if (!(await emailPreviewElement.exists)){
				throw new Error('Email' + email +' does not appeared');
			}

			let deleteButton = emailPreviewElement.parent('tr.zimbra-client_share-dialog_accessTableRow').find('button[aria-label=Remove]');
			await t.click(deleteButton);

			await calendar.dialog.clickModalDialogFooterButton('Save');
		},

		async updateShareCalendar(toEnable, calendarName, listofEmail = null, rightsName= 'view'){
			if (!(await calendar.dialog.isDialogDisplay('Share Calendar: ' + calendarName))){
				throw new Error('Share calendar '+ calendarName +' does not appeared');
			}

			let option = calendar.labelSelector.withText('Invite people by email (most flexible)').child('input');
			let optionStatus = option.checked;
			if (optionStatus !== toEnable) {
				await utilFunc.fireChange.with({ dependencies: { selectEl: option } })();
			}
			if (toEnable) {
				let emailElement = calendar.calendarModalDialogTextInputSelector.withAttribute('placeholder','Enter names or email addresses…');
				await t.typeText(emailElement, listofEmail);
				let rightDropdownSelector = Selector('span').withText('Anyone with the link can').find('select');
				await utilFunc.selectOption.with({ dependencies: { selectEl: rightDropdownSelector } })(rightsName);
			}
			await calendar.dialog.clickModalDialogFooterButton('Save');
			try {
				await calendar.dialog.clickModalDialogFooterButton('Close');
			}
			catch (err) {
				throw new Error('Close button click issue at the dialog');
			}
		},

		async enterFriendEmail(email){
			await t.typeText(calendar.dialogTextInputSelector,email);

		},

		async isCalendarNamePresentInList(calendarName) {
			let calendarSelector =  calendar.calendarListDropdownSelector;
			let isPresent = await utilFunc.isSelectOptionPresent.with({ dependencies: { selectEl: calendarSelector } })(calendarName);
			return isPresent;
		},

		async getErrorMsg(){
			
			let element = await calendar.errorAlertSelector.find('span').exists;
			//console.log(element);
			return element;
		}

	};

	centerpanel = {

		async isthisEventexistInDayView(eventname, timeblock){
			await calendar.clickToolBarTopButton('Day');
			return await this.isthisEventexistInWeekView(eventname, timeblock);
		},

		async isthisEventexistInWeekView(eventname, timeblock){
			await calendar.clickToolBarTopButton('Week');
			await t.wait(7000);
			let element = await calendar.eventSelector.find('.zimbra-client_calendar_eventInner').withText(eventname).parent().parent();
			let timeslot = timeblock === 'All Day'?  await calendar.timeHeaderSelector.find('div').withText(timeblock).parent() : await calendar.timeSlotSelector.find('span').withText(timeblock).parent();
			
			if (!(await element.exists)) return false;

			let eleTopOff = await element.offsetTop;
			let slotTopoff = await timeslot.offsetTop;
			if (timeblock === 'All Day' && eleTopOff === 0) return true;
			
			if (Math.abs(eleTopOff - slotTopoff) < 2) {
				return true;
			}
			return false;
		},

		async isthisEventexistInMonthView(eventname, datetimeBlock){ // datetimeBlock format = yyyymmdd
			await calendar.clickToolBarTopButton('Month');
			await t.wait(7000);
			let element = await calendar.eventSelector.find('.zimbra-client_calendar_eventInner').withText(eventname).parent().parent();
			
			datetimeBlock = await utilFunc.convertDate(datetimeBlock);
			let date = datetimeBlock.split(',')[0].split(' ')[1];
			
			let dateBlock = calendar.dateblockInMonthViewSelector.withText(date).parent();
			
			let eventPosition = await element.offsetLeft;
			let blockPosition = await dateBlock.offsetLeft;
			

			if (Math.abs(eventPosition - blockPosition) < 2) {
				return true;
			}
			return false;
		},

		async selectActionMenuoption(option){
			await t.click(calendar.actionMenuSelector.withText('Actions'));
			await t.click(calendar.actionListSelector.find('span').withText(option).parent());
		},

		async clickPrevDayButton(){
			await t.click(calendar.calendarActionButtonSelector.nextSibling().child(0).find('span'));
		},

		async clickNextDayButton(){
			await t.click(calendar.calendarActionButtonSelector.nextSibling().child(1).find('span'));
		},

		async getFullDateValue(){
			return await calendar.calendarActionButtonSelector.nextSibling().find('h3').innerText;
		}
	};

	//--- Side Panel--------------------------------------------------------------------------------------------
	sidepanel = {
		async clickonPlusbutton(folderName){
			await t
				.hover(calendar.listGroupSelector.withText(folderName))
				.click(calendar.listGroupSelector.withText(folderName).nextSibling().find('span'));

		},

		async isNewCalendarAdded(parentCalendarname, newcalendarName){
			await t.wait(4000);
			await calendar.sidepanel.expandCalendarGroup(parentCalendarname);
			let newCal = calendar.listGroupSelector.withText(parentCalendarname).parent().nextSibling('ul').find('label').withText(newcalendarName);
			return await newCal.exists;
		},

		async expandCalendarGroup(parentCalendarname) {
			let expandSelector = calendar.listGroupSelector.withText(parentCalendarname).prevSibling().find('span');
			let isListalreadyExpand = await expandSelector().hasClass('fa-angle-down');
			
			if (!isListalreadyExpand)
				await t.click(expandSelector);
		},

		async rightClickOnCalendarSelectOption(parentCalendarname, calendarName, option) {
			await t.wait(4000);
			let calElement = await calendar.listGroupSelector.withText(parentCalendarname).parent().sibling('ul').find('label').withText(calendarName);
			await t.rightClick(calElement);
			await t.click(await calendar.poupOptionSelector.find('span').withText(option).parent());
		},

		async rightClickOnCalendarSelectColor(parentCalendarname, calendarName, colorIndex) {
			await t.wait(4000);
			let calElement = await calendar.listGroupSelector.withText(parentCalendarname).parent().sibling('ul').find('label').withText(calendarName);
			await t.rightClick(calElement);
			let color = await calendar.poupOptionSelector.find('div.zimbra-client_color-picker_colorPicker').child('div:nth-child(' + colorIndex  +')');
			let colorStyle = await color.child().getAttribute('style');
			await t.click(color);
			return colorStyle;
			
		},

		async getCalendarColor(parentCalendarname, calendarName) {
			await t.wait(7000);
			let calElement = await calendar.listGroupSelector.withText(parentCalendarname).parent().sibling('ul').find('label').withText(calendarName);
			return await calElement.find('input').getAttribute('style');
		},
		

		async selectAddFriendsCalendarOption(){
			await t.click(await calendar.poupOptionSelector.find('span').withText('Add a Friend\'s Calendar'));
		},

		async clickDayInMinicalendar(day) {
			await t.click(await calendar.minicalendarSelector.find('button').withText(day));
		},

		async clickYearButtonandSelect(changeMonth) {
			await t.click(calendar.miniCalendarYearButton);
			await t.click(calendar.yearListDropDown.find('*').withText(changeMonth));

		}
	};

	async createNewEvent(aptObj) {
		
		await calendar.clickSidebarPrimaryButton('NEW EVENT');
		if (aptObj.eventName !== null ) await calendar.enterNewEventText(aptObj.eventName);
		if (aptObj.notes !== null ) await calendar.dialog.enterNotes(aptObj.notes);
		if (aptObj.startDate !==null) await calendar.dialog.enterStartDate(aptObj.startDate);
		if (aptObj.startTime !==null) await calendar.dialog.enterStartTime(aptObj.startTime);
		if (aptObj.endDate !==null) await calendar.dialog.enterEndDate(aptObj.endDate);
		if (aptObj.endTime !==null) await calendar.dialog.enterEndTime(aptObj.endTime);
		if (aptObj.isPrivate !==null) await calendar.dialog.setPrivateEvent(aptObj.isPrivate);
		if (aptObj.repeatOption !==null) await calendar.dialog.selectRepeatOption(aptObj.repeatOption);
		if (aptObj.isPrivate !==null) await calendar.dialog.setPrivateEvent(aptObj.isPrivate);
		if (aptObj.invitees !==null) await calendar.dialog.enterInvitees(aptObj.invitees);
		if (aptObj.isAllDay !==null) await calendar.dialog.setAllDayEvent(aptObj.isAllDay);
		if (aptObj.reminder !==null) await calendar.dialog.selectReminder(aptObj.reminder);
		if (aptObj.isMobileDesktop !==null) await calendar.dialog.setMobileDesktopReminder(aptObj.isMobileDesktop);
		if (aptObj.isEmailNotify !==null) await calendar.dialog.setEmailReminder(aptObj.isEmailNotify);
		if (aptObj.showAs !==null) await calendar.dialog.selectShowAs(aptObj.showAs);
		await calendar.dialog.clickModalDialogFooterButton('OK');
	}

	async clickToolBarTopButton(text) {
	    await t.click(await calendar.toolbarbuttonSelector.withText(text));
	}

	async clickSidebarPrimaryButton(text) {
	    await t.click(calendar.calendarSidebarPrimaryButtonSelector.withText(text));
	}

	async enterNewEventText(text) {
		await t.typeText(this.dialogEventInputSelector, text);
	}

	async clickCalendarListSectionActionButtion(text) {
	    await t.click(calendar.calendarListGroupNameSelector.withText(text).nextSibling().child());
	}

	async clickMenuItem (text) {
	    await t.click(calendar.calendarMenuItemSelector.withText(text));
	}

}

export let calendar = new Calendar();