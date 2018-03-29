/*eslint new-cap: ["error", { "capIsNew": false }]*/
import { t } from 'testcafe';
import { elements } from './elements';

class Search {

	async clickSearch() {
	    await t.click(elements.searchInputSelector);
	}

	async enterText(text) {
	    await t.typeText(elements.searchInputSelector, text);
	}

	async hitEnter() {
	    await t.pressKey('enter');
	}

	async clickSearchMailButton() {
	    await t.click(elements.searchMailButtonSelector);
	}

	async clickSaveButton() {
	    await t.click(elements.searchToolbarSelector.find('button').withText('Save'));
	}

	async clickFolder(text) {
	    await t.click(elements.folderToggleSelector.withText(text));
	}

}

export let search = new Search();