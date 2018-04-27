/*eslint new-cap: ["error", { "capIsNew": false }]*/
import { profile } from '../profile/profile';
import { actions } from '../page-model/common';
import { settings } from '../page-model/settings';
import { elements } from '../page-model/elements';
import { Selector } from 'testcafe';
import { sidebar } from '../page-model/sidebar';
import { soap } from '../utils/soap-client';
import { mail } from '../page-model/mail';


fixture `Settings fixture`
	.page(profile.hostURL)
	.before( async ctx => {
		ctx.adminAuthToken = await soap.getAdminAuthToken();
	})
	.beforeEach( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		await t.maximizeWindow();
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
	});

test.skip('Enable and disable vacation response', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Vacation Response');
	await t.expect(elements.labelSelector.withText('Enable automatic response during these dates (inclusive)').exists).ok();
	await t.expect(elements.checkBoxSelector.checked).notOk(); // checkbox not checked
	await t.expect(Selector('button').withText('Send sample copy to me').hasAttribute('disabled')).ok(); // Send me copy button disabled
	await t.click(elements.checkBoxSelector);
	await t.expect(elements.checkBoxSelector.checked).ok();
	await settings.clickEnterVacationResponse('Sample vacation response text');
	await settings.clickDialogButton('Save'); // Enable vacation response
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Vacation Response');
	await t.expect(elements.checkBoxSelector.checked).ok();
	await settings.clickClearVacationResponse();
	await t.click(elements.checkBoxSelector);
	await settings.clickDialogButton('Save'); // Disable vacation response
});

test('L2 | Settings should have vacation response | C725276', async t => {
	await settings.clickSettings();
	await t.expect(settings.IsSidebarItemDisplay('Vacation Response')).ok('Verify the vacation response tab should be present in sidebar', { timeout: 5000 });
});

test('L2 | Settings should have vacation response | C725277', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Vacation Response');
	await t.expect(await settings.vacationResponse.IsAllOptionDisplayOnVacationRepose()).ok('Verify the vacation response view panel');
});

test('L1 | Enable automatic response and save | C725278', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Vacation Response');
	let vacationData = Object.create(settings.vactionResponseData);
	vacationData.Enable = true;

	await settings.vacationResponse.setVactionResponseData(vacationData);
	await settings.clickModalDialogFooterButton('Save');
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Vacation Response');
	await t.expect(await settings.vacationResponse.isVactionResponseEnable()).ok('Verify the Vacation Response enable');
});

/********************************/
/*** Settings > Filter fixture ***/
/********************************/

fixture `Settings > Filter fixture`
	.page(profile.hostURL)
	.before( async ctx => {
		ctx.adminAuthToken = await soap.getAdminAuthToken();
	})
	.beforeEach( async t => {
		t.ctx.user = await soap.createAccount(t.fixtureCtx.adminAuthToken);
		t.ctx.userAuth = await soap.getUserAuthToken(t.ctx.user.email, t.ctx.user.password);
		await t.maximizeWindow();
		await actions.loginEmailPage(t.ctx.user.email, t.ctx.user.password);
	})
	.afterEach( async t  => {
		await soap.deleteAccount(t.ctx.user.id, t.fixtureCtx.adminAuthToken);
	});

test('L0 | Filter option in settings | C681651', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');
	await t.expect(await settings.filters.IsFilterBlockDisplay()).ok('Verify that Filter block open');
});

test('L1 | Filter Menu options | C681652', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');
	await t.expect(await settings.filters.IsAllOptionDisplayOnViewFilter()).ok('Verify that Add, Edit, Remove, Up arrow, Down arrow and List of filter display');
});

test('L1 | Add filter options | C681654 | Bug:PREAPPS-404', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');
	await settings.filters.clickActivePanelButton('Add');
	await t.expect(await settings.filters.IsAllOptionDisplayOnFilter('Add Filter')).ok('Verify that Add, Edit, Remove, Up arrow, Down arrow and List of filter display');
});

