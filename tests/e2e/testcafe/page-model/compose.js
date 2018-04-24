/*eslint new-cap: ["error", { "capIsNew": false }]*/
/*eslint no-mixed-spaces-and-tabs: ["off", "smart-tabs"]*/
import { Selector, t, ClientFunction } from 'testcafe';
import { elements } from './elements';

const getIframeElInnerHTML = ClientFunction((selectorStr) => {
	const els = document.querySelectorAll(selectorStr);
	return Array.prototype.map.call(els, el => el.innerHTML);
});

class Compose {
 
	//click composer footer button
	async clickComposerFooterbutton(text) {
        	await t.click(elements.composerFooter.find('*').withText(text));
	}

	//click composer delete button
	async clickComposerDelete() {
        	await t.click(elements.rteToolbarDeleteSelector);
	}
        
	// Click compose
	async clickCompose() {
        	await t.click(elements.composeButton);
	}
    
	// Enter text to textfield element
	async enterTextToFieldElement(enterText, textFieldEl) {
		let counter = 5;
		while (await textFieldEl.value !== enterText && counter > 0) {
			await t.typeText(textFieldEl, enterText,{ replace: true });
			counter = counter - 1;
		}
		await t.pressKey('enter');

	}
    
	// Enter text in compose body ## this does not work ATM
	async enterBodyText(text) {
        	const setContent = ClientFunction(value => getElement().innerHTML = value);
        	const textArea = await elements.richtextarea.find('rich-text-area').withAttribute('contenteditable', 'true');//Selector('.app').find('rich-text-area');
        	await setContent.with({ dependencies: { getElement: textArea } })(text);
	}

	// Enter text into compose subject field
	async enterComposeSubject(text) {
        	await t
        		.click(elements.composerSubject)
        		.wait(1000)
        		.typeText(elements.composerSubject, text, { speed: 0.5 })
        		.pressKey('enter')
        		.wait(1000);
	}
        
	// return number of attached image in richtextarea
	async getNumberOfAttachedImage(){
        	let numberOfAttachedImage = 0;
        	numberOfAttachedImage = await elements.iframeAttachedImageElements.count;
        	return numberOfAttachedImage;
	}
    
	// remove the top attached image from attachment in richtextarea
	async removeTopAttachedImage() {
        	await t
        		.hover(elements.iframeAttachedImageElements.nth(0))
        		.click(elements.iframeAttachedImageElements.nth(0).sibling().find('button').nth(1));
	}
    
	// Click to close
	async closeCompose() {
        	await t.click(elements.closeButton);
	}
    
	// Click Send button to send the email
	async sendEmail() {
        	await t.click(elements.richtextToolbarContainer.find('button').withText('Send'));
	}
		
	//get rich text area text
	async getRichtextareaText() {
        	const getContent = ClientFunction(() => getElement().textContent);
        	const textArea = await elements.richtextareaTextContentSelector;
        	return await getContent.with({ dependencies: { getElement: textArea } })();
	}
    
	// Click Plus sign icon
	async clickPlusSign() {
        	await t.click(elements.plusSignIcon);
	}
    
	//remove attached file
	async removeAttachedFile(ElIndex) {
        	await t.click(elements.attachedFileList.nth(ElIndex).find('button.zimbra-client_attachment_button'));
	}
        
	//clear search text
	async clearComposeSearchText() {
        	await t.click(elements.buttonClearSearch);
	}
    
	// return array of attached image data-cid
	async getAttachedImageDataCidArray() {
        	let imageArray = [];
        	let separator = 'data-cid=';
        	let imageArrayInnerHtml = String(await getIframeElInnerHTML('rich-text-area'));
        	let totalSeparatorCount = imageArrayInnerHtml.split(separator).length-1;
        	for (let i = 0; i < totalSeparatorCount; i ++) {
        		let cropString = imageArrayInnerHtml.substring(imageArrayInnerHtml.indexOf(separator) + separator.length + 1,imageArrayInnerHtml.length);
        		let restString = cropString.substring(0,cropString.indexOf('"'));
        		imageArray.push(restString);
        		imageArrayInnerHtml = cropString;
        	}
        	await t.switchToMainWindow();
        	return imageArray;
	}
    
	//click plus sign menu to open the menu
	async clickPlusSignMenuNavItem(byIndex) {
		await t
			.expect(elements.plusSignMenuNavBar.exists).ok({ timeout: 10000 })
        	.click(elements.plusSignMenuNavItem.nth(byIndex))
        	.wait(1000);
	}
    
	//click suggested search button
	async clickSuggestedSearchButton(buttonText) {
        	await t
        		.click(elements.buttonWithText(buttonText))
        		.wait(1000);
	}
    
	//click file from email from plus menu side bar
	async clickFileFromEmail(fileName) {
        	await t
        		.click(elements.plusSignMenuFileFromEmailAreaItemButton.withAttribute('title', fileName))
        		.wait(1000);
	}
    
	//click richtextarea_toolbar_items by item title
	async clickMenuItem (itemTitle) {
        	await t.click(elements.richtextareaToolbarItems.find('*').withAttribute('title',itemTitle));
	}
        
	//click address field suggestion (by index)
	async clickAddressFieldSuggesstionByIndex(byIndex) {
        	await t
        		.click(elements.addressFieldSuggestions.nth(byIndex))
        		.wait(1000);
	}

