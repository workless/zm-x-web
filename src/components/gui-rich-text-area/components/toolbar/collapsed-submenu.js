import { h, Component } from 'preact';
import { Popover } from '@zimbra/blocks';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import styles from './style';

export default class CollapsedSubmenu extends Component {
	handleTogglePopover = (active) => { this.setState({ active }); }

	render({ commands, renderCommand }, { active }) {
		return (
			<Localizer>
				<Popover
					text="A̲"
					active={active}
					onToggle={this.handleTogglePopover}
					class={styles.submenuWrapper}
					toggleClass={cx(styles.toggle, styles.toolbarButton)}
					popoverClass={cx(active && styles.active, styles.dropupMenu)}
					tooltip={<Text id={`compose.toolbar.collapsedTitle`} />}
				>
					{commands.map(renderCommand)}
				</Popover>
			</Localizer>
		);
	}
}