test('L1 | Edit filter options | C681655', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.Body_Value = 'testbody';
	myFilter.Body_Matchcase = true;

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter);
 
	await settings.filters.clickFilterPanelButton('Save');
	await settings.clickModalDialogFooterButton('Save');
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	await settings.filters.clickFilterFromFiltersList(myFilter.FilterName);

	await settings.filters.clickActivePanelButton('Edit');
	await t.expect(await settings.filters.IsAllOptionDisplayOnFilter('Edit Filter')).ok('Verify that Add, Edit, Remove, Up arrow, Down arrow and List of filter display');
});

test('L1 | Remove filter cancel | C681656', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.Body_Value = 'testbody';
	myFilter.Body_Matchcase = true;

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter);
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.IsfilterAdded(myFilter.FilterName)).ok('Verify filter is created');
	await settings.clickModalDialogFooterButton('Save');
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');
	await settings.filters.clickFilterFromFiltersList(myFilter.FilterName);
	await settings.filters.clickActivePanelButton('Remove');
	await settings.filters.clickDeleteFilterButton('Cancel');
	await t.expect(await settings.filters.IsfilterAdded(myFilter.FilterName)).ok('Verify filter should be present in the list');
});

test('L1 | Remove filter Save | C681657', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.Body_Value = 'testbody';
	myFilter.Body_Matchcase = true;

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter);
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.IsfilterAdded(myFilter.FilterName)).ok('Verify filter is created');
	await settings.clickModalDialogFooterButton('Save');
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');
	await settings.filters.clickFilterFromFiltersList(myFilter.FilterName);
	await settings.filters.clickActivePanelButton('Remove');
	await settings.filters.clickDeleteFilterButton('Yes');
	await t.expect(await settings.filters.IsfilterAdded(myFilter.FilterName)).notOk('Verify filter should not be present in the list');
});

test('L2 | Down Arrow Functionality | C681659', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter1 = Object.create(settings.filter);
	myFilter1.FilterName = 'Test1';
	myFilter1.Body_Value = 'testbody1';
	myFilter1.Body_Matchcase = true;

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter1);
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.IsfilterAdded(myFilter1.FilterName)).ok('Verify filter is created');

	await settings.filters.clickUpArrow();

	let myFilter2 = Object.create(settings.filter);
	myFilter2.FilterName = 'Test2';
	myFilter2.Body_Value = 'testbody2';
	myFilter2.Body_Matchcase = true;

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter2);
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.IsfilterAdded(myFilter2.FilterName)).ok('Verify filter is created');

	let myFilter3 = Object.create(settings.filter);
	myFilter3.FilterName = 'Test3';
	myFilter3.Body_Value = 'testbody3';
	myFilter3.Body_Matchcase = true;

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter3);
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.IsfilterAdded(myFilter3.FilterName)).ok('Verify filter is created');

	await settings.clickModalDialogFooterButton('Save');
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	await settings.filters.clickFilterFromFiltersList(myFilter1.FilterName);

	await settings.filters.clickDownArrow();
	await settings.filters.clickDownArrow();
	await t.expect(await settings.filters.filterPositionInList(myFilter1.FilterName)).eql(3,'Verify the position of filter in the list');
});

test('L2 | Up Arrow Functionality | C681660', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter1 = Object.create(settings.filter);
	myFilter1.FilterName = 'Test1';
	myFilter1.Body_Value = 'testbody1';
	myFilter1.Body_Matchcase = true;

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter1);
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.IsfilterAdded(myFilter1.FilterName)).ok('Verify filter is created');

	await settings.filters.clickUpArrow();

	let myFilter2 = Object.create(settings.filter);
	myFilter2.FilterName = 'Test2';
	myFilter2.Body_Value = 'testbody2';
	myFilter2.Body_Matchcase = true;

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter2);
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.IsfilterAdded(myFilter2.FilterName)).ok('Verify filter is created');

	let myFilter3 = Object.create(settings.filter);
	myFilter3.FilterName = 'Test3';
	myFilter3.Body_Value = 'testbody3';
	myFilter3.Body_Matchcase = true;

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter3);
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.IsfilterAdded(myFilter3.FilterName)).ok('Verify filter is created');

	await settings.clickModalDialogFooterButton('Save');
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	await settings.filters.clickFilterFromFiltersList(myFilter3.FilterName);

	await settings.filters.clickUpArrow();
	await settings.filters.clickUpArrow();
	await t.expect(await settings.filters.filterPositionInList(myFilter3.FilterName)).eql(1,'Verify the position of filter in the list');

});

