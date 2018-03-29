import { t } from 'testcafe';
import { elements } from './elements';

class Dialog {

	// click dialog overlay button with button text
	async clickDialogOverlayButton(buttonText) {
		await t.click(elements.blocksDialogOverlaySelector.find('button').withText(buttonText));
	}

	dialogButtonsWithText = withText => elements.dialogSelector.find('button').withText(withText)
}

export let dialog = new Dialog();