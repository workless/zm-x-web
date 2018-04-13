import { h } from 'preact';
import { Popover } from '@zimbra/blocks';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import styles from './style';

export default function CollapsedSubmenu({ commands, renderCommand }) {
	return (
		<Localizer>
			<Popover
				text="A̲"
				onToggle={this.handleTogglePopover}
				class={styles.submenuWrapper}
				toggleClass={cx(styles.toggle, styles.toolbarButton)}
				popoverClass={styles.collapsedSubmenuPopover}
				tooltip={<Text id={`compose.toolbar.collapsedTitle`} />}
			>
				{commands.map(renderCommand)}
			</Popover>
		</Localizer>
	);
}