test('L2 | Filter Description | C681661', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.From_Value = 'test@test.com';
	myFilter.Body_Value = 'testBody';
	myFilter.Subject_Value = 'testSubject';

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter);
 
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.IsfilterAdded(myFilter.FilterName)).ok('Verify filter is created');
	await t.expect(await settings.filters.verifyFilterMovetoFolder('Inbox')).ok('Verify the Move to Folder is Inbox');
	await t.expect(await settings.filters.verifyFilterRule('From',myFilter.From_Value)).ok('Verify From filter rule should be display');
	await t.expect(await settings.filters.verifyFilterRule('Subject',myFilter.Subject_Value)).ok('Verify Subject filter rule should be display');
	await t.expect(await settings.filters.verifyFilterRule('Body',myFilter.Body_Value)).ok('Verify Body filter rule should be display');

});

test('L1 | Add new filter cancel | C681662', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');
	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.clickFilterPanelButton('Cancel');
	await t.expect(await settings.filters.IsfilterAdded('Test')).notOk('Verify that filter is not added');
});

test('L1 | Add new filter save | C681663', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.Body_Value = 'testbody';
	myFilter.Body_Matchcase = true;

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter);
 
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.IsfilterAdded('Test')).ok('Verify filter is created');
	await settings.clickModalDialogFooterButton('Save');
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');
	await t.expect(await settings.filters.IsfilterAdded('Test')).ok('Verify filter is present');
});

test('L1 | Add new Filter Name only | C681664', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');
	await settings.filters.clickActivePanelButton('Add');
	let myFilter =  Object.create(settings.filter);
	myFilter.FilterName = 'testName';
	await settings.filters.AddEditFilter(myFilter);
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.errorMessage()).eql('You must specify at least one filter rule', 'Verify the error message');
});

test('L1 | Add new Filter condition only | C681665', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');
	await settings.filters.clickActivePanelButton('Add');
	let myFilter =  Object.create(settings.filter);
	myFilter.Body_Value = 'testBody';
	await settings.filters.AddEditFilter(myFilter);
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.errorMessage()).eql('Filter name is invalid.', 'Verify the error message');
});

test('L1 | Add new filter Folder only  | C681666', async t => {
	let parentFolder = await soap.mailGetFolder(t.ctx.userAuth);
	await soap.mailCreateFolder(t.ctx.userAuth, parentFolder, 'testFolder1');
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');
	await settings.filters.clickActivePanelButton('Add');
	let myFilter =  Object.create(settings.filter);
	myFilter.Move_To_Folder = 'testFolder1';
	await settings.filters.AddEditFilter(myFilter);
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.errorMessage()).eql('Filter name is invalid.', 'Verify the error message');
});

test('L1 | Add new filter From condition only | C681673', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');
	await settings.filters.clickActivePanelButton('Add');

	let myFilter =  Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.From_Value = 'test@test.com';
	await settings.filters.AddEditFilter(myFilter);
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.IsfilterAdded(myFilter.FilterName)).ok('Verify filter is created');
	await settings.clickModalDialogFooterButton('Save');
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');
	await t.expect(await settings.filters.IsfilterAdded(myFilter.FilterName)).ok('Verify filter is present');
});

test('L1 | Add new filter toCC condition only | C681674', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');
	await settings.filters.clickActivePanelButton('Add');
	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.Tocc_Value = 'test@test.com';
	await settings.filters.AddEditFilter(myFilter);
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.IsfilterAdded(myFilter.FilterName)).ok('Verify filter is created');
	await settings.clickModalDialogFooterButton('Save');
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');
	await t.expect(await settings.filters.IsfilterAdded(myFilter.FilterName)).ok('Verify filter is present');
});

