import { h } from 'preact';

import ActionMenu, { DropDownWrapper } from '../action-menu';
import ActionMenuGroup from '../action-menu-group';
import ActionMenuItem from '../action-menu-item';

import s from './style.less';

export default function ActionMenuMailReply({
	onReply,
	onReplyAll,
	onForward,
	actionButtonClass,
	popoverClass,
	iconClass
}) {
	return (
		<ActionMenu
			icon="mail-reply"
			popoverClass={popoverClass}
			actionButtonClass={actionButtonClass}
			iconClass={iconClass}
			iconOnly
			arrow={false}
		>
			<DropDownWrapper>
				<ActionMenuGroup>
					<ActionMenuItem
						iconClass={s.icon}
						icon="mail-reply"
						onClick={onReply}
					>
						Reply
					</ActionMenuItem>
					<ActionMenuItem
						iconClass={s.icon}
						onClick={onReplyAll}
						icon="mail-reply-all"
					>
						Reply All
					</ActionMenuItem>
					<ActionMenuItem
						iconClass={s.icon}
						onClick={onForward}
						icon="mail-forward"
					>
						Forward
					</ActionMenuItem>
				</ActionMenuGroup>
			</DropDownWrapper>
		</ActionMenu>
	);
}
