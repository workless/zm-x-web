import { h, Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import replace from 'react-string-replace';
import { displayAddress } from '../../utils/contacts';
import { getEmail } from '../../lib/util';

import Avatar from '../avatar';
import CloseButton from '../close-button';

import style from './style.less';

export default class ContactSuggestion extends Component {
	click = e => {
		e.stopPropagation();
		e.preventDefault();
		let { contact, onClick } = this.props;
		if (onClick) onClick(contact);
		return false;
	};

	select = () => {
		let { contact, onSelect } = this.props;
		if (onSelect) onSelect(contact);
	};

	handleRemove = (e) => {
		e.stopPropagation();
		e.preventDefault();
		let { token, onRemove } = this.props;
		if (onRemove) onRemove(token);
	};

	render({
		contact,
		selected,
		previouslySelected,
		previouslySelectedLabel,
		active,
		input,
		onRemove,
		...rest
	}) {
		let email = getEmail(contact.email);
		return (
			<div
				class={cx(
					style.suggestion,
					active && style.active,
					(selected || previouslySelected) && style.selected,
					rest.class
				)}
				onMouseDown={this.click}
				onMouseOver={this.select}
			>
				<Avatar class={style.avatar} email={email} contact={contact} />
				<span class={cx(style.name, rest.nameClass)}>
					{replace(displayAddress(contact), pattern(input), patternMatch)}
				</span>
				<span class={style.email}>{getEmail(contact.email)}</span>
				{selected && onRemove ? (
					<div class={style.closeContainer}>
						<CloseButton
							class={style.close}
							aria-label="Remove"
							onMouseDown={this.handleRemove}
						/>
					</div>
				) : previouslySelected && previouslySelectedLabel ? (
					<div class={cx(style.closeContainer, style.previouslySelectedLabel)}>
						<Text id={previouslySelectedLabel} />
					</div>
				) : (
					<div class={style.closePlaceholder} />
				)}
			</div>
		);
	}
}

const patternMatch = match => <strong>{match}</strong>;

// basically just a case-insensitive string search
const pattern = str =>
	new RegExp('(' + str.replace(/([^a-zA-Z0-9 #@&"'/])/g, '\\$1') + ')', 'i');