test('L1 | Add new filter Body condition only | C681675', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');
	await settings.filters.clickActivePanelButton('Add');
	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.Body_Value = 'testBody';
	await settings.filters.AddEditFilter(myFilter);
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.IsfilterAdded(myFilter.FilterName)).ok('Verify filter is created');
	await settings.clickModalDialogFooterButton('Save');
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');
	await t.expect(await settings.filters.IsfilterAdded(myFilter.FilterName)).ok('Verify filter is present');
});

test('L1 | Add new filter Subject condition only | C681676', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');
	await settings.filters.clickActivePanelButton('Add');
	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.Subject_Value = 'testSubject';
	await settings.filters.AddEditFilter(myFilter);
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.IsfilterAdded(myFilter.FilterName)).ok('Verify filter is created');
	await settings.clickModalDialogFooterButton('Save');
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');
	await t.expect(await settings.filters.IsfilterAdded(myFilter.FilterName)).ok('Verify filter is present');
});

test('L1 | Verify incoming condition Body only | C681681', async t => {
	await soap.mailCreateFolder(t.ctx.userAuth, '1', 'testFolder');
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.Body_Compare = 'matches exactly';
	myFilter.Body_Value = 'testbody';
	myFilter.Move_To_Folder = 'testFolder';

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter);
	await settings.filters.clickFilterPanelButton('Save');
	await settings.clickModalDialogFooterButton('Save');
	await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email,'test',myFilter.Body_Value);
	await actions.clickNavBarMenuItem('Mail');
	await sidebar.clickSidebarContent('Inbox');
	let messageCountInbox = await mail.getMailCount();
	await sidebar.clickFolder(/^Folders/);
	await sidebar.clickSidebarContent('testFolder');
	let messageCountTestfolder = await mail.getMailCount();
	await t.expect(messageCountInbox).eql(0,'Verify the Inbox message count should be zero');
	await t.expect(messageCountTestfolder).eql(1,'Verify the testfolder message count should be one');
});

test('L1 | Verify incoming condition subject only | C681680', async t => {
	await soap.mailCreateFolder(t.ctx.userAuth, '1', 'testFolder');
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.Subject_Compare = 'matches exactly';
	myFilter.Subject_Value = 'testSubject';
	myFilter.Move_To_Folder = 'testFolder';

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter);
	await settings.filters.clickFilterPanelButton('Save');
	await settings.clickModalDialogFooterButton('Save');
	await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email,myFilter.Subject_Value);
	await actions.clickNavBarMenuItem('Mail');
	await sidebar.clickSidebarContent('Inbox');
	let messageCountInbox = await mail.getMailCount();
	await sidebar.clickFolder(/^Folders/);
	await sidebar.clickSidebarContent('testFolder');
	let messageCountTestfolder = await mail.getMailCount();
	await t.expect(messageCountInbox).eql(0,'Verify the Inbox message count should be zero');
	await t.expect(messageCountTestfolder).eql(1,'Verify the testfolder message count should be one');
});

test('L1 | Verify incoming condition From only | C681678', async t => {
	await soap.mailCreateFolder(t.ctx.userAuth, '1', 'testFolder');
	let newuser = await soap.createAccount(t.fixtureCtx.adminAuthToken);
	let newuserAuth = await soap.getUserAuthToken(newuser.email, newuser.password);
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.From_Compare = 'matches exactly';
	myFilter.From_Value = newuser.email;
	myFilter.Move_To_Folder = 'testFolder';

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter);
	await settings.filters.clickFilterPanelButton('Save');
	await settings.clickModalDialogFooterButton('Save');
	await soap.sendMessage(newuserAuth,t.ctx.user.email,'testFromFilter');
	await actions.clickNavBarMenuItem('Mail');
	await sidebar.clickSidebarContent('Inbox');
	let messageCountInbox = await mail.getMailCount();
	await sidebar.clickFolder(/^Folders/);
	await sidebar.clickSidebarContent('testFolder');
	let messageCountTestfolder = await mail.getMailCount();
	await t.expect(messageCountInbox).eql(0,'Verify the Inbox message count should be zero');
	await t.expect(messageCountTestfolder).eql(1,'Verify the testfolder message count should be one');
});

