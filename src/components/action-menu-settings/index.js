import { h } from 'preact';

import { Text } from 'preact-i18n';
import ActionMenu, { DropDownWrapper } from '../action-menu';
import ActionMenuGroup from '../action-menu-group';
import ActionMenuItem from '../action-menu-item';

import s from './style.less';
import cx from 'classnames';

export default function ActionMenuSettings({
	onClickSettings,
	popoverClass,
	actionButtonClass,
	iconClass

	/**
	 * onClickEmailSupport,
	 * etc...
	 */
}) {
	return (
		<ActionMenu
			icon="cog"
			actionButtonClass={actionButtonClass}
			popoverClass={cx(s.popover, popoverClass)}
			iconSize="md"
			iconClass={iconClass}
			iconOnly
			arrow={false}
			anchor="end"
		>
			<DropDownWrapper>
				<ActionMenuGroup>
					<ActionMenuItem
						className={s.item}
						onClick={onClickSettings}
					>
						<Text id="header.SETTINGS" />
					</ActionMenuItem>
				</ActionMenuGroup>
				<ActionMenuGroup>
					<ActionMenuItem
						className={s.item}
					>
						<Text id="header.EMAIL_SUPPORT" />
					</ActionMenuItem>
					<ActionMenuItem
						className={s.item}
					>
						<Text id="header.KEYBOARD_SHORTCUTS" />
					</ActionMenuItem>
				</ActionMenuGroup>
				<ActionMenuGroup>
					<ActionMenuItem
						className={s.item}
					>
						<Text id="header.PRIVACY" />
					</ActionMenuItem>
					<ActionMenuItem
						className={s.item}
					>
						<Text id="header.LEGAL" />
					</ActionMenuItem>
					<ActionMenuItem
						className={s.item}
					>
						<Text id="header.ABOUT_THE_ADS" />
					</ActionMenuItem>
				</ActionMenuGroup>
			</DropDownWrapper>
		</ActionMenu>
	);
}
