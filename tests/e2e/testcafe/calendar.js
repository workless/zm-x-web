import { profile } from './profile/profile';
import { calendar } from './page-model/calendar';
import { actions, utilFunc } from './page-model/common';
import { soap } from './utils/soap-client';
import { compose } from './page-model/compose';

fixture `Calendar fixture`
	.page(profile.hostURL)
	.before( async ctx => {
		ctx.adminAuthToken = await soap.getAdminAuthToken();
	})
	.beforeEach( async t => {
		try {
			t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
			t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
			await t.maximizeWindow();
			await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
			await actions.clickNavBarMenuItem('Calendar');
		}
		catch (error) {
			throw new Error('Error occured in the beforeEach method');
		}
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
	});

test('Create a single day event and verify in the Day, Week and Month view', async t => {

	let apt = calendar.appointment;
	apt.eventName = 'Sample Event';
	apt.notes = 'Sample Notes';
	apt.startTime = '15:00';
	apt.endTime = '16:00';
	apt.showAs = 'Busy';

	await calendar.createNewEvent(apt);
	
	await t.expect(await calendar.centerpanel.isthisEventexistInDayView(apt.eventName, '3 PM')).ok('Verify event is exist in Day View');
	await t.expect(await calendar.centerpanel.isthisEventexistInWeekView(apt.eventName, '3 PM')).ok('Verify event is exist in Week View');
	await t.expect(await calendar.centerpanel.isthisEventexistInMonthView(apt.eventName, await utilFunc.getDateyyyymmdd(0))).ok('Verify event is exist in Month View');
});

test('Create a All Day event using New Event button', async t => {
	let apt = calendar.appointment;
	apt.eventName = 'Sample Event';
	apt.notes = 'Sample Notes';
	apt.startTime = '15:00';
	apt.endTime = '16:00';
	apt.showAs = 'Busy';
	apt.isAllDay = true;

	await calendar.createNewEvent(apt);
	await t.expect(await calendar.centerpanel.isthisEventexistInWeekView(apt.eventName, 'All Day')).ok('Verify event is display on board');
});

test('Bug - PREAPPS-380: Share a calendar to other user', async t => {
	await calendar.sidepanel.rightClickOnCalendarSelectOption('My Calendars', 'Calendar', 'Share...');
	let newuser = await soap.createAccount(t.fixtureCtx.adminAuthToken);
	await calendar.dialog.shareCalendarWithUserWithRights(true, 'Calendar', newuser.email,'view free/busy times only');
	await t.expect(await calendar.dialog.getToastMessage()).contains('Shared with 1 contacts.','Verify the toast message');
	await t.wait(5000);
	await calendar.dialog.clickModalDialogFooterButton('Close');
	await soap.deleteAccount(newuser.id, t.fixtureCtx.adminAuthToken);
});


test('Bug - PREAPPS-380: Remove user from the shared calendar', async t => {
	await calendar.sidepanel.rightClickOnCalendarSelectOption('My Calendars', 'Calendar', 'Share...');
	let newuser = await soap.createAccount(t.fixtureCtx.adminAuthToken);
	await calendar.dialog.shareCalendarWithUserWithRights(true, 'Calendar', newuser.email,'view free/busy times only');
	await t.expect(await calendar.dialog.getToastMessage()).contains('Shared with 1 contacts.','Verify the toast message');
	await calendar.dialog.clickModalDialogFooterButton('Close');
	await calendar.sidepanel.rightClickOnCalendarSelectOption('My Calendars', 'Calendar', 'Share...');

	await calendar.dialog.removeUserFromShare('Calendar', newuser.email);
	await t.wait(5000);
	await calendar.dialog.clickModalDialogFooterButton('Close');
	await soap.deleteAccount(newuser.id, t.fixtureCtx.adminAuthToken);
});

test('Share a calendar as a public', async t => {
	await calendar.sidepanel.rightClickOnCalendarSelectOption('My Calendars', 'Calendar', 'Share...');
	await calendar.dialog.shareCalendarAsPublic(true, 'Calendar');
	await t.wait(5000);
	await calendar.dialog.clickModalDialogFooterButton('Close');
});