test('L1 | Verify incoming condition To/cc only | C681679', async t => {
	await soap.mailCreateFolder(t.ctx.userAuth, '1', 'testFolder');
	let newuser = await soap.createAccount(t.fixtureCtx.adminAuthToken);
	let newuserAuth = await soap.getUserAuthToken(newuser.email, newuser.password);
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.Tocc_Compare = 'matches exactly';
	myFilter.Tocc_Value = newuser.email;
	myFilter.Move_To_Folder = 'testFolder';

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter);
	await settings.filters.clickFilterPanelButton('Save');
	await settings.clickModalDialogFooterButton('Save');
	await soap.sendMessage(newuserAuth,t.ctx.user.email,'testFromFilter','testBody',newuser.email);
	await actions.clickNavBarMenuItem('Mail');
	await sidebar.clickSidebarContent('Inbox');
	let messageCountInbox = await mail.getMailCount();
	await sidebar.clickFolder(/^Folders/);
	await sidebar.clickSidebarContent('testFolder');
	let messageCountTestfolder = await mail.getMailCount();
	await t.expect(messageCountInbox).eql(0,'Verify the Inbox message count should be zero');
	await t.expect(messageCountTestfolder).eql(1,'Verify the testfolder message count should be one');
});

test('L1 | 	Verify Incoming message meeting all condition | C681677', async t => {
	await soap.mailCreateFolder(t.ctx.userAuth, '1', 'testFolder');
	let newuser = await soap.createAccount(t.fixtureCtx.adminAuthToken);
	let newuserAuth = await soap.getUserAuthToken(newuser.email, newuser.password);
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.Subject_Value = 'TestSubject';
	myFilter.Body_Value = 'TestBody';
	myFilter.From_Value = newuser.email;
	myFilter.Move_To_Folder = 'testFolder';

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter);
	await settings.filters.clickFilterPanelButton('Save');
	await settings.clickModalDialogFooterButton('Save');
	await soap.sendMessage(newuserAuth,t.ctx.user.email,myFilter.Subject_Value,myFilter.Body_Value);
	await actions.clickNavBarMenuItem('Mail');
	await sidebar.clickSidebarContent('Inbox');
	let messageCountInbox = await mail.getMailCount();
	await sidebar.clickFolder(/^Folders/);
	await sidebar.clickSidebarContent('testFolder');
	let messageCountTestfolder = await mail.getMailCount();
	await t.expect(messageCountInbox).eql(0,'Verify the Inbox message count should be zero');
	await t.expect(messageCountTestfolder).eql(1,'Verify the testfolder message count should be one');
});


test('L1 | Verify incoming condition From only match case | C681683', async t => {
	await soap.mailCreateFolder(t.ctx.userAuth, '1', 'testFolder');
	let newuser = await soap.createAccount(t.fixtureCtx.adminAuthToken);
	let newuserAuth = await soap.getUserAuthToken(newuser.email, newuser.password);
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.From_Compare = 'matches exactly';
	myFilter.From_Value = newuser.email;
	myFilter.From_Matchcase = true;
	myFilter.Move_To_Folder = 'testFolder';

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter);
	await settings.filters.clickFilterPanelButton('Save');
	await settings.clickModalDialogFooterButton('Save');
	await soap.sendMessage(newuserAuth,t.ctx.user.email,'testFromFilter');
	await actions.clickNavBarMenuItem('Mail');
	await sidebar.clickSidebarContent('Inbox');
	let messageCountInbox = await mail.getMailCount();
	await sidebar.clickFolder(/^Folders/);
	await sidebar.clickSidebarContent('testFolder');
	let messageCountTestfolder = await mail.getMailCount();
	await t.expect(messageCountInbox).eql(0,'Verify the Inbox message count should be zero');
	await t.expect(messageCountTestfolder).eql(1,'Verify the testfolder message count should be one');
});


