import { h, Component } from 'preact';
import { memoize } from 'decko';
import { Button, Select, Option } from '@zimbra/blocks';
import ContactCard from '../contact-card';
import wire from 'wiretie';
import cx from 'classnames';
import format from 'date-fns/format';
import { getId, filterDuplicates, deepClone, isValidEmail, replaceAttributes } from '../../../lib/util';
import style from '../style';

import { ContactEditSection } from './edit-section';

import {
	EMAIL,
	IM,
	HOME,
	WORK,
	NICKNAME,
	ADDRESS,
	ADD_MORE_FIELD_PLACEHOLDER,

	NEW_CONTACT_FIELDS,
	ADDRESS_FIELDS,
	ADD_MORE_FIELDS_DROPDOWN,
	DROPDOWN_LABEL_FIELDS,

	WORK_DETAILS_FIELDS,
	PERSONAL_DETAILS_FIELDS
} from './fields';

import {
	getAddressFieldPrefixAndSuffix,
	processContactAttrs,
	sorter,
	I18nText,
	generateFieldInfo,
	removeAttrSuffix,
	segregateAttributesIntoGroups,
	mergeContactAttributes,
	hasMinimumRequiredFields
} from './helper';

const INVALID_EMAIL_MESSAGE_KEY = 'invalidEmail';
const MINIMUM_FIELDS_REQUIRED_MESSAGE_KEY = 'minimumFieldsRequired';

/* eslint-disable react/display-name */
const input = type => props => <input type={type} {...props} />;

export const FIELD_MAPS = {
	email: input('email'),
	phone: input('tel'),
	mobile: input('tel'),
	homePhone: input('tel'),
	workPhone: input('tel'),
	fax: input('tel'),
	pager: input('tel'),
	birthday: 'date',
	anniversary: 'date',
	url: input('url'),
	Street: props => <textarea {...props} />,
	notes: props => <textarea {...props} />
};
/* eslint-enable react/display-name */


function getContactDetailsField(fields) {
	return fields.filter(field =>
		field !== ADD_MORE_FIELD_PLACEHOLDER &&
		WORK_DETAILS_FIELDS.indexOf(removeAttrSuffix(field)) === -1 &&
		PERSONAL_DETAILS_FIELDS.indexOf(removeAttrSuffix(field)) === -1
	);
}

function getWorkDetailsField(fields) {
	return fields.filter(field => WORK_DETAILS_FIELDS.indexOf(removeAttrSuffix(field)) > -1);
}

function getPersonalDetailsFields(fields) {
	return fields.filter(field => PERSONAL_DETAILS_FIELDS.indexOf(removeAttrSuffix(field)) > -1);
}


function updateAddMoreDropdownLabels([...addMoreDropdownFields], contactAttrs) {
	if (contactAttrs) {
		if (contactAttrs.im) {
			addMoreDropdownFields.splice(addMoreDropdownFields.indexOf(IM), 1);
		}
		if (contactAttrs.nickname) {
			addMoreDropdownFields.splice(addMoreDropdownFields.indexOf(NICKNAME), 1);
		}
		if (contactAttrs.homeStreet || contactAttrs.homeCity || contactAttrs.homeState || contactAttrs.homePostalCode || contactAttrs.homeCountry ||
			contactAttrs.workStreet || contactAttrs.workCity || contactAttrs.workState || contactAttrs.workPostalCode || contactAttrs.workCountry) {
			addMoreDropdownFields.splice(addMoreDropdownFields.indexOf(ADDRESS), 1);
		}
	}
	return addMoreDropdownFields;
}

function createFreshState(contact, skipMissing) {
	if (!contact) {
		contact = {};
	}
	contact.attributes = contact.attributes || contact._attrs || {};
	let addMoreDropdownFields = updateAddMoreDropdownLabels(ADD_MORE_FIELDS_DROPDOWN, contact.attributes);
	let updatedContact = processContactAttrs(contact);
	let attributesList = createAttributesList(updatedContact, skipMissing);
	return {
		contact: updatedContact,
		addMoreDropdownFields,
		attributesList,
		errors: null
	};

}

function createAttributesList (contact, skipMissing) {
	let attrs = contact.attributes;
	let mergedAttrsList = mergeContactAttributes([...NEW_CONTACT_FIELDS], Object.keys(attrs))
		.filter( key => !skipMissing || attrs[key] );

	return mergedAttrsList;
}

// eslint-disable-next-line eqeqeq
const getFolder = (folders, ident) => folders.filter( f => f.absFolderPath==ident || f.name==ident || f.id==ident )[0];

@wire('zimbra', ({ allowMove }) => ({
	folders: allowMove!==false && ['folders.list', {
		view: 'contact',
		root: false
	}]
}), zimbra => ({
	createContact: zimbra.contacts.create,
	updateContact: zimbra.contacts.update
}))
export default class ContactEditor extends Component {
	state = createFreshState(this.props.contact, this.props.skipMissing);

