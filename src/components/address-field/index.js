import { h, Component } from 'preact';
import { Button } from '@zimbra/blocks';
import cx from 'classnames';
import { parseAddress, isValidEmail, getEmail } from '../../lib/util';
import { getName } from '../../utils/contacts';
import Suggestions from './suggestions';
import TokenInput from '../token-input';
import ContactPicker from '../contact-picker';
import ContactHoverCard from '../contact-hover-card';
import style from './style';

const RIGHT_MOUSE_BUTTON = 2;

function displayAddress(value) {
	let name = getName(value) || value.name;
	if (!name) {
		let parsed = parseAddress(value.address || value.email || '');
		name = parsed.name || parsed.address.split('@')[0];
	}
	return name;
}

function addressFromContact(contact) {
	let attrs = contact.attributes || contact._attrs || contact,
		parsed = parseAddress(attrs.email);
	return {
		address: parsed.address,
		name: getName(attrs) || attrs.full || parsed.name,
		shortName: attrs.firstName || attrs.first || parsed.name,
		originalEmail: attrs.email
	};
}

function createAddress(address) {
	if (typeof address === 'object' && address.email) {
		return addressFromContact(address);
	}

	return parseAddress(address);
}

function validateToken(address, token) {
	return isValidEmail(getEmail(token.address));
}

export default class AddressField extends Component {
	openPicker = () => {
		this.setState({ openPicker: true });
	};

	closePicker = () => {
		this.setState({ openPicker: false });
	};

	setContacts = contacts => {
		this.props.onChange({
			value: contacts.map(addressFromContact)
		});
	};

	filterDuplicateAddresses(arr) {
		let hasDupes = false,
			found = [],
			out = [];
		for (let i = 0; i < arr.length; i++) {
			let addr = arr[i];
			if (found.indexOf(addr.address) === -1) {
				found.push(addr.address);
				out.push(addr);
			}
			else {
				hasDupes = true;
			}
		}
		return hasDupes ? out : arr;
	}

	render({
		name,
		label,
		value,
		formSize,
		wasPreviouslySelected,
		previouslySelectedLabel,
		class: c,
		tokenInputClass,
		...props
	}, {
		openPicker
	}) {
		return (
			<div class={cx(style.addressField, c)}>
				{label && (
					<Button
						styleType="text"
						class={style.label}
						onClick={this.openPicker}
					>
						{label}
					</Button>
				)}

				<TokenInput
					value={this.filterDuplicateAddresses(value)}
					class={cx(style.input, formSize && style.formSize, tokenInputClass)}
					{...props}
					createValue={createAddress}
					renderValue={displayAddress}
					renderToken={renderToken}
					renderAutoSuggest={Suggestions}
					wasPreviouslySelected={wasPreviouslySelected}
					validateToken={validateToken}
					previouslySelectedLabel={previouslySelectedLabel}
				/>

				{openPicker && (
					<ContactPicker
						field={name || (label && label.replace(':', ''))}
						contacts={value}
						onSave={this.setContacts}
						onClose={this.closePicker}
					/>
				)}
			</div>
		);
	}
}

const renderToken = ({ token, ...props }) => (
	<ContactInputToken contact={token} {...props} />
);

class ContactInputToken extends Component {
	state = {
		details: false,
		hover: false
	};

	setter = (key, val) => () => {
		if (this.state[key] !== val) {
			this.setState({ [key]: val });
		}
	};

	openDetails = this.setter('details', true);
	closeDetails = () => {
		this.setState({ details: false });
		if (this.props.activated) {
			this.props.select(false);
		}
	};

	handleMouseOver = this.setter('hover', true);
	handleMouseOut = this.setter('hover', false);

	handleMouseDown = e => {
		if (e.button === RIGHT_MOUSE_BUTTON) {
			setTimeout(this.openDetails, 0);
			return this.prevent(e);
		}
	};

	prevent = e => {
		e.preventDefault();
		e.stopPropagation();
		return false;
	};

	render(
		{ contact, selected, select, activated, invalid },
		{ hover, details }
	) {
		let name = contact.name || contact.shortName || displayAddress(contact),
			active = hover || details || activated;
		return (
			<span
				class={cx(
					style.token,
					selected && style.selected,
					active && style.active,
					invalid && style.invalid
				)}
				onMouseOver={this.handleMouseOver}
				onMouseOut={this.handleMouseOut}
			>
				<button
					class={style.tokenLabel}
					onClick={select}
					onMouseDown={this.handleMouseDown}
					onContextMenu={this.prevent}
				>
					{name}
				</button>

				{!invalid &&
					<ContactHoverCard
						address={contact.address || contact.email}
						name={name}
						visible={active}
						onDismiss={this.closeDetails}
					/>
				}
			</span>
		);
	}
}