test('Create a new Holidays calendar folder on clicking the plus', async t => {
	await calendar.sidepanel.clickonPlusbutton('Holidays');
	await t.expect(await calendar.dialog.isDialogDisplay('Holiday Calendars')).ok('Verify the Holiday Calendars dailog is appeared');
	await calendar.dialog.selectHolidayFromDropdown('Indian Holidays');
	await calendar.dialog.clickModalDialogFooterButton('Next');
	await calendar.dialog.selectColor(2);
	await calendar.dialog.clickModalDialogFooterButton('Save');
	await t.wait(6000);
	await calendar.sidepanel.expandCalendarGroup('Holidays');
	await t.expect(await calendar.sidepanel.isNewCalendarAdded('Holidays', 'Indian Holidays')).ok('Verify the new Holidays calendar added');
});

test('Bug: PREAPPS-386 - Create a new Holidays calendar folder using action menu option', async t => {
	await calendar.centerpanel.selectActionMenuoption('Create New Calendar');
	await t.expect(await calendar.dialog.isDialogDisplay('Holiday Calendars')).ok('Verify the Holiday Calendars dailog is appeared');
	await calendar.dialog.selectHolidayFromDropdown('Indian Holidays');
	await calendar.dialog.clickModalDialogFooterButton('Next');
	await calendar.dialog.selectColor(2);
	await calendar.dialog.clickModalDialogFooterButton('Save');
	await t.wait(6000);
	await calendar.sidepanel.expandCalendarGroup('Holidays');
	await t.expect(await calendar.sidepanel.isNewCalendarAdded('Holidays', 'Indian Holidays')).ok('Verify the new Holidays calendar added');
});

test('Create a new calendar folder on clicking the plus', async t => {
	await calendar.sidepanel.clickonPlusbutton('My Calendars');
	await t.expect(await calendar.dialog.isDialogDisplay('Add Calendar')).ok('Verify the Add Calendar dailog is appeared');
	await calendar.dialog.enterCalendarname('Test');
	await calendar.dialog.selectColor(2);
	await calendar.dialog.clickModalDialogFooterButton('Save');
	await t.expect(await calendar.sidepanel.isNewCalendarAdded('My Calendars', 'Test')).ok('Verify the new calendar added');
});

test('Create a new calendar folder Using action menu option', async t => {
	await calendar.centerpanel.selectActionMenuoption('Create New Calendar');
	await t.expect(await calendar.dialog.isDialogDisplay('Add Calendar')).ok('Verify the Add Calendar dailog is appeared');
	await calendar.dialog.enterCalendarname('Test');
	await calendar.dialog.selectColor(2);
	await calendar.dialog.clickModalDialogFooterButton('Save');
	await t.expect(await calendar.sidepanel.isNewCalendarAdded('My Calendars', 'Test')).ok('Verify the new calendar added');
});

test('Bug - PREAPPS-364: L0: Verify the linking of the friends calendar', async t => {

	let newuser = await soap.createAccount(t.fixtureCtx.adminAuthToken);
	let newuserAuth = await soap.getUserAuthToken(newuser.email, newuser.password);
	let startDateTime = new Date().setHours(15,30,0);
	let endDateTime = new Date().setHours(16,30,0);
	await soap.createAppointment(newuserAuth,'TestSubject', newuser.email, t.ctx.user.email, startDateTime, endDateTime, 'Test Body');
	await soap.shareCalendarAsPublic(newuserAuth, 'Calendar');
	
	await calendar.sidepanel.clickonPlusbutton('Others');
	await calendar.sidepanel.selectAddFriendsCalendarOption();
	await t.expect(await calendar.dialog.isDialogDisplay('Add Calendar')).ok('Verify the Add Calendar dailog is appeared');
	await calendar.dialog.enterFriendEmail(newuser.email);
	await calendar.dialog.clickModalDialogFooterButton('Save');
	await t.expect(await calendar.dialog.isDialogDisplay('Add Calendar')).ok('Verify the Add Calendar dailog is appeared');
	await calendar.dialog.enterCalendarname('Test Friend');
	await calendar.dialog.clickModalDialogFooterButton('Save');
	await t.expect(await calendar.sidepanel.isNewCalendarAdded('Others','Test Friend')).ok('Verify that calendar is appear in the Other list');
	await soap.deleteAccount(newuser.id, t.fixtureCtx.adminAuthToken);

});

