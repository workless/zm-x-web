/*eslint new-cap: ["error", { "capIsNew": false }]*/
import { t, Selector } from 'testcafe';
import { elements } from './elements';
import { utilFunc } from './common';

class Settings {

	subsectionTitleSelector = Selector(elements.clientName +'_settings_subsectionTitle');
	settingsActivePanelSelector = Selector(elements.clientName + '_settings_activePanel');
	filterControlSelector = Selector(elements.clientName + '_settings_filtersControls');
	filterListSelector = Selector(elements.clientName + '_settings_filtersList');
	editFilterDialogSelector = Selector(elements.clientName + '_settings_filters-settings_filter-modal_filterModalInner');
	filterLabelSelector = this.editFilterDialogSelector.find(`div[class$='filter-modal_subsectionTitle']`);
	filterErrorSelector = this.editFilterDialogSelector.find(`div[class$='filter-modal_error']`);
	deleteFilterDialogSelector = Selector(elements.clientName + '_inline-modal-dialog_inner');

	filter = {
		FilterName: null,
		From_Compare: null,
		From_Value: null,
		From_Matchcase: false,
		Tocc_Compare: null,
		Tocc_Value: null,
		Tocc_Matchcase: false,
		Subject_Compare: null,
		Subject_Value: null,
		Subject_Matchcase: false,
		Body_Compare: null,
		Body_Value: null,
		Body_Matchcase: false,
		Move_To_Folder: null
	}


	selectFilterSelectByLabelSelector = (label) => elements.settingsFilterSubsectionTitleSelector.withText(label).sibling().find('select');