	getValue() {
		return this.state.contact;
	}

	createContactFieldUpdater = memoize( (field, isDate) => ( e => {
		let value;
		//handle case where value is the return object, like DateInput
		if (isDate) {
			value = format(e, 'YYYY-MM-DD');
		}
		//handle <input/> onInput events for different input types
		else {
			value = e.target.type==='checkbox' || e.target.type==='radio' ? e.target.checked : e.target.value;
		}
		let { contact } = this.state;
		contact = {
			...contact,
			attributes: {
				...contact.attributes
			}
		};
		let parts = field.split('.'),
			obj = contact;
		for (let i=0; i<parts.length-1; i++) {
			obj = obj[parts[i]] || (obj[parts[i]] = {});
		}
		obj[parts[parts.length-1]] = value;
		this.setState({ contact });
		if (this.props.onChange) {
			this.props.onChange({ contact });
		}
	}));

	// update the fields suffixes to make them sequential
	// e.g if fields are email, email4 and email5 then change them to email, email2 and email3
	normalizeContactArrtibutes(contact) {
		let attributesList = [...this.state.attributesList];
		contact = deepClone(contact);

		let groups = segregateAttributesIntoGroups(attributesList, true);

		let allFieldsRenameMap = {};
		Object.keys(groups).forEach(
			group => {
				let currentGroupRenameMap = this.createFieldRenameMap(group, groups[group]);
				if (group === IM) {
					Object.keys(currentGroupRenameMap).map((label) => {
						let currentAttrValue = contact.attributes[label];
						delete contact.attributes[label];
						contact.attributes[currentGroupRenameMap[label]] = removeAttrSuffix(label) + '://' + currentAttrValue;
					});
				}
				else if (group.indexOf(HOME) > -1 || group.indexOf(WORK) > -1) { // homeAddress or workAddress
					Object.keys(currentGroupRenameMap).map((label) => {
						let newLabel = currentGroupRenameMap[label];
						let { prefix: originalFieldPrefix, suffix: originalFieldSuffix } = getAddressFieldPrefixAndSuffix(label);
						let { prefix: fieldPrefix } = getAddressFieldPrefixAndSuffix(newLabel);
						let suffix = this.createFieldSuffix(newLabel);
						ADDRESS_FIELDS.map( field => {
							replaceAttributes(contact.attributes, originalFieldPrefix + field + originalFieldSuffix, fieldPrefix + field + suffix);
						});
						// Update attribute list
						let index = attributesList.indexOf(label);
						if (index) {
							attributesList[index] = newLabel;
						}
					});
				}
				else {
					allFieldsRenameMap = {
						...allFieldsRenameMap,
						...currentGroupRenameMap
					};
				}
			}
		);

		Object.keys(allFieldsRenameMap).map((label) => {
			replaceAttributes(contact.attributes, label, allFieldsRenameMap[label]);

			let index = attributesList.indexOf(label);
			if (index && allFieldsRenameMap[label]) {
				attributesList[index] = allFieldsRenameMap[label];
			}
		});

		this.setState({ attributesList, contact });

		return contact;
	}

	// create field rename map required to make fields sequential
	// e.g email, email3, email7 -> email, email2, email3
	createFieldRenameMap(attr, fields) {
		let renameAttributesMap = {};
		fields.sort(sorter).map((originalAttr, index) => {
			let indexedFieldKey = `${attr}${ index === 0 ? '' : index + 1}`;

			if (originalAttr !== indexedFieldKey) {
				renameAttributesMap[originalAttr] = indexedFieldKey;
			}
		});
		return renameAttributesMap;
	}

	save = () => {
		Object.keys(this.state.contact.attributes).forEach(k => {
			let v = this.state.contact.attributes[k];
			if (v && v.trim) this.state.contact.attributes[k] = v.trim();
		});
		if (!this.isContactValid(this.state.contact)) return;

		this.normalizeContactArrtibutes(this.state.contact);

		let { isNew, contact, createContact, updateContact, customSave, onBeforeSave, onSave } = this.props;
		let updatedContact = this.state.contact;

		isNew = isNew || !updatedContact.id;

		if (onBeforeSave) {
			onBeforeSave({ isNew, contact: updatedContact });
		}

		if (customSave) {
			return customSave({ isNew, contact: updatedContact });
		}

		if (isNew) {
			return createContact(updatedContact).then(onSave, this.showError);
		}

		let allKeys = filterDuplicates(Object.keys(contact.attributes).concat(Object.keys(updatedContact.attributes)));

		let changes = allKeys.reduce( (result, key) => {
			if (updatedContact.attributes[key]!==contact.attributes[key]) {
				result.push({
					n: key,
					_content: updatedContact.attributes[key]
				});
			}
			return result;
		}, []);

		updateContact(getId(contact), changes).then(onSave, this.showError);
	};