test('L1 | Verify incoming condition ToCC only match case | C681684', async t => {
	await soap.mailCreateFolder(t.ctx.userAuth, '1', 'testFolder');
	let newuser = await soap.createAccount(t.fixtureCtx.adminAuthToken);
	let newuserAuth = await soap.getUserAuthToken(newuser.email, newuser.password);
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.Tocc_Compare = 'matches exactly';
	myFilter.Tocc_Value = newuser.email;
	myFilter.Tocc_Matchcase = true;
	myFilter.Move_To_Folder = 'testFolder';

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter);
	await settings.filters.clickFilterPanelButton('Save');
	await settings.clickModalDialogFooterButton('Save');
	await soap.sendMessage(newuserAuth,t.ctx.user.email,'testFromFilter','testBody',newuser.email);
	await actions.clickNavBarMenuItem('Mail');
	await sidebar.clickSidebarContent('Inbox');
	let messageCountInbox = await mail.getMailCount();
	await sidebar.clickFolder(/^Folders/);
	await sidebar.clickSidebarContent('testFolder');
	let messageCountTestfolder = await mail.getMailCount();
	await t.expect(messageCountInbox).eql(0,'Verify the Inbox message count should be zero');
	await t.expect(messageCountTestfolder).eql(1,'Verify the testfolder message count should be one');
});

test('L1 | Verify incoming condition subject only match case | C681685', async t => {
	await soap.mailCreateFolder(t.ctx.userAuth, '1', 'testFolder');
	let newuser = await soap.createAccount(t.fixtureCtx.adminAuthToken);
	let newuserAuth = await soap.getUserAuthToken(newuser.email, newuser.password);
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.Subject_Value = 'testsubject';
	myFilter.Subject_Matchcase = true;
	myFilter.Move_To_Folder = 'testFolder';

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter);
	await settings.filters.clickFilterPanelButton('Save');
	await settings.clickModalDialogFooterButton('Save');
	await soap.sendMessage(newuserAuth,t.ctx.user.email,myFilter.Subject_Value);
	await actions.clickNavBarMenuItem('Mail');
	await sidebar.clickSidebarContent('Inbox');
	let messageCountInbox = await mail.getMailCount();
	await sidebar.clickFolder(/^Folders/);
	await sidebar.clickSidebarContent('testFolder');
	let messageCountTestfolder = await mail.getMailCount();
	await t.expect(messageCountInbox).eql(0,'Verify the Inbox message count should be zero');
	await t.expect(messageCountTestfolder).eql(1,'Verify the testfolder message count should be one');
	
	await soap.sendMessage(newuserAuth,t.ctx.user.email,'TESTSUBJECT');
	await sidebar.clickSidebarContent('Inbox');
	let countInbox = await mail.getMailCount();
	await sidebar.clickFolder(/^Folders/);
	await sidebar.clickSidebarContent('testFolder');
	let countTestFolder = await mail.getMailCount();
	await t.expect(countInbox).eql(1,'Verify the Inbox message count should be one');
	await t.expect(countTestFolder).eql(1,'Verify the testfolder message count should be one');
	
});

test('L1 | Verify incoming condition body only match case | C681686', async t => {
	await soap.mailCreateFolder(t.ctx.userAuth, '1', 'testFolder');
	let newuser = await soap.createAccount(t.fixtureCtx.adminAuthToken);
	let newuserAuth = await soap.getUserAuthToken(newuser.email, newuser.password);
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.Body_Value = 'testbody';
	myFilter.Body_Matchcase = true;
	myFilter.Move_To_Folder = 'testFolder';

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter);
	await settings.filters.clickFilterPanelButton('Save');
	await settings.clickModalDialogFooterButton('Save');
	await soap.sendMessage(newuserAuth,t.ctx.user.email,'testSubject',myFilter.Body_Value);
	await actions.clickNavBarMenuItem('Mail');
	await sidebar.clickSidebarContent('Inbox');
	let messageCountInbox = await mail.getMailCount();
	await sidebar.clickFolder(/^Folders/);
	await sidebar.clickSidebarContent('testFolder');
	let messageCountTestfolder = await mail.getMailCount();
	await t.expect(messageCountInbox).eql(0,'Verify the Inbox message count should be zero');
	await t.expect(messageCountTestfolder).eql(1,'Verify the testfolder message count should be one');
	
	await soap.sendMessage(newuserAuth,t.ctx.user.email,'testSubject','TESTBODY');
	await sidebar.clickSidebarContent('Inbox');
	let countInbox = await mail.getMailCount();
	await sidebar.clickFolder(/^Folders/);
	await sidebar.clickSidebarContent('testFolder');
	let countTestFolder = await mail.getMailCount();
	await t.expect(countInbox).eql(1,'Verify the Inbox message count should be one');
	await t.expect(countTestFolder).eql(1,'Verify the testfolder message count should be one');
	
});

