import { h, Component } from 'preact';
import linkState from 'linkstate';
import { GIPHY_LOGO_URL } from '../../../../../../../constants/media-menu';
import TextInput from '../../../../../../text-input';
import style from './style';
import cx from 'classnames';

const ENTER = 13;

export default class SearchInput extends Component {
	handleKeyDown = (e) => {
		if (e.keyCode === ENTER) {
			this.props.onSearch && this.props.onSearch(this.state.value);
		}
	}

	componentWillReceiveProps({ value }) {
		if (this.state.value !== value) {
			this.setState({ value });
		}
	}

	render(props, { value }) {
		return (
			<span {...props} class={cx(style.searchInput, props.class)}>
				<TextInput
					placeholderId="mediaConcierge.gifs.search.placeholder"
					value={value}
					onInput={linkState(this, 'value')}
					onKeyDown={this.handleKeyDown}
				/>
				<img src={GIPHY_LOGO_URL} />
			</span>
		);
	}
}

