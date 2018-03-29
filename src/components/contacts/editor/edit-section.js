import { h } from 'preact';
import cx from 'classnames';
import style from '../style';

import {
	I18nText,
	generateFieldInfo
} from './helper';

import {
	FIELD_MAPS
} from '.';

import DropdownLabel from './dropdown-label';
import AddressGroup from './address-group';
import AddRemoveButtons from './add-remove-buttons';
import DateInput from '../../date-input';

export function ContactEditSection({
	errorFields,
	children,
	contact,
	title,
	fields,
	pfx,
	readonly,
	createContactFieldUpdater,
	onAddField,
	onFieldLabelChange,
	onRemoveField,
	onCountrySelect,
	showRemoveButtonForGroup
}) {
	return (
		<fieldset>
			<legend>{title}</legend>
			{
				fields
					.map( (attr) => {
						let field = generateFieldInfo(attr);
						return (
							<div>
								{	field.hasDropdownLabels && !readonly?
									<DropdownLabel
										{...field}
										onFieldLabelChange={onFieldLabelChange}
									/> :
									<label for={pfx + attr}>
										<I18nText attribute={attr} />
									</label>
								}
								<div class={cx(style.inputWrap, field.isAddressField? style.inputDropdown: '')}>
									{
										field.isAddressField ?
											<AddressGroup
												readonly={readonly}
												pfx={pfx}
												attribute={attr}
												onCountrySelect={onCountrySelect}
												contact={contact}
												createContactFieldUpdater={createContactFieldUpdater}
											/>
											:
											readonly ? (
												<span class={style.readonlyValue}>{contact.attributes[attr]}</span>
											) :
												FIELD_MAPS[field.nonSuffixedAttribute] === 'date' ?
													<DateInput
														id={pfx + attr}
														name={attr}
														class={cx(style.dateInput, errorFields && errorFields.includes(attr) ? (style.errorField) : '')}
														dateValue={contact.attributes[attr]}
														onDateChange={createContactFieldUpdater(`attributes.${attr}`, true)}
													/>
													:
													h(FIELD_MAPS[field.nonSuffixedAttribute] || 'input', {
														id: pfx + attr,
														name: attr,
														class: errorFields && errorFields.includes(attr) ? (style.errorField) : '',
														value: contact.attributes[attr] || '',
														onInput: createContactFieldUpdater(`attributes.${attr}`),
														autocomplete: 'off'
													}) }
								</div>
								{
									!readonly &&
								field.showAddRemoveButtons &&
								<AddRemoveButtons
									showRemoveButton={
										showRemoveButtonForGroup(
											field.group ||
											field.nonSuffixedAttribute
										)
									}
									attribute={attr}
									defaultAttributeForNewField={
										field.dropdownLabels ?
											field.dropdownLabels[0] :
											field.nonSuffixedAttribute
									}
									group={field.group}
									onAddField={onAddField}
									onRemoveField={onRemoveField}
								/>
								}
							</div>
						);
					})
			}
			{children}
		</fieldset>
	);
}