	isContactValid = (contact) => {
		let errors = {
			fields: [],
			messages: []
		};
		let attrs = contact.attributes;

		if (!hasMinimumRequiredFields(attrs)) {
			errors.messages.push(MINIMUM_FIELDS_REQUIRED_MESSAGE_KEY);
		}
		else {
			Object.keys(attrs).map( attribute => {
				let fieldInfo = generateFieldInfo(attribute);
				if (fieldInfo.group === EMAIL && attrs[attribute] && !isValidEmail(attrs[attribute])) {
					if (errors.messages.indexOf(INVALID_EMAIL_MESSAGE_KEY) === -1) {
						errors.messages.push(INVALID_EMAIL_MESSAGE_KEY);
					}
					errors.fields.push(attribute);
				}
			});
		}
		if (!errors.messages.length) {
			errors = null;
		}
		this.setState({ errors });
		return !errors;
	}

	showError = error => {
		this.setState({
			messages: [error]
		});
	};

	updateLabel = ({ originalLabel, newLabel, group }) => {
		let attributesList = [...this.state.attributesList];
		let { contact } = this.state;
		contact = deepClone(contact);
		let newLabelWithSuffix = newLabel + this.createFieldSuffix(newLabel);

		if (group === ADDRESS) {
			let { prefix: originalFieldPrefix, suffix: originalFieldSuffix } = getAddressFieldPrefixAndSuffix(originalLabel);
			let { prefix: fieldPrefix } = getAddressFieldPrefixAndSuffix(newLabel);
			let suffix = this.createFieldSuffix(newLabel);
			ADDRESS_FIELDS.map( field => {
				let originalFieldKey = originalFieldPrefix + field + originalFieldSuffix;
				replaceAttributes(contact.attributes, originalFieldKey, fieldPrefix + field + suffix);
			});
		}
		else {
			replaceAttributes(contact.attributes, originalLabel, newLabelWithSuffix);
		}

		attributesList.splice(attributesList.indexOf(originalLabel), 1, newLabelWithSuffix);
		this.setState( { attributesList, contact });
		if (this.props.onChange) {
			this.props.onChange({ contact });
		}
	}

	addFieldFromAddMoreDropdown = field => {
		let addMoreDropdownFields = [...this.state.addMoreDropdownFields];
		let { attributesList } = this.state;

		this.addField({
			addAfterField: attributesList[attributesList.indexOf(ADD_MORE_FIELD_PLACEHOLDER)-1],
			newFieldAttribute: DROPDOWN_LABEL_FIELDS[field.value] &&
								DROPDOWN_LABEL_FIELDS[field.value][0] || // Dropdown fields: use first value from dropdown list
								field.value, // Non dropdown fields: use base type -> birthday etc
			group: field.value
		});

		addMoreDropdownFields.splice(addMoreDropdownFields.indexOf(field.value), 1);
		this.setState( { addMoreDropdownFields });
	}

	addField = ({ addAfterField, newFieldAttribute, group }) => {
		let attributesList = [...this.state.attributesList];
		let { contact } = this.state;
		contact = deepClone(contact);
		let newKeyWithSuffix = newFieldAttribute + this.createFieldSuffix(newFieldAttribute);

		if (group === ADDRESS) { //Handle address fields
			let suffix = this.createFieldSuffix(newFieldAttribute);
			ADDRESS_FIELDS.map( field =>
				contact.attributes['home' + field + suffix] = ''
			);
		}
		else {
			contact.attributes[newKeyWithSuffix] = '';
		}

		attributesList.splice(attributesList.indexOf(addAfterField) + 1, 0, newKeyWithSuffix);
		this.setState( { attributesList, contact });
		if (this.props.onChange) {
			this.props.onChange({ contact });
		}
	}

	createFieldSuffix = field => {
		let { attributesList } = this.state;

		let index = 0;
		do {
			let fieldLabelWithSuffix = field + (index === 0 ? '' : index + 1);
			if (attributesList.indexOf(fieldLabelWithSuffix) === -1) {
				break;
			}
		} while (++index);

		return index ? index + 1 : '';
	}

	removeField = ({ attribute, group }) => {
		let attributesList = [...this.state.attributesList];
		let { contact } = this.state;
		contact = deepClone(contact);

		attributesList.splice(attributesList.indexOf(attribute), 1);
		if (group === ADDRESS) {
			let { prefix, suffix } = getAddressFieldPrefixAndSuffix(attribute);
			ADDRESS_FIELDS.map( field =>
				delete contact.attributes[prefix + field + suffix]
			);
		}
		else {
			delete contact.attributes[attribute];
		}
		this.setState( { attributesList, contact });
		if (this.props.onChange) {
			this.props.onChange({ contact });
		}
	}