	//select toolbar popmenu
	async selectComposeToolbarPopmenu(toolbarTitle, popmenuSelectStr) {
        let elementTag = '';
        await t.click(compose.toolbarButtonsSelector(toolbarTitle));
        await t.wait(1000);
        switch (toolbarTitle) {
        	case 'Font':
        		elementTag = 'a';
        		break;
        	default:
        		elementTag = 'li';
		}
		await t.click(elements.blocksPopover.find('a').withText(popmenuSelectStr));
	}
		
	//select text color or highlight color
	async selectComoposeToolbarFontColor(textOrHighlight, byIndex) {
        await t.click(compose.toolbarButtonsSelector('Text Color'));
		await t.click(elements.blocksPopover.find('h3').withText(textOrHighlight).parent().find('a').nth(byIndex));
        await t.wait(1000);
	}
        
	//select toolbar menu Lists/Indentation
	async selectComposeToolbarListsByIndex(toolbarTitle, byIndex) {
        	await t.click(compose.toolbarButtonsSelector(toolbarTitle));
        	await t.click(elements.componentsToolbarMiddleSelector.find('li').nth(byIndex));
        	await t.wait(1000);
	}

	//insert link to a text
	async insertTextLink(linkStr) {
        	await t
        		.typeText(elements.dialogSelector.find('#editLink'), linkStr)
        		.click(elements.dialogSelector.find('button').withText('OK'));
	}

	//insert text to displayText field
	async insertDisplayText(displayText) {
		await t
			.typeText(elements.dialogSelector.find('#displayText'), displayText)
			.click(elements.dialogSelector.find('button').withText('OK'));
	}

	//insert Emoji to rich text area and return emoji data
	async insertEmoji(emojiButtonIndex) {
        	await t
        		.click(compose.toolbarButtonsSelector('Insert Emoji'))
        		.wait(2000);
        	const emojiData = await elements.emojiItemButton.nth(emojiButtonIndex).find('img').getAttribute('src');
        	await t
        		.click(elements.emojiItemButton.nth(emojiButtonIndex))
        		.wait(1000);
        	return emojiData;
	}
	
	//delete all the email has the same email subject
	async deleteAllMessageWithTitle(emailSubject) {
    	while (await elements.mailListSubjectSelector.withText(emailSubject).exists){
    		await this.openMessageWithSubject(emailSubject);
    		await this.clickToolbarButtonByName('Delete');
    		await t.wait(2000);
    	}
	}

	// Click tool bar button by the name: reply, replyAll, forward ... (other buttons use label text)
	async clickToolbarButtonByName(byName) {
		let buttonListStr = ['reply', 'replyAll', 'forward'];
		if (buttonListStr.indexOf(byName) > -1) {
			await t.click(elements.viewerToolbarSelector.find(elements.actionButton).nth(buttonListStr.indexOf(byName)));
		}
 		else {
			await t.click(elements.viewerToolbarSelector.find(elements.actionButton).withText(byName));
		}
	}

	//reply email
	async clickReplyButton() {
		await t.click(Selector('button').withText('Reply'));
	}

	//forward email
	async clickForwardButton() {
		await t.click(Selector('button').withText('Forward'));
	}

	// Open the first message with subject
	async openMessageWithSubject(subject) {
    	await t
    		.click(elements.mailListSubjectSelector.withText(subject));
	}

	// Open new message
	async openNewMessage(){
    	await t
    		.click(elements.mailListItemUnread)
    		.wait(1000)
    		.expect(elements.messageViewerHeaderTextSelector.exists).ok({ timeout: 10000 });
	}

	toolbarButtonsSelector = itemTitle => {
    	const buttonTitleChain = 'Switch to Plain Text, Switch to Rich Text, Bold, Italic, Underline';
    	const submenuTitleChain = 'Attachments, Lists, Text Alignment, Indentation, Link, Font, Insert Emoji, Text Color';
    	if (buttonTitleChain.includes(itemTitle)) {
    		return elements.componentsToolbarMiddleSelector.find('button').withAttribute('title', itemTitle);
    	}
    	else if (submenuTitleChain.includes(itemTitle)) {
    		return elements.componentsToolbarMiddleSelector.find('div').withAttribute('aria-haspopup', 'true').withAttribute('title', itemTitle);
    	}
	}

	// Get attachment innertext
	getAttachmentInnerText = () => elements.attachedFileList.innerText;
	checkComposerExists = () => elements.composerSelector.exists;
	checkRichTextEditorToolBarDeleteExists = () => elements.rteToolbarDeleteSelector.exists
	buttonAddressFieldTokenLabel = labelText => elements.buttonListAddressFieldTokenLabel.withText(labelText);
	addressFieldTextField = buttonText => elements.addressFieldSelector(buttonText).withText(buttonText).find('.zimbra-client_token-input_input');


	// Mobile - Click Send button to send the email
	async clickSendEmail() {
		await t.click(elements.toolbarSendButton);
	}
	
	// Mobile - Click Back Arrow to go previous view
	async clickBackArrow() {
		await t.click(elements.toolbarArrowBackIcon);
	}

	//Mobile - Click compose
	async clickComposeMobile() {
		await t.click(elements.toolbarComposeButton);
	}

	//Mobile - Click send
	async clickSendEmailMobile() {
		await t.click(elements.toolbarSendButton);
	}

}

export let compose = new Compose();