/*eslint new-cap: ["error", { "capIsNew": false }]*/
import { profile } from '../profile/profile';
import { actions } from '../page-model/common';
import { settings } from '../page-model/settings';
import { elements } from '../page-model/elements';
import { Selector } from 'testcafe';
import { sidebar } from '../page-model/sidebar';
import { soap } from '../utils/soap-client';
import { mail } from '../page-model/mail';


fixture `Settings > Viewing email fixture`
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
    
test('L2 | Viewing email section present under settings | C711415', async t => {
	await settings.clickSettings();
	await t.expect(settings.IsSidebarItemDisplay('Viewing Email')).ok('Verify the viewing email tab should be present in sidebar', { timeout: 5000 });
});

test('L1 | Set preview pane to none | C711416', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Viewing Email');
	await settings.viewingEmail.selectPreviewPaneOption('None');
	await settings.clickModalDialogFooterButton('Save');
	await t.expect(await mail.getViewMailPanel()).eql('None', 'Verify the Panel View');

});

test('L1 | Set preview pane to none and verify actions | C711417', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Viewing Email');
	await settings.viewingEmail.selectPreviewPaneOption('None');
	await settings.clickModalDialogFooterButton('Save');
	await t.expect(await mail.getViewMailPanel()).eql('None', 'Verify the Panel View');
    await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email,'Subject1','body1');
    await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email,'Subject2','body2');
    await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email,'Subject3','body3');
    
    await actions.clickNavBarMenuItem('Mail');
    await sidebar.clickSidebarContent('Inbox');
    await mail.openEmail(0);
    await t.expect(await mail.getMailBodyContent('None')).contains('body3','Verify the body content');
    await mail.clickMessageNavigator('DownArrow');
    await t.expect(await mail.getMailBodyContent('None')).contains('body2','Verify the body content');
    

});

test('L2 | Set preview pane to none and tap up arrow on viewing first email | C711418', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Viewing Email');
	await settings.viewingEmail.selectPreviewPaneOption('None');
	await settings.clickModalDialogFooterButton('Save');
	await t.expect(await mail.getViewMailPanel()).eql('None', 'Verify the Panel View');
    await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email,'Subject1','body1');
    await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email,'Subject2','body2');
    
    await actions.clickNavBarMenuItem('Mail');
    await sidebar.clickSidebarContent('Inbox');
    await mail.openEmail(0);
    await t.expect(await mail.getMailBodyContent('None')).contains('body2','Verify the body content');
    await mail.clickMessageNavigator('UpArrow');
    await t.expect(await mail.getToastMessage()).contains('You have reached the first message in Inbox.','Verify the Toast message');

});

test('L2 | Set preview pane to none and tap down arrow on viewing last email | C711419', async t => {
	await settings.clickSettings();
	await settings.clickSettingSidebarItem('Viewing Email');
	await settings.viewingEmail.selectPreviewPaneOption('None');
	await settings.clickModalDialogFooterButton('Save');
	await t.expect(await mail.getViewMailPanel()).eql('None', 'Verify the Panel View');
    await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email,'Subject1','body1');
    await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email,'Subject2','body2');
    
    await actions.clickNavBarMenuItem('Mail');
    await sidebar.clickSidebarContent('Inbox');
    await mail.openEmail(1);
    await t.expect(await mail.getMailBodyContent('None')).contains('body1','Verify the body content');
    await mail.clickMessageNavigator('DownArrow');
    await t.expect(await mail.getToastMessage()).contains('You have reached the last message in Inbox.','Verify the Toast message');

});

test('L1 | Enabled view snippets from viewing email | C711420', async t=> {
    await settings.clickSettings();
	await settings.clickSettingSidebarItem('Viewing Email');
    await settings.viewingEmail.selectPreviewPaneOption('Preview pane on the right');
    await settings.viewingEmail.enableShowSnippets(true);
    await settings.clickModalDialogFooterButton('Save');
    await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email,'Subject1','body1');
    await actions.clickNavBarMenuItem('Mail');
    await sidebar.clickSidebarContent('Inbox');
    await t.expect(await mail.verifyMessageSnippets('Subject1','body1')).ok('Verify messsage snippets value');
   
});

