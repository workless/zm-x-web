/*eslint new-cap: ["error", { "capIsNew": false }]*/
/*eslint no-mixed-spaces-and-tabs: "off"*/
import { t, Selector } from 'testcafe';
import { elements } from './elements';
import { settings } from './settings';
import { stat } from 'fs';

class Mail {
	mailContentSelector = Selector(elements.clientName + '_viewer_desktop-viewer_viewerContent');
	notificationSelector = Selector(elements.clientName + '_notifications');
	
	// Get converstaion section count
	async getConverstationSectionCount() {
    	return await elements.conversationSectionSelector.child().count;
	}

	// Open condensed message
	async openCondensedMessage(index) {
    	await t.click(elements.inboxReadPane.find(elements.condensedMessage).nth(index));
	}

	// Get message with text
	//###<incorrect>### TODO: this needs to be fixed
	async clickMessageWithText(text) {
    	await t.click(elements.mailListItemMessageSelector.withText(text));
	}

    // Click toolbar buttons (pass index to click Reply, Reply All, Forward button). Otherwise pass button text.
    clickToolbarButton = async (item) => {
    	if (typeof item === 'string') {
    		await t.click(elements.viewerToolbarSelector.find('*').withText(item));
    	}
    	else {
    		await t.click(elements.viewerToolbarSelector.find(elements.actionButton).nth(item));
    	}
    }
	
	clickPopoverMenuItem = async (item) => {
		await t.click(elements.actionMenuDropDown.find('span').withText(item));
	}

	//wait progress indicator
	async waitProgressIndicator() {
    	while (await elements.progressIndicatorSelector.getAttribute('data-value') !== '0'){
    		await t.wait(50);
    	}
	}
	
	// Open email
	async openEmail(index) {
    	await t
    		.click(elements.mailListItemMessageSelector.nth(index))
    		.wait(1000);
    		//.click(elements.mailListItemMessageSelector.nth(index));
	}
	
	// Get conversation header title
	async getConversationHeaderSubject() {
    	return await elements.conversationSubjectSelector.innerText;
	}

	// Get message label count
	async getMessageLabelCount() {
    	let count = await elements.mailListPaneSelector.find(elements.messageLabel).nth(0).innerText;
    	return parseInt(count);
	}
	
	// Get message subject by index
	async getMessageSubject(index) {
    	return await elements.mailListPaneSelector.find(elements.messageItem).nth(index).find(elements.mailSubject).innerText;
	}
	
	//close attachment preview full screen
	async closePreviewFullScreen() {
		await t.click(elements.overlayView.find('button').withAttribute('title', 'Close'));
	}

	//select all the mails from mail list toolbar
	async selectAllMail() {
		await t.click(elements.mailListHeader.find('input').withAttribute('type', 'checkbox'));
	}
	
	async verifyMessageSnippets(messageSubject, expected){
		let selector = elements.mailListPaneSelector.find(elements.mailSubject).withText(messageSubject).parent().nextSibling().find('div.zimbra-client_mail-list-item_excerpt');

		if (await selector.exists) {
			if (String(await selector.innerText).includes(expected)) return true;
			return false;
		}
		else {
			return false;
		}
	}

	async clickonMessage(subject) {
    	await t
    		.click(elements.mailListPaneSelector.find(elements.mailSubject).withText(subject));
	}

	async getViewMailPanel(){
		await t.wait(4000);
		let isNoneView = !await elements.mailPanelSelector.find('div.zimbra-client_mail-pane_readPane').exists;
		let isRightView = await elements.mailPanelSelector.find('div.zimbra-client_mail-pane_narrow').exists;
		let isBottomView = await elements.mailPanelSelector.find('div.zimbra-client_mail-pane_withBottomPreview').exists;

		if (isNoneView) return 'None';
		if (isRightView) return 'Preview pane on the right';
		if (isBottomView) return 'Preview pane on the bottom';
	}

	async getMailBodyContent(viewType) {
		if (viewType === 'None') {
			let bodyContentSelector = await mail.mailContentSelector.find(`div[class$='desktop-viewer_body']`).innerText;
			return bodyContentSelector;
		}
	}

	async clickMessageNavigator(button) {
		if (button === 'UpArrow') {
			await t.click(elements.inboxReadPane.find('span.zimbra-icon-arrow-up'));
		}
		
		else if (button === 'DownArrow') {
			await t.click(elements.inboxReadPane.find('span.zimbra-icon-arrow-down'));
		}
		
		else if (button === 'Close') {
			await t.click(elements.inboxReadPane.find('span.zimbra-icon-close'));
		}
	}
	
	async getToastMessage(){
		return await mail.notificationSelector.innerText;
	}

	async IsMessageRead(subject) {
		let status = await elements.mailListPaneSelector.find(elements.mailSubject)
					.withText(subject).parent().parent().prevSibling()
					.find(`div[aria-label='Unread']`)
					.getAttribute('aria-checked');
		
		if (String(status).toUpperCase() == 'TRUE') return false;
		return true;
	}
	
	selectMail = (index) => elements.mailListItemMessageSelector.nth(index);
	getMailCount = () => elements.mailListItemMessageSelector.count;
	checkMailExists = (text) => elements.mailListItemMessageSelector.withText(text).exists;
	mailListStarIconButtonBySubject = (subject) => elements.mailListSubjectSelector.withText(subject).parent().find('span').nth(1);
}

export let mail = new Mail();