test('C830216 - L0: Verify the Friend calendar dialog', async t => {

	let newuser = await soap.createAccount(t.fixtureCtx.adminAuthToken);
	let newuserAuth = await soap.getUserAuthToken(newuser.email, newuser.password);
	await soap.createNewCalendar(newuserAuth,'Test Calendar 1');
	await soap.createNewCalendar(newuserAuth,'Test Calendar 2');
	await soap.createNewCalendar(newuserAuth,'Test Calendar 3');
	await soap.shareCalendarAsPublic(newuserAuth, 'Test Calendar 1');
	await soap.shareCalendarAsPublic(newuserAuth, 'Test Calendar 2');
	
	await calendar.sidepanel.clickonPlusbutton('Others');
	await calendar.sidepanel.selectAddFriendsCalendarOption();
	await t.expect(await calendar.dialog.isDialogDisplay('Add Calendar')).ok('Verify the Add Calendar dailog is appeared');
	await calendar.dialog.enterFriendEmail(newuser.email);
	await calendar.dialog.clickModalDialogFooterButton('Save');
	await t.expect(await calendar.dialog.isDialogDisplay('Add Calendar')).ok('Verify the Add Calendar dailog is appeared');
	await t.expect(await calendar.dialog.isCalendarNamePresentInList('Test Calendar 1')).ok('Verify the Test Calendar 1 is appear in the list');
	await t.expect(await calendar.dialog.isCalendarNamePresentInList('Test Calendar 2')).ok('Verify the Test Calendar 2 is appear in the list');
	await t.expect(await calendar.dialog.isCalendarNamePresentInList('Test Calendar 3')).notOk('Verify the Test Calendar 3 is not appear in the list');
	await soap.deleteAccount(newuser.id, t.fixtureCtx.adminAuthToken);
});

test('L0: Verify the prev next day value in Day Month and Year view', async t => {
	await calendar.clickToolBarTopButton('Day');
	await calendar.clickToolBarTopButton('Today');
	await calendar.centerpanel.clickPrevDayButton();
	let prevDate = new Date().setDate(new Date().getDate() -1);
	await t.expect(await calendar.centerpanel.getFullDateValue()).eql(await utilFunc.convertDateWeekdayMonthdateYear(prevDate), 'Verify the date value');
	let nextDate = new Date().setDate(new Date().getDate() + 1);
	await calendar.centerpanel.clickNextDayButton();
	await calendar.centerpanel.clickNextDayButton();
	await t.expect(await calendar.centerpanel.getFullDateValue()).eql(await utilFunc.convertDateWeekdayMonthdateYear(nextDate), 'Verify the date value');
	
	await calendar.clickToolBarTopButton('Month');
	await calendar.clickToolBarTopButton('Today');
	let prevMonth = new Date().setMonth(new Date().getMonth() -1);
	await calendar.centerpanel.clickPrevDayButton();
	await t.expect(await calendar.centerpanel.getFullDateValue()).eql(await utilFunc.convertDateMonthFullyear(prevMonth), 'Verify the Month value');
	let nextMonth = new Date().setMonth(new Date().getMonth() + 1);
	await calendar.centerpanel.clickNextDayButton();
	await calendar.centerpanel.clickNextDayButton();
	await t.expect(await calendar.centerpanel.getFullDateValue()).eql(await utilFunc.convertDateMonthFullyear(nextMonth), 'Verify the Month value');
	
	await calendar.clickToolBarTopButton('Year');
	await calendar.clickToolBarTopButton('Today');
	let prevYear = new Date().setFullYear(new Date().getFullYear() -1);
	await calendar.centerpanel.clickPrevDayButton();
	await t.expect(await calendar.centerpanel.getFullDateValue()).eql(await utilFunc.convertDateYear(prevYear), 'Verify the Year value');
	let nextYear = new Date().setFullYear(new Date().getFullYear() + 1);
	await calendar.centerpanel.clickNextDayButton();
	await calendar.centerpanel.clickNextDayButton();
	await t.expect(await calendar.centerpanel.getFullDateValue()).eql(await utilFunc.convertDateYear(nextYear), 'Verify the Year value');

});

