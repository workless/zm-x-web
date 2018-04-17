import { h, Component } from 'preact';
import { withText, Text, Localizer } from 'preact-i18n';
import wire from 'wiretie';
import cx from 'classnames';
import get from 'lodash-es/get';
import debounce from 'lodash-es/debounce';
import memoize from 'lodash-es/memoize';
import { KeyCodes, Icon } from '@zimbra/blocks';
import { getEmail } from '../../utils/contacts';
import { getPrimaryAccountName } from '../../utils/account';
import ZimletSlot from '../zimlet-slot';

import ContactSuggestion from '../contact-suggestion';
import ContactTag from './contact-tag';

import accountInfo from '../../graphql-decorators/account-info';

import s from './style.less';

const byRank = (a, b) => b.ranking - a.ranking;
const hasEmail = c => c.email;

@accountInfo()
@withText({
	placeholderWithContact: 'search.placeholderWithContact',
	emailPlaceholderType: 'search.placeholderTypes.mail',
	calendarPlaceholderType: 'search.placeholderTypes.calendar',
	contactsPlaceholderType: 'search.placeholderTypes.contacts'
})
@wire('zimbra', null, zimbra => ({
	getSuggestions: memoize(
		value =>
			value && value.length > 0
				? zimbra.jsonRequest('AutoCompleteRequest', { name: value })
				: Promise.resolve(null)
	)
}))
export default class SearchInput extends Component {
	static defaultProps = {
		onFocus: () => {},
		onBlur: () => {}
	};

	state = {
		value: '',
		prevValue: '',
		focused: false,
		hideSuggestions: false,
		contactSuggestions: null,
		selectedContact: null,
		keyboardSelectionIndex: null,
		contactFocused: false
	};

	setFocus = val => {
		this.setState({
			focused: val,
			keyboardSelectionIndex: val ? this.state.keyboardSelectionIndex : null
		});
		val ? this.props.onFocus() : this.props.onBlur();
	};

	submit = (query, contact, email) => {
		this.props.onSubmit(query, contact ? getEmail(contact) : email);
		this.setState({ selectedContact: contact });
	};

	keyboardSelectedContact = () => {
		const { contactSuggestions, keyboardSelectionIndex } = this.state;
		if (contactSuggestions && keyboardSelectionIndex !== null) {
			return contactSuggestions[keyboardSelectionIndex];
		}

		return null;
	};

	updateSuggestions = value => {
		if (this.props.disableContactSuggestions) {
			return;
		}

		this.props.getSuggestions(value).then(results => {
			this.setState({
				contactSuggestions: get(results, 'match', []).filter(m => !m.isGroup)
			});
		});
	};

	handleKeyDown = e => {
		switch (e.keyCode) {
			case KeyCodes.DOWN_ARROW:
				return this.handleInputDown(e);
			case KeyCodes.UP_ARROW:
				return this.handleInputUp(e);
			case KeyCodes.ESCAPE:
				return this.handleInputEsc(e);
			default:
				return;
		}
	};

	handleKeyUp = e => {
		switch (e.keyCode) {
			case KeyCodes.BACKSPACE:
				return this.handleKeyUpBackspace(e);
			default:
				return this.setState({ prevValue: e.target.value });
		}
	};

	handleInput = ({ target: { value } }) => {
		if (value !== this.state.value) {
			this.setState({
				value,
				focused: true,
				keyboardSelectionIndex: null,
				contactFocused: false
			});
			if (!this.props.disableContactSuggestions) {
				this.debouncedUpdateSuggestions(value);
			}
		}
	};

	handleInputDown = e => {
		e.preventDefault();
		if (this.state.contactSuggestions) {
			const i = this.state.keyboardSelectionIndex;
			this.setState({
				keyboardSelectionIndex: Math.min(
					i !== null ? i + 1 : 0,
					this.state.contactSuggestions.length - 1
				)
			});
		}
	};

	handleInputUp = e => {
		e.preventDefault();
		if (this.state.contactSuggestions) {
			const i = this.state.keyboardSelectionIndex;
			this.setState({
				keyboardSelectionIndex: Math.max(i !== null ? i - 1 : 0, 0)
			});
		}
	};

	handleKeyUpBackspace = e => {
		if (this.state.contactFocused && this.props.email) {
			this.submit('', null);
		}
		else if (this.state.prevValue === '' && this.props.email) {
			this.setState({ contactFocused: true });
		}
		else {
			this.setState({ prevValue: e.target.value });
		}
	};

	handleInputEsc = () => {
		this.setState({
			focused: !this.state.focused,
			keyboardSelectionIndex: null
		});
	};

	debouncedUpdateSuggestions = debounce(this.updateSuggestions, 100);

	handleSubmit = e => {
		e.preventDefault();
		const contact = this.keyboardSelectedContact();
		const contactEmail = contact ? getEmail(contact) : null;
		const prevEmail = this.props.email;
		const value =
			contactEmail && contactEmail !== get(prevEmail, 'id')
				? ''
				: this.state.value;

		this.submit(value, contact, prevEmail);
		this.setFocus(false);
	};

	handleFocus = () => {
		this.setFocus(true);
	};

	handleBlur = () => {
		this.setFocus(false);
	};

	handleContactClick = contact => {
		this.submit('', contact);
	};

	handleRemoveContact = () => {
		this.submit(this.state.value, null);
		this.input.focus();
	};

	handleClickClearButton = () => {
		this.setState({ value: '' });
		this.submit('', null);
		this.input.focus();
	};

	componentWillMount() {
		const { value } = this.props;
		this.setState({ value });
		this.updateSuggestions(value);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.value !== this.state.value) {
			this.setState({ value: nextProps.value });
			this.updateSuggestions(nextProps.value);
		}

		if (!nextProps.email) {
			this.setState({ selectedContact: null });
		}
	}

	render(
		{ account, disableContactSuggestions, email, contact, fetchingContact, pathType },
		{
			value,
			focused,
			contactFocused,
			selectedContact,
			contactSuggestions,
			keyboardSelectionIndex
		}
	) {
		const name = getPrimaryAccountName(account);

		const fieldType =
			pathType === null || pathType === 'message' || pathType === 'conversation'
				? this.props.emailPlaceholderType
				: this.props[`${pathType}PlaceholderType`];

		return (
			<div class={s.container}>
				<form class={s.form} onSubmit={this.handleSubmit}>
					{email && (
						<ContactTag
							contact={contact || selectedContact}
							fetchingContact={fetchingContact}
							email={email}
							focused={contactFocused}
							onRemove={this.handleRemoveContact}
						/>
					)}
					<ZimletSlot name="searchInputPlaceholder" pathType={pathType} >
						{ zimletResponses => {
							let zimletText = zimletResponses && zimletResponses.filter(Boolean)[0];
							return (<Localizer>
								<input
									type="text"
									ref={ref => (this.input = ref)}
									placeholder={<Text id="search.placeholder" fields={{ name, type: zimletText || fieldType }} />}
									class={s.input}
									value={value}
									onKeyDown={this.handleKeyDown}
									onKeyUp={this.handleKeyUp}
									onInput={this.handleInput}
									onFocus={this.handleFocus}
									onBlur={this.handleBlur}
								/>
							</Localizer>);
						}}
					</ZimletSlot>
					{value && (
						<Localizer>
							<button
								aria-label={<Text id="buttons.clear" />}
								onClick={this.handleClickClearButton}
								type="button"
								class={s.clearBtn}
							>
								<Icon name="close" />
							</button>
						</Localizer>
					)}
					<button
						className={s.searchButton}
						type="submit"
						onClick={this.handleSubmit}
					>
						<Icon name="search" />
					</button>
				</form>

				{!disableContactSuggestions &&
					focused &&
					contactSuggestions &&
					contactSuggestions.length > 0 && (
					<div class={s.suggestions}>
						{contactSuggestions
							.filter(hasEmail)
							.sort(byRank)
							.map((c, i) => (
								<ContactSuggestion
									class={cx(
										s.contactSuggestion,
										keyboardSelectionIndex === i &&
												s.contactSuggestionSelected
									)}
									nameClass={s.contactSuggestionName}
									contact={c}
									input={value || ''}
									onClick={this.handleContactClick}
								/>
							))}
					</div>
				)}
			</div>
		);
	}
}
