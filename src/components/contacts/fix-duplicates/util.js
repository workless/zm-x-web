import { getId, munge } from '../../../lib/util';


/** Check if two fields are non-empty and loosely equal (@see munge) */
export function fieldMatches(a, b) {
	return a!=null && munge(a)===munge(b);
}


/** Check if two contacts represent a duplication.
 *	@param {Object} contactA
 *	@param {Object} contactB
 *	@returns {Boolean} isDuplicate
 */
export function isDuplicate(a, b) {
	// same email:
	if (fieldMatches(a.attributes.email, b.attributes.email)) return true;

	// same name, same first+last, same first w/ last initial, same last w/ first initial:
	if (fieldMatches(a.attributes.fullName, b.attributes.fullName) || nameMatches(a.attributes, b.attributes)) return true;

	return false;
}


function firstLetter(str) {
	return typeof str==='string' ? str.charAt(0) : '';
}


function nameMatches(a, b) {
	let firstMatches = fieldMatches(a.firstName, b.firstName),
		lastMatches = fieldMatches(a.lastName, b.lastName);
	return (
		firstMatches && lastMatches ||
		lastMatches && fieldMatches(firstLetter(a.firstName), firstLetter(b.firstName)) ||
		firstMatches && fieldMatches(firstLetter(a.lastName), firstLetter(b.lastName))
	);
}


/** Given a list of contact objects, returns a list of duplicate entries.
 *	@param {Array<Contact>} contacts
 *	@returns {Array<Duplicate>} duplicates
 */
export function computeDuplicates(contacts) {
	// @TODO hoist reducer & filter
	return contacts.reduce( (duplicates, contact) => {
		let found = false;
		for (let i=duplicates.length; i--; ) {
			let item = duplicates[i];

			if (isDuplicate(item, contact)) {
				item.contacts.push(contact);
				if (!fieldMatches(item.attributes.email, contact.attributes.email)) {
					item.exactMatch = false;
				}
				Object.assign(item.attributes, contact.attributes);
				found = true;
				break;
			}
		}

		if (!found) {
			duplicates.push(/** @lends Duplicate# */ {
				...contact,
				attributes: { ...contact.attributes },
				id: 'duplicate-'+contact.id,
				exactMatch: true,
				contacts: [contact]
			});
		}

		return duplicates;
	}, []).filter( entry => entry.contacts.length>1 );
}


/** Generate a merged contact from a list of proposed duplicate contacts.
 *	@param {Array} contacts			The contacts to merge.
 *	@param {Object} [toMerge={}]	A mapping of contacts to merge. Keys are contact ID's, values are `false` to omit from merge.
 */
export function mergeDuplicateContacts(contacts, toMerge={}) {
	let merged = {
		attributes: {}
	};

	for (let i=0; i<contacts.length; i++) {
		if (toMerge[getId(contacts[i])]===false) continue;

		// for (let prop in contacts[i]) if (contacts[i].hasOwnProperty(prop)) {
		// 	if (!merged[prop]) merged[prop] = contacts[i][prop];
		// }

		if (!merged.id) {
			merged.id = 'duplicate-' + contacts[i].id;
		}

		let attrs = contacts[i].attributes;
		outer: for (let prop in attrs) if (attrs.hasOwnProperty(prop)) {
			let name = prop,
				value = attrs[prop],
				index = 0;
			while (merged.attributes[name]!=null) {
				if (fieldMatches(merged.attributes[name], value)) {
					continue outer;
				}
				name = `${prop}${++index}`;
			}
			merged.attributes[name] = value;
		}
	}

	return merged;
}