test('Verify the Mini calendar day change behavior', async t => {
	await calendar.clickToolBarTopButton('Today');
	await calendar.clickToolBarTopButton('Day');
	let expectedDate = new Date().setDate(15);
	await calendar.sidepanel.clickDayInMinicalendar('15');
	await t.expect(await calendar.centerpanel.getFullDateValue()).eql(await utilFunc.convertDateWeekdayMonthdateYear(expectedDate), 'Verify the Date value');
	 
});

test('L1: Update the color of calendar', async t => {
	let expectedStyle = await calendar.sidepanel.rightClickOnCalendarSelectColor('My Calendars', 'Calendar', '2');
	let actualStyle = await calendar.sidepanel.getCalendarColor('My Calendars', 'Calendar');
	await t.expect(expectedStyle).eql(actualStyle, 'Verify the calendar color');

});

test('L1: Navigate Day view', async t => {
	await calendar.clickToolBarTopButton('Day');
	await calendar.clickToolBarTopButton('Today');
	let prevMonth = new Date().setMonth(new Date().getMonth() -1);
	let monthValue = await utilFunc.convertDateMonFullyear(prevMonth);
	await calendar.sidepanel.clickYearButtonandSelect(monthValue);


	let expectedStyle = await calendar.sidepanel.rightClickOnCalendarSelectColor('My Calendars', 'Calendar', '2');
	let actualStyle = await calendar.sidepanel.getCalendarColor('My Calendars', 'Calendar');
	await t.expect(expectedStyle).eql(actualStyle, 'Verify the calendar color');

});

test('Bug:PREAPPS-365 | C830217 - L1: Verify the Friend calendar feature with other domain user', async t => {
	let domainName = 'testdomain.com';
	let domainId = await soap.createDomain(t.fixtureCtx.adminAuthToken, domainName);
	let newuser = await soap.createAccount(t.fixtureCtx.adminAuthToken, domainName);
	try {
		await calendar.sidepanel.clickonPlusbutton('Others');
		await calendar.sidepanel.selectAddFriendsCalendarOption();
		await t.expect(await calendar.dialog.isDialogDisplay('Add Calendar')).ok('Verify the Add Calendar dailog is appeared');
		await calendar.dialog.enterFriendEmail(newuser.email);
		await calendar.dialog.clickModalDialogFooterButton('Save');
		await t.expect(await calendar.dialog.getErrorMsg()).ok('Verify the error message is appear');
	}
	finally {
		await soap.deleteAccount(newuser.id,t.fixtureCtx.adminAuthToken);
		await soap.deleteDomain(t.fixtureCtx.adminAuthToken, domainId);
	}
});

test.skip('Click calendar buttons', async t => {
	// await testRailClient.getTest(4440908 , function(test) {
	//     console.log(test);
	// });

	await calendar.clickToolBarTopButton('Week');
	await calendar.clickToolBarTopButton('Month');
	await calendar.clickToolBarTopButton('Year');
	await calendar.clickToolBarTopButton('List');
});

test('Create new calendar event - Empty title', async t => {
	await calendar.clickSidebarPrimaryButton('New Event');
	await calendar.dialog.clickModalDialogFooterButton('OK');
});

// Bug:Placeholder text 'New Event' is missing
test.skip('Create new calendar event - With title', async t => {
	await calendar.clickSidebarPrimaryButton('New Event');
	await calendar.enterNewEventText('My New Calendar Event');
	await calendar.dialog.clickModalDialogFooterButton('OK');
});

test('Click Add Calendar and cancel dialog', async t => {
	await calendar.clickCalendarListSectionActionButtion('My Calendar');
	await calendar.dialog.clickModalDialogFooterButton('Cancel');
});

test('Click Add Holidays and cancel dialog', async t => {
	await t.wait(3000);
	await calendar.clickCalendarListSectionActionButtion('Holidays');
	await calendar.dialog.clickModalDialogFooterButton('Cancel');
});

test('Click Add Friends Calendar and cancel dialog', async t => {
	await t.wait(3000);
	await calendar.clickCalendarListSectionActionButtion('Others');
	await calendar.clickMenuItem(`Add a Friend's Calendar`);
	await calendar.dialog.clickModalDialogFooterButton('Cancel');
});