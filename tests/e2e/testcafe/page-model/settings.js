/*eslint new-cap: ["error", { "capIsNew": false }]*/
import { t } from 'testcafe';
import { elements } from './elements';

class Settings {
    
	async clickSettings() {
	    await t.click(elements.iconCogSelector);
	}

	// Click on settings sideBar content element
	async clickSettingSidebarItem(sideBarText) {
	    await t.click(elements.settingsSidebarItemSelector.withText(sideBarText));
	}

	// Click subsection body button
	async clickSubsectionBodyButton(buttonText) {
	    await t.click(elements.subsectionBodyButtonSelector.withText(buttonText));
	}

	// Enter filter name
	async enterEditFilterText(filterName, inputText) {
	    const inputElement = await elements.settingsFilterSubsectionTitleSelector.withText(filterName).parent('div').find('input').withAttribute('type', 'text');
	    await t.click(inputElement);
	    await t.typeText(inputElement,inputText);
	}

	// Click Save/Cancel button
	async clickDialogButton(buttonText) {
	    await t.click(elements.blocksButtonSelector.withText(buttonText));
	}

	// Click Modal dialog Footer button
	async clickModalDialogFooterButton(text) {
	    await t.click(elements.settingsModalDialogFooterButtonSelector.find('*').withText(text));
	}

	// Click filter from filters list
	async clickFilterFromFiltersList(text) {
	    await t.click(elements.settingsFiltersList.find('*').withText(text));
	}

	// Click enter vacation response text
	async clickEnterVacationResponse(text) {
	    await t.click(elements.settingsVacationResponseTextAreaSelector);
	    await t.typeText(elements.settingsVacationResponseTextAreaSelector, text);
	}

	async clickClearVacationResponse() {
	    await t.click(elements.settingsVacationResponseTextAreaSelector).pressKey('ctrl+a delete');
	}

}

export let settings = new Settings();