	onCountrySelect = ({ selectedCountry, field }) => {
		let { contact } = this.state;
		contact = deepClone(contact);
		contact.attributes[field] = selectedCountry;
		this.setState( { contact });
		if (this.props.onChange) {
			this.props.onChange({ contact });
		}
	}

	showRemoveButtonForGroup = group => {
		let { attributesList } = this.state;
		let groupLabels = DROPDOWN_LABEL_FIELDS[group] || [group]; //single label field like  birthday or anniversary

		let numOfFieldsOfType = attributesList.filter(
			fieldName =>
				groupLabels.indexOf(removeAttrSuffix(fieldName)) > -1 //convert email2 to email
		).length;
		return numOfFieldsOfType > 1;
	}

	componentWillReceiveProps({ contact, readonly }) {
		if (readonly===true) {
			this.setState(createFreshState(contact, this.props.skipMissing));
		}
		else if (readonly!==this.props.readonly || contact!==this.props.contact) {
			this.setState(createFreshState(contact, this.props.skipMissing));
		}
	}

	render({ folder, folders, showCard, showHeader, showFooter, showTitle, skipMissing, allowMove, readonly, onCancel, isNew, footerClass, disabled, ...props }, { contact, attributesList, errors, addMoreDropdownFields }) {
		let pfx = `contact-${getId(contact) || 'x'}-`;

		if (folders && !contact.folderId) {
			let parentFolder = getFolder(folders, folder) || getFolder(folders, 'Contacts');
			if (parentFolder) contact.folderId = parentFolder.id;
		}

		let detailFields = getContactDetailsField(attributesList);
		let workFields = getWorkDetailsField(attributesList);
		let personalFields = getPersonalDetailsFields(attributesList);

		return (
			<div class={cx(style.contactEditor, showHeader!==false && style.hasHeader, showFooter!==false && style.hasFooter, props.class)}>
				{ showHeader && (
					<div class={style.header}>
						<h2>{isNew?'Add':'Edit'} Contact</h2>
					</div>
				) }

				<div class={cx(style.inner, style.contactEditFormWrapper)}>

					{ errors && errors.messages && (
						<div key="error" class={style.error}>
							{ errors.messages.map(error => (
								<span><I18nText attribute={error} dictionary="errors" /></span>
							)) }
						</div>
					) }

					{ showCard!==false && <ContactCard contact={contact} /> }

					<form action="javascript:" onSubmit={this.save} novalidate disabled={disabled}>
						<ContactEditSection
							errorFields={errors && errors.fields}
							contact={contact}
							pfx={pfx}
							title={showTitle!==false && 'Contact Details'}
							fields={detailFields}
							readonly={readonly}
							onAddField={this.addField}
							showRemoveButtonForGroup={this.showRemoveButtonForGroup}
							onCountrySelect={this.onCountrySelect}
							onRemoveField={this.removeField}
							onFieldLabelChange={this.updateLabel}
							createContactFieldUpdater={this.createContactFieldUpdater}
						>
							{ addMoreDropdownFields.length > 0 && (
								<label class={style.dropdownLabel}>
									<Select
										iconPosition="right"
										anchor="left"
										displayValue="Add More"
										value="none"
										onChange={this.addFieldFromAddMoreDropdown}
									>
										{ addMoreDropdownFields.map(label => (
											<Option iconPosition="right" title={<I18nText attribute={label} />} value={label} />
										)) }
									</Select>
								</label>
							) }
						</ContactEditSection>

						<ContactEditSection
							errorFields={errors && errors.fields}
							contact={contact}
							pfx={pfx}
							title="Work Details"
							fields={workFields}
							readonly={readonly}
							onAddField={this.addField}
							onRemoveField={this.removeField}
							onFieldLabelChange={this.updateLabel}
							createContactFieldUpdater={this.createContactFieldUpdater}
						/>

						<ContactEditSection
							errorFields={errors && errors.fields}
							contact={contact}
							pfx={pfx}
							title="Personal Details"
							fields={personalFields}
							readonly={readonly}
							onAddField={this.addField}
							onRemoveField={this.removeField}
							showRemoveButtonForGroup={this.showRemoveButtonForGroup}
							onFieldLabelChange={this.updateLabel}
							createContactFieldUpdater={this.createContactFieldUpdater}
						/>
					</form>
				</div>

				{ showFooter!==false && (
					<div class={cx(style.footer, footerClass)}>
						<Button styleType="primary" onClick={this.save} disabled={disabled}>Save</Button>
						<Button styleType="floating" onClick={onCancel} disabled={disabled}>Cancel</Button>
					</div>
				) }
			</div>
		);
	}
}
