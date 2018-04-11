/*eslint no-mixed-spaces-and-tabs: "off"*/
/*eslint new-cap: ["error", { "capIsNew": false }]*/
import { t, ClientFunction, Selector } from 'testcafe';
import { elements } from './elements';

class PageActions {

	//Login the email page
	async loginEmailPage(name, password) {
		const loginButton = await elements.loginButton();
    	await t
    		.typeText(elements.username, name)
    		.typeText(elements.password, password)
    		.click(loginButton);
	}

	//
	async logoutEmailPage(userEmail) {
		await t.click(elements.mainHeaderActions.find('button').withText(userEmail.substring(0, userEmail.indexOf('@'))));
		await t.click(Selector('a').withText('Logout'));
	}

	// Click nav bar menu item
	async clickNavBarMenuItem(text) {
    		await t.click(elements.navButtonList.find('*').withText(text));
	}

	async clickOnUndo() {
		await t.click(elements.undoButtonSelector);
	}
	async getToastMessage() {
		return elements.toastMessageSelector.innerText;
	}
}

// ===================

export class UtilFunc {
	//check return if element className contains input string
	async isElementClassNamesContainsStr(element, containdStr) {
		return (String(await element.classNames).includes(containdStr));
	}

	//convert date yyyy-mm-dd to Months dd, yyyy format
	async convertDate(date) {
		let newDate = date.split('-');
		let months = ['January', 'February', 'March', 'April', 'May', 'June',
			'July', 'August', 'September', 'October', 'Movember', 'December'];
		return months[newDate[1] - 1] + ' ' + Number(newDate[2]) + ', ' + newDate[0];
	}

	// Get this date when you want to use in SOAP request
	async getDateyyyymmdd(day) {
		let today = new Date();
		let dd = today.getDate();
		let mm = today.getMonth()+1; //January is 0!
		let yyyy = today.getFullYear();
		dd = Number(dd) + Number(day);

		if (dd<10) {
			dd = '0'+dd;
		}

		if (mm<10) {
			mm = '0'+mm;
		}
		return yyyy + '-' + mm + '-' + dd ;
	}

	// Use this function when you want to enter date in Date Picker
	async getDatemmddyy(day) {
		let today = new Date();
		let dd = today.getDate();
		let mm = today.getMonth()+1; //January is 0!
		let yy = today.getFullYear().toString().substr(2,2);
		
		if (dd<10) {
			dd = '0'+dd;
		}

		if (mm<10) {
			mm = '0'+mm;
		}
		return  mm + '/' + (Number(dd) + Number(day)) + '/' + yy;
	}

	// convert date to Day mm/dd
	async calculateDueDate(date) {
		let msec = Date.parse(date);
		let d = new Date(msec);

		let weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		return weekday[d.getDay()] + ' ' + (d.getMonth() + 1) + '/' + d.getDate();

	}

	// convert date to Weekday, Month day fullyear
	async convertDateWeekdayMonthdateYear(date) {
		let d = new Date(date);
		let months = ['January', 'February', 'March', 'April', 'May', 'June',
			'July', 'August', 'September', 'October', 'November', 'December'];

		let weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		return weekday[d.getDay()] + ', ' +months[d.getMonth()] + ' '+ d.getDate() + ', '+ d.getFullYear();

	}

	async convertDateMonthFullyear(date) {
		let d = new Date(date);
		let months = ['January', 'February', 'March', 'April', 'May', 'June',
			'July', 'August', 'September', 'October', 'November', 'December'];

		return months[d.getMonth()] + ' ' + d.getFullYear();
	}

	async convertDateMonFullyear(date) {
		let d = new Date(date);
		let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
			'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

		return months[d.getMonth()] + ' ' + d.getFullYear();
	}

	async convertDateYear(date) {
		let d = new Date(date);

		return '' + d.getFullYear();
	}

	//For appointment Request in yyyymmddTHHmm00 format
	async convertDateTime(datetime) {
		let D = new Date(datetime);
		let dd = D.getDate() < 10 ? '0' + D.getDate() : D.getDate();
		let mm = D.getMonth()+1 < 10 ? '0' + (D.getMonth() + 1) : D.getMonth()+1;
		let yyyy = D.getFullYear().toString();
		let hours = D.getHours() < 10 ? '0' + D.getHours() : D.getHours();
		let minute = D.getMinutes() < 10 ? '0' + D.getMinutes() : D.getMinutes();
		
		return  yyyy+mm+dd+'T'+hours+minute +'00';
	}

	/************************************/
	/**** Helper ClientFunctions  *******/

	//Client function to scroll element up and down. ({dependencies:{scrollPosition: 'down'}} - this will scroll down the element. 'up'- will scrol up element)
	scrollElement = ClientFunction((el) => {
		if (scrollPosition === 'up') {
			return el().scrollTop = -1000;
		}
		return el().scrollTop = 1000;
	});

	//Verify drag and drop inline image area
	verifyDragDropArea = ClientFunction(() => {
		const dragOverHandler = () => {
			if (getDropzone() != null) {
				window.dropZoneExist = true;
				window.removeEventListener('dragover', dragOverHandler);
			}
		};
		window.addEventListener('dragover', dragOverHandler);
	});

	//Dropdown selection option work around, it return true if value present
	isSelectOptionPresent = ClientFunction(text => {
		let el = selectEl();
	
		let findOptionIndexByText = val => {
			for (let i = 0; i < el.options.length; i++) {
				if (el.options[i].text === val)
					return true;
			}
			return false;
		};
	
		let optionPresent = findOptionIndexByText(text);
		return optionPresent;
		
	});
	//Dropdown selection option work around, it returns index of option
	selectOption = ClientFunction(text => {
		let el = selectEl();
	
		let findOptionIndexByText = val => {
			for (let i = 0; i < el.options.length; i++) {
				if (el.options[i].text === val)
					return i;
			}
			return -1;
		};
	
		let optionIndex = findOptionIndexByText(text);
		el.selectedIndex = optionIndex;
		let clickEvent = new window.Event('change'); // Create the event.
		el.dispatchEvent( clickEvent );    // Dispatch the event.
	});

	//Sets the date in datepicker work around
	setDatePicker = ClientFunction(date => {
		let el = selectEl();
	
		el.value = date;

		let clickEvent = new Event('input'); // Create the event.
		el.dispatchEvent( clickEvent );
		
	});

	setTime = ClientFunction(text => {
		let el = selectEl();
	
		el.value = text;
		let clickEvent = new window.Event('input'); // Create the event.
		el.dispatchEvent( clickEvent );    // Dispatch the event.
		
	});

	fireClick = ClientFunction(() => {
		let el = selectEl();
	
		el.click();
		let clickEvent = new window.Event('click'); // Create the event.
		el.dispatchEvent( clickEvent );    // Dispatch the event.
	});

	fireChange = ClientFunction(() => {
		let el = selectEl();
	
		el.click();
		let clickEvent = new window.Event('change'); // Create the event.
		el.dispatchEvent( clickEvent );    // Dispatch the event.
	});

}

export let actions = new PageActions();
export let utilFunc = new UtilFunc();