	async isSettingIconDisplay(){
		return await elements.iconCogSelector.exists;
	}
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
	    await t.click(elements.settingsModalDialogFooterButtonSelector.find('button').withText(text));
	}
	

	// Click enter vacation response text
	async clickEnterVacationResponse(text) {
	    await t.click(elements.settingsVacationResponseTextAreaSelector);
	    await t.typeText(elements.settingsVacationResponseTextAreaSelector, text);
	}

	async clickClearVacationResponse() {
	    await t.click(elements.settingsVacationResponseTextAreaSelector).pressKey('ctrl+a delete');
	}

	async selectFilterSelectByLabel(selectLabel, selectValue) {
		await t
			.click(this.selectFilterSelectByLabelSelector(selectLabel))
			.click(this.selectFilterSelectByLabelSelector(selectLabel).find('option').withText(selectValue));
	}

	filters = {
		async IsFilterBlockDisplay(){
			const title = settings.subsectionTitleSelector.withText('Sort incoming messages into folders');
			return await title.exists;
		},

		async IsAllOptionDisplayOnViewFilter(){
			const IsAddbtn = await settings.settingsActivePanelSelector.find('button').withText('Add').exists;
			const IsEditbtn = await settings.settingsActivePanelSelector.find('button').withText('Edit').exists;
			const IsRemovebtn = await settings.settingsActivePanelSelector.find('button').withText('Remove').exists;
			const IsUpArrow = await settings.filterControlSelector.find('span.zimbra-icon-arrow-up').exists;
			const IsDownArrow = await settings.filterControlSelector.find('span.zimbra-icon-arrow-down').exists;
			const IsFilterList = await settings.filterListSelector.exists;

			return IsAddbtn && IsEditbtn && IsRemovebtn && IsUpArrow && IsDownArrow && IsFilterList;
		},

		async IsAllOptionDisplayOnFilter(TitleName){
			const IsTitle = await settings.editFilterDialogSelector.find('div.zimbra-client_inline-modal-dialog_header').withText(TitleName).exists;
			
			const IsFilterNameLabel = await settings.filterLabelSelector.withText('Filter Name').exists;
			const IsFromLabel = await settings.filterLabelSelector.withText('From').exists;
			const IsTOCCLabel = await settings.filterLabelSelector.withText('To/CC').exists;
			const IsSubjectLabel = await settings.filterLabelSelector.withText('Subject').exists;
			const IsBodyLabel = await settings.filterLabelSelector.withText('Body').exists;
			const IsMoveMessageLabel = await settings.editFilterDialogSelector.find('div.zimbra-client_settings_filters-settings_filter-modal_subsection').withText('Then move the messages to this folder').exists;
			const IsSavebutton = await settings.editFilterDialogSelector.find('button').withText('Save').exists;
			const IsCancelbutton = await settings.editFilterDialogSelector.find('button').withText('Cancel').exists;

			console.log(IsTitle,IsFilterNameLabel,IsFromLabel,IsTOCCLabel,IsSubjectLabel,IsBodyLabel,IsMoveMessageLabel,IsSavebutton,IsCancelbutton);
			return IsTitle && IsFilterNameLabel && IsFromLabel && IsTOCCLabel && IsSubjectLabel && IsBodyLabel && IsMoveMessageLabel && IsSavebutton && IsCancelbutton;
		},

		async clickActivePanelButton(name) {
			let Button = settings.settingsActivePanelSelector.find('button').withText(name);
			await t.click(Button);
		},
		async clickFilterPanelButton(name) {
			let Button = settings.editFilterDialogSelector.find('.zimbra-client_inline-modal-dialog_footer').find('button').withText(name);
			await t.click(Button);
		},

		async IsfilterAdded(filtername) {
			return await settings.filterListSelector.find('li').withText(filtername).exists;
		},

		async verifyFilterMovetoFolder(moveToFolder){
			let DeliverFolder =  await settings.settingsActivePanelSelector.find('span').withText('Deliver to').find('b').innerText;
			if (String(DeliverFolder) === String(moveToFolder)) {
				return true;
			}
			return false;
		},

		async verifyFilterRule(Rulename, RuleValue){
			let DeliverFolder =  await settings.settingsActivePanelSelector.find('span').withText('Deliver to');
			if (await DeliverFolder.nextSibling().find('li').withText(Rulename + ' contains').exists) {
				RuleValue = '"' + RuleValue + '"';
				if (String(await DeliverFolder.nextSibling().find('li').withText(Rulename + ' contains').find('b').innerText) === String(RuleValue)) {
					return true;
				}
				
				console.log('Rule value is not exist');
				return false;
			}
			console.log('Rule name is not exist');
			return false;
			
		},

		async setFilterName(filtername) {
			let filternameInputSelector = settings.filterLabelSelector.withText('Filter Name').nextSibling().find('input');
			await t.typeText(filternameInputSelector, filtername);
		},

		// Take set of filter and fill the dialog
		async AddEditFilter(filter){

			if (filter.Move_To_Folder) this.setFilterMovetoFolder(filter.Move_To_Folder);
			if (filter.From_Compare) this.setFilterCompare('From',filter.From_Compare);
			if (filter.Subject_Compare) this.setFilterCompare('Subject',filter.Subject_Compare);
			if (filter.Tocc_Compare) this.setFilterCompare('To/CC',filter.Tocc_Compare);
			if (filter.Body_Compare) this.setFilterCompare('Body',filter.Body_Compare);
			if (filter.From_Value) this.setFilterValue('From',filter.From_Value);
			if (filter.Tocc_Value) this.setFilterValue('To/CC',filter.Tocc_Value);
			if (filter.Subject_Value) this.setFilterValue('Subject',filter.Subject_Value);
			if (filter.Body_Value) this.setFilterValue('Body',filter.Body_Value);
			if (filter.From_Matchcase) this.setMatchcase('From',filter.From_Matchcase);
			if (filter.Tocc_Matchcase) this.setMatchcase('To/CC',filter.Tocc_Matchcase);
			if (filter.Subject_Matchcase) this.setMatchcase('Subject',filter.Subject_Matchcase);
			if (filter.Body_Matchcase) this.setMatchcase('Body',filter.Body_Matchcase);
			if (filter.FilterName) this.setFilterName(filter.FilterName);

		},

		// Select the Comparision type of given Filter type
		async setFilterCompare(Ruletype, Comparision){
			let compareSelector = settings.filterLabelSelector.withText(Ruletype).nextSibling().find('select');
			await utilFunc.selectOption.with({ dependencies: { selectEl: compareSelector } })(Comparision);
		},
		// add filter value of given Filter type
		async setFilterValue(Ruletype, Value){
			let inputSelector = settings.filterLabelSelector.withText(Ruletype).nextSibling().find('input');
			await t.click(inputSelector).pressKey('ctrl+a delete').typeText(inputSelector, Value);
		},

		// Checked/Unchecked the Match case of given Filter type and boolean condition
		async setMatchcase(Ruletype, IsMatchcase) {
			let matchCaseSelector =  settings.filterLabelSelector.withText(Ruletype).nextSibling().find('label').withText('Match case').find('input');
			let current =  matchCaseSelector.checked;
			
			if (IsMatchcase !== current) {
				await t.hover(matchCaseSelector).click(matchCaseSelector);
				await t.wait(1000);
			}
		},

		// deprecated,
		async setFilterRule(Ruletype, Comparision, Value, IsMatchcase) {
			let compareSelector = settings.filterLabelSelector.withText(Ruletype).nextSibling().find('select');
			let inputSelector = settings.filterLabelSelector.withText(Ruletype).nextSibling().find('input');
			let matchCaseSelector = settings.filterLabelSelector.withText(Ruletype).nextSibling().find('label').find('input');
			await utilFunc.selectOption.with({ dependencies: { selectEl: compareSelector } })(Comparision);
			await t.typeText(inputSelector, Value);


			let current = await matchCaseSelector.checked;
			if (IsMatchcase !== current) {
				await t.click(matchCaseSelector);
			}
		},

		// select foldername in the the Message move to folder dropdown
		async setFilterMovetoFolder(foldername) {
			let moveFolderDropdownSelector = settings.editFilterDialogSelector
											 .find('div.zimbra-client_settings_filters-settings_filter-modal_moveIntoFolderLabel')
											 .withText('Then move the messages to this folder')
											 .nextSibling()
											 .find('select');
									
			await utilFunc.selectOption.with({ dependencies: { selectEl: moveFolderDropdownSelector } })(foldername);

		},

		// select filter from the filters list
		async clickFilterFromFiltersList(text) {
	 		await t.click(elements.settingsFiltersList.find('*').withText(text));
		},

		async clickDeleteFilterButton(button) {
			await t.click(settings.deleteFilterDialogSelector.find('div.zimbra-client_inline-modal-dialog_footer').find('button').withText(button));
		},

		async clickUpArrow(){
			let Button = settings.settingsActivePanelSelector.find('span.zimbra-icon-arrow-up');
			await t.click(Button);
		},

		async clickDownArrow(){
			let Button = settings.settingsActivePanelSelector.find('span.zimbra-icon-arrow-down');
			await t.click(Button);
		},

		async filterPositionInList(filterName) {

			let IsData = true, found =false;
			let index = 0;
			while (IsData) {
				if (await settings.filterListSelector.child(index).exists){
					if (String(await settings.filterListSelector.child(index).innerText) === filterName) {
						found = true;
						break;
					}
				}
				else {
					IsData = false;
				}
				index ++;
			}
			if (found)
				return index + 1;
			return -1;
		},


		async errorMessage(){
			let error = await settings.filterErrorSelector.exists;
			if (error) {
				return await settings.filterErrorSelector.innerText;
			}
			return 'No error';
		}
	};
}

export let settings = new Settings();