test('L1 | Edit filter name | C681688', async t => {
	 
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.Body_Value = 'testbody';
	myFilter.Body_Matchcase = true;

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter);
 
	await settings.filters.clickFilterPanelButton('Save');
	await settings.clickModalDialogFooterButton('Save');
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	await settings.filters.clickFilterFromFiltersList(myFilter.FilterName);
	await settings.filters.clickActivePanelButton('Edit');
	let newFilter = Object.create(settings.filter);
	newFilter.FilterName = 'NewTest';
	newFilter.Body_Value = null;
	newFilter.Body_Matchcase = false;
	await settings.filters.AddEditFilter(newFilter);
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.IsfilterAdded(newFilter.FilterName)).ok('Verify filter is updated');
	await settings.clickModalDialogFooterButton('Save');
	 
});

test('L1 | Edit filter condition any | C681689', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.Body_Value = 'testbody';
	myFilter.Body_Matchcase = true;

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter);
 
	await settings.filters.clickFilterPanelButton('Save');
	await settings.clickModalDialogFooterButton('Save');
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	await settings.filters.clickFilterFromFiltersList(myFilter.FilterName);
	await settings.filters.clickActivePanelButton('Edit');
	let newFilter = Object.create(settings.filter);
	newFilter.FilterName = null;
	newFilter.Body_Value = 'Newtestbody';
	newFilter.Body_Matchcase = false;
	await settings.filters.AddEditFilter(newFilter);
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.IsfilterAdded('Test')).ok('Verify filter is updated');
	await settings.clickModalDialogFooterButton('Save');
});

test('L1 | Edit filter folder destination | C681690', async t => {
	let parentFolder = await soap.mailGetFolder(t.ctx.userAuth);
	await soap.mailCreateFolder(t.ctx.userAuth, parentFolder, 'testFolder1');
	await soap.mailCreateFolder(t.ctx.userAuth, parentFolder, 'testFolder2');
	await t.eval(() => location.reload(true));
	await t.wait(2000);
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.Body_Value = 'testbody';
	myFilter.Move_To_Folder = 'testFolder1';

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter);
 
	await settings.filters.clickFilterPanelButton('Save');
	await settings.clickModalDialogFooterButton('Save');
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	await settings.filters.clickFilterFromFiltersList(myFilter.FilterName);
	await settings.filters.clickActivePanelButton('Edit');
	let newFilter = Object.create(settings.filter);
	newFilter.FilterName = null;
	newFilter.Body_Value = null;
	newFilter.Move_To_Folder = 'testFolder2';
	await settings.filters.AddEditFilter(newFilter);
	
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.IsfilterAdded('Test')).ok('Verify filter is updated');
	await settings.clickModalDialogFooterButton('Save');
});

