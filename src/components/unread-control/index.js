import { h, Component } from 'preact';
import cx from 'classnames';
import s from './style.less';

export default class UnreadControl extends Component {

	handleClick = (e) => this.props.onChange && this.props.onChange(e, !this.props.value)

	render({ class: cls, value, visible, onChange, ...rest }) {
		return (
			<div
				role="checkbox"
				aria-checked={value ? 'true' : 'false'}
				aria-label="Unread"
				class={cx(s.unreadControl, value && s.unread, visible && s.visible, cls)}
				onClick={this.handleClick}
				value={value}
				{...rest}
			/>
		);
	}
}
