import get from 'lodash-es/get';
import { getEmail as normalizeEmail } from '../lib/util';

const ADDRESS_TYPES = {
	home: [ 'homeStreet', 'homeCity', 'homeState', 'homePostalCode', 'homeCountry' ]
//	work: [ 'workStreet', 'workCity', 'workState', 'workPostalCode', 'workCountry' ] // Currently unused
};
const ADDRESS_SUFFIXES = ['Street','City','State','Postal','Country'];
const ADDRESS_PREFIXES = ['work','home'];
const PHONE_TYPES = [ 'phone', 'mobile', 'homePhone', 'workPhone', 'fax', 'pager' ];
const EMAIL_TYPES = [ 'email', 'homeEmail', 'workEmail' ];

export function getJobDescription(contactAttributes) {
	return `${contactAttributes.jobTitle || ''}${contactAttributes.jobTitle &&
	contactAttributes.company
		? ', '
		: ''}${contactAttributes.company || ''}`;
}

/**
 * Return a valid display name for a GetContactsResponse or an
 * AutoCompleteResponse.
 * @param  {[type]} contact [description]
 * @return {[type]}         [description]
 */
export function displayAddress(contact) {
	return (
		get(contact, 'attributes.fullName') ||
		(get(contact, 'attributes.firstName') &&
			get(contact, 'attributes.lastName') &&
			`${contact.attributes.firstName} ${contact.attributes.lastName}`) ||
		get(contact, 'attributes.firstName') ||
		contact.full ||
		contact.name ||
		contact.first ||
		(contact.address || contact.email || '').split('@')[0]
	);
}

/**
 * Returns a valid email address for a GetContactsResponse or an
 * AutoCompleteResponse.
 */
export function getEmail(contact) {
	return get(contact, 'attributes.email') || normalizeEmail(contact.email);
}

/**
 * Get the primary name of a contact. This is the fullName, or combined first/middle/last name, or company name.
 */
export function getName({ fullName, firstName, middleName, lastName, company }) {
	return (
		fullName || [firstName, middleName, lastName].filter(Boolean).join(' ') || company
	);
}

/**
 * Print a formatted address from a contact.
 * @param {Object} contact        The contact to be printed
 * @returns {String}              Returns a formatted address for that contact
 */
export function printAddress(attributes) {
	return [
		attributes.Street,
		attributes.City,
		[ attributes.State, attributes.Postal ].filter(Boolean).join(' '),
		attributes.Country
	].filter(Boolean).join(', ');
}

/**
 * Returns a printed address of either home or work.
 * @param {Object} contact        The contact to be printed
 * @returns {String}              The address printed by {@function printAddress}
 */
export function getPrimaryAddress(contact) {
	if (findSomeDefinedKey(contact.attributes, ADDRESS_TYPES.home)) {
		return printAddress('home', contact);
	}

	return printAddress('work', contact);
}

/**
 * Returns a all address array that can be print
 * @param {Object} contact        The contact to be
 * @returns {Array}         return array that to be printed
 */
export function getAddressArray(contact){
	let addressArray = [];
	let itemList = Object.assign(contact);
	for (let i=0; i<= ADDRESS_PREFIXES.length; i++) {
		let count = 0;
		let prefix = ADDRESS_PREFIXES[i];
		do {
			count++;
			itemList.address = null;
			for (let j = 0; j < ADDRESS_SUFFIXES.length; j++) {
				let suffix = ADDRESS_SUFFIXES[j];
				let name = [prefix, suffix, count > 1 ? count : ''].join('');
				let value = contact.attributes[name];
				if (!value) { continue; }
				if (!itemList.address){
					itemList.address = {};
				}
				itemList.address[suffix] = value;
				itemList.address.type = ADDRESS_PREFIXES[i];
			}
		} while (itemList.address && addressArray.push(itemList.address));
	}
	return addressArray;
}

/**
 * Get the primary phone number for a contact.
 * @param {Object} contact     The contact to retrieve the phone number from.
 * @returns {String}           The primary phone number of the given contact.
 */
export function getPrimaryPhone(contact) {
	return get(contact, `attributes.${getPrimaryPhoneType(contact)}`);
}

/**
 * Get the primary phone type for a contact.
 * @param {Object} contact     The contact to retrieve the primary phone type from.
 * @returns {String}           The primary phone type of the given contact. One of [ 'phone', 'mobile', 'homePhone', 'workPhone', 'fax', 'pager' ].
 */
export function getPrimaryPhoneType({ attributes } = {}) {
	return findSomeDefinedKey(attributes, PHONE_TYPES);
}

/**
 * Get the primary email for a contact.
 * @param {Object} contact     The contact to retrieve the email address from.
 * @returns {String}           The primary email address of the given contact.
 */
export function getPrimaryEmail(contact) {
	return get(contact, `attributes.${getPrimaryEmailType(contact)}`);
}

/**
 * Get the primary email type for a contact.
 * @param {Object} contact     The contact to retrieve the email type from.
 * @returns {String}           The primary email type of the given contact. One of [ 'email', 'homeEmail', 'workEmail' ].
 */
export function getPrimaryEmailType({ attributes } = {}) {
	return findSomeDefinedKey(attributes, EMAIL_TYPES);
}

/**
 * Given an object and an array of keys, return the first key found on that object.
 * @param {Object} obj         The object to be searched.
 * @param {String[]} keys      The keys to search for in {@param obj}.
 * @returns {String}           The first key found in {@param obj}.
 * @example
 *   let obj = { fooKey: 'foo', barKey: 'bar' };
 *   let keys = [ 'junk', 'fooKey' ];
 *   assert(findSomeDefinedKey(obj, keys) === 'fooKey')
 */
function findSomeDefinedKey(obj, keys) {
	if (obj && keys && keys.length) {
		for (let index in keys) {
			if (keys[index] in obj) { return keys[index]; }
		}
	}
}

/**
 * Given an object and the key,return the array of values found on that object based on what key we passed
 * @param {Object} obj         The object to be seperate.
 * @param {String} key      The key to search for in {@param obj}.
 * @returns {Array}
 * @example
 *   let obj = { fooKey: 'foo', fooKey2: 'bar' , booKey : 'bar2' };
 *   let key = 'fooKey'
 *  return ['foo','bar'];
 */
export function groupBy(obj, key) {
	let matcher = new RegExp(`^${key}\\d*$`);
	return Object.keys(obj).filter(k => matcher.test(k)).sort((a, b) => {
		a = Number(a.slice(1)) || 1;
		b = Number(b.slice(1)) || 1;
		return a === b ? 0 : a > b ? 1 : -1;
	}).map(k => obj[k]);
}