test('L1 | Verify incoming message after edit filter, any condition | C681691', async t => {
	let parentFolder = await soap.mailGetFolder(t.ctx.userAuth);
	await soap.mailCreateFolder(t.ctx.userAuth, parentFolder, 'testFolder1');
	await soap.mailCreateFolder(t.ctx.userAuth, parentFolder, 'testFolder2');
	await t.eval(() => location.reload(true));
	await t.wait(2000);
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.Body_Value = 'testbody';
	myFilter.Move_To_Folder = 'testFolder1';

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter);
 
	await settings.filters.clickFilterPanelButton('Save');
	await settings.clickModalDialogFooterButton('Save');

	await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email,'testSubject','testbody');
	await actions.clickNavBarMenuItem('Mail');
	await sidebar.clickSidebarContent('Inbox');
	let messageCountInbox = await mail.getMailCount();
	await sidebar.clickFolder(/^Folders/);
	await sidebar.clickSidebarContent(myFilter.Move_To_Folder);
	let messageCountTestfolder = await mail.getMailCount();
	await t.expect(messageCountInbox).eql(0,'Verify the Inbox message count should be zero');
	await t.expect(messageCountTestfolder).eql(1,'Verify the testfolder message count should be one');

	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	await settings.filters.clickFilterFromFiltersList(myFilter.FilterName);
	await settings.filters.clickActivePanelButton('Edit');
	let newFilter = Object.create(settings.filter);
	newFilter.FilterName = null;
	newFilter.Body_Value = null;
	newFilter.Move_To_Folder = 'testFolder2';
	await settings.filters.AddEditFilter(newFilter);
	
	await settings.filters.clickFilterPanelButton('Save');
	await t.expect(await settings.filters.IsfilterAdded('Test')).ok('Verify filter is updated');
	await settings.clickModalDialogFooterButton('Save');

	await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email,'testSubject','testbody');
	await actions.clickNavBarMenuItem('Mail');
	await sidebar.clickSidebarContent('Inbox');
	let countInbox = await mail.getMailCount();
	await sidebar.clickFolder(/^Folders/);
	await sidebar.clickSidebarContent(newFilter.Move_To_Folder);
	let countNewTestFolder = await mail.getMailCount();
	await t.expect(countInbox).eql(0,'Verify the Inbox message count should be zero');
	await t.expect(countNewTestFolder).eql(1,'Verify the testfolder message count should be one');
});


test('L1 | Verify incoming message after renaming folder | C681692', async t => {
	let parentFolder = await soap.mailGetFolder(t.ctx.userAuth);
	await soap.mailCreateFolder(t.ctx.userAuth, parentFolder, 'testFolder1');
	await t.eval(() => location.reload(true));
	await t.expect(settings.isSettingIconDisplay()).ok('waiting for setting icon display',{ timeout: 5000 });
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Filters');

	let myFilter = Object.create(settings.filter);
	myFilter.FilterName = 'Test';
	myFilter.Body_Value = 'testbody';
	myFilter.Move_To_Folder = 'testFolder1';

	await settings.filters.clickActivePanelButton('Add');
	await settings.filters.AddEditFilter(myFilter);
 
	await settings.filters.clickFilterPanelButton('Save');
	await settings.clickModalDialogFooterButton('Save');

	await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email,'testSubject','testbody');
	await actions.clickNavBarMenuItem('Mail');
	await sidebar.clickSidebarContent('Inbox');
	let messageCountInbox = await mail.getMailCount();
	await sidebar.clickFolder(/^Folders/);
	await sidebar.clickSidebarContent(myFilter.Move_To_Folder);
	let messageCountTestfolder = await mail.getMailCount();
	await t.expect(messageCountInbox).eql(0,'Verify the Inbox message count should be zero');
	await t.expect(messageCountTestfolder).eql(1,'Verify the testfolder message count should be one');

	await sidebar.renameFolder(myFilter.Move_To_Folder,'testFolder2');

	await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email,'testSubject','testbody');
	await actions.clickNavBarMenuItem('Mail');
	await sidebar.clickSidebarContent('Inbox');
	let countInbox = await mail.getMailCount();
	await sidebar.clickFolder(/^Folders/);
	await sidebar.clickSidebarContent('testFolder2');
	let countNewTestFolder = await mail.getMailCount();
	await t.expect(countInbox).eql(0,'Verify the Inbox message count should be zero');
	await t.expect(countNewTestFolder).eql(2,'Verify the testfolder message count should be one');
});