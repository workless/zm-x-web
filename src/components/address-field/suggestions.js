import { h } from 'preact';
import PureComponent from '../../lib/pure-component';
import wire from 'wiretie';
import find from 'lodash/find';

import ContactSuggestion from '../contact-suggestion';

import style from './style';


const byRank = (a, b) => b.ranking - a.ranking;

const AUTOCOMPLETE_CACHE = {};

@wire('zimbra', null, zimbra => ({
	getSuggestions(value) {
		if (value && value.length>2) {
			return AUTOCOMPLETE_CACHE[value] || (AUTOCOMPLETE_CACHE[value] = zimbra.jsonRequest('AutoCompleteRequest', { name: value }));
		}
		return Promise.resolve(null);
	}
}))
export default class Suggestions extends PureComponent {
	static defaultProps = {
		filter() {}
	};

	counter = 0;

	selectAddress = contact => {
		let index = this.state.suggestions.indexOf(contact);
		this.props.onSelectionChange({ index, value: contact });
	};

	chooseAddress = contact => {
		if (!this.props.wasPreviouslySelected || !this.props.wasPreviouslySelected(contact)) {
			this.setState({ suggestions: null });
			this.props.onSelect(contact);
		}
	};

	update(value) {
		let id = ++this.counter;
		this.props.getSuggestions(value).then( suggestions => {
			// eslint-disable-next-line eqeqeq
			if (this.counter===id && suggestions!=this.state.suggestions) {
				this.setState({ suggestions });
			}
		});
	}

	getSelectedIndex() {
		let { selectedIndex } = this.props;
		if (selectedIndex!=null) selectedIndex = Math.max(0, Math.min(this.state.suggestions.length - 1, selectedIndex));
		return selectedIndex;
	}

	componentDidMount() {
		if (this.props.value) {
			this.update(this.props.value);
		}
	}

	componentWillReceiveProps({ value, selectedIndex, commitSelectedIndex, onSelectionChange }) {
		if (value!==this.props.value) {
			this.update(value);
		}
		let count = this.state.suggestions ? this.state.suggestions.length : 0;
		if (selectedIndex && selectedIndex>=count) {
			onSelectionChange(count-1);
		}
		if (count && commitSelectedIndex!=null) {
			this.chooseAddress(this.state.suggestions[commitSelectedIndex]);
		}
	}

	renderContact = (contact, index) => {
		const token = find(this.props.tokens, t => t.originalEmail === contact.email);

		return (
			<ContactSuggestion
				input={this.props.value}
				token={token}
				active={this.getSelectedIndex()===index}
				selected={this.props.tokens && Boolean(token)}
				previouslySelected={this.props.wasPreviouslySelected && this.props.wasPreviouslySelected(contact)}
				previouslySelectedLabel={this.props.previouslySelectedLabel}
				contact={contact}
				onSelect={this.selectAddress}
				onClick={this.chooseAddress}
				onRemove={this.props.onRemove}
			/>
		);
	};

	render(props, { suggestions }) {
		if (!suggestions || !suggestions.length) return null;

		return (
			<div class={style.suggestions}>
				{ suggestions.sort(byRank).map(this.renderContact) }
			</div>
		);
	}
}