test('L2 | Disabled view snippets from viewing email | C711421', async t=> {
    await settings.clickSettings();
	await settings.clickSettingSidebarItem('Viewing Email');
    await settings.viewingEmail.selectPreviewPaneOption('Preview pane on the right');
    await settings.viewingEmail.enableShowSnippets(false);
    await settings.clickModalDialogFooterButton('Save');
    await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email,'Subject1','body1');
    await actions.clickNavBarMenuItem('Mail');
    await sidebar.clickSidebarContent('Inbox');
    await t.expect(await mail.verifyMessageSnippets('Subject1','body1')).notOk('Verify messsage snippets value');
   
});


test('L1 | Enable desktop notification | C714455', async t=> {
    await settings.clickSettings();
	await settings.clickSettingSidebarItem('Viewing Email');
    await settings.viewingEmail.enableDesktopNotificaiton(true);
    await settings.clickModalDialogFooterButton('Save');
});

test('L1 | Disable desktop notification | C714456', async t=> {
    await settings.clickSettings();
	await settings.clickSettingSidebarItem('Viewing Email');
    await settings.viewingEmail.enableDesktopNotificaiton(false);
    await settings.clickModalDialogFooterButton('Save');
});

test('L1 | Mark as read set to immediately | C714457', async t=> {
    await settings.clickSettings();
	await settings.clickSettingSidebarItem('Viewing Email');
    await settings.viewingEmail.selectMarkasReadOption('Immediately');
	await settings.clickModalDialogFooterButton('Save');
	await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email,'Subject1','body1');
    await actions.clickNavBarMenuItem('Mail');
	await sidebar.clickSidebarContent('Inbox');
	await mail.clickonMessage('Subject1');
	await t.wait(1000);
	await t.expect(await mail.isMessageRead('Subject1')).ok('Verify that message has been read');
});


test('L2 | Mark as read set to 2 secs | C714458', async t=> {
    await settings.clickSettings();
	await settings.clickSettingSidebarItem('Viewing Email');
    await settings.viewingEmail.selectMarkasReadOption('After 2 seconds');
	await settings.clickModalDialogFooterButton('Save');
	await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email,'Subject1','body1');
    await actions.clickNavBarMenuItem('Mail');
	await sidebar.clickSidebarContent('Inbox');
	await mail.clickonMessage('Subject1');
	await t.wait(3000);
	await t.expect(await mail.isMessageRead('Subject1')).ok('Verify that message has been read');
});

test('L2 | Mark as read set to 5 secs | C714459', async t=> {
    await settings.clickSettings();
	await settings.clickSettingSidebarItem('Viewing Email');
    await settings.viewingEmail.selectMarkasReadOption('After 5 seconds');
	await settings.clickModalDialogFooterButton('Save');
	await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email,'Subject1','body1');
    await actions.clickNavBarMenuItem('Mail');
	await sidebar.clickSidebarContent('Inbox');
	await mail.clickonMessage('Subject1');
	await t.wait(6000);
	await t.expect(await mail.isMessageRead('Subject1')).ok('Verify that message has been read');
});

test('L2 | Mark as read set to Never | C714460', async t=> {
    await settings.clickSettings();
	await settings.clickSettingSidebarItem('Viewing Email');
    await settings.viewingEmail.selectMarkasReadOption('Never');
	await settings.clickModalDialogFooterButton('Save');
	await soap.sendMessage(t.ctx.userAuth,t.ctx.user.email,'Subject1','body1');
    await actions.clickNavBarMenuItem('Mail');
	await sidebar.clickSidebarContent('Inbox');
	await mail.clickonMessage('Subject1');
	await t.wait(10000);
	await t.expect(await mail.isMessageRead('Subject1')).notOk('Verify that message has been read');
});