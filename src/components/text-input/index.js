import { h, Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import s from './style.less';

export default class TextInput extends Component {
	registerRef = ref => {
		this.input = ref;
		this.props.inputRef && this.props.inputRef(ref);
	}

	componentDidMount() {
		if (this.props.autofocus) {
			this.input.focus();
		}
	}

	render({ wide, invalid, placeholder, placeholderId, ...rest }) {
		return (
			<Localizer>
				<input
					type="text"
					{...rest}
					placeholder={placeholderId ? <Text id={placeholderId} /> : placeholder}
					class={cx(s.input, wide && s.wide, invalid && s.invalid, rest.class)}
					ref={this.registerRef}
				/>
			</Localizer>
		);
	}
}
