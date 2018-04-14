/*eslint new-cap: ["error", { "capIsNew": false }]*/
/*eslint no-mixed-spaces-and-tabs: "off"*/
import { t } from 'testcafe';
import { elements } from './elements';

class Mail {
	
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
	
	selectMail = (index) => elements.mailListItemMessageSelector.nth(index);
	getMailCount = () => elements.mailListItemMessageSelector.count;
	checkMailExists = (text) => elements.mailListItemMessageSelector.withText(text).exists;
	checkStarEnabledInMailList = () => elements.mailListItemMessageSelector.nth(0).find(elements.star).withAttribute('value', 'true');

}

export let mail = new Mail();