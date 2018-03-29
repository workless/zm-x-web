import { h, Component } from 'preact';
import { Icon } from '@zimbra/blocks';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import styles from './style';

export class CommandButton extends Component {
	handleClick = e => {
		if (typeof e.button !== 'undefined' && e.button !== 0) { return; }

		let { command, commandType: type, execCommand, onClick } = this.props;
		if (command && execCommand) {
			execCommand({ command, type });
		}
		else if (onClick) {
			onClick(e);
		}
		return this.cancel(e);
	}

	cancel(e) {
		e.preventDefault();
		e.stopPropagation();
		return false;
	}

	render({ label, command, commandState = {}, icon, style, title, ...props }) {
		return (
			<Localizer>
				<button
					class={cx(styles.toolbarButton, props.class, commandState[command] && styles.active, props.class)}
					onClick={this.handleClick}
					style={style}
					title={<Text id={`compose.toolbar.${title || command}`} />}
				>
					{icon && <Icon name={icon} />}
					{label}
				</button>
			</Localizer>
		);
	}
}
