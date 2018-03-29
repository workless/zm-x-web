import { h } from 'preact';
import { callWith } from '../../lib/util';

import ActionMenu, { DropDownWrapper } from '../action-menu';
import ActionMenuGroup from '../action-menu-group';
import ActionMenuItem from '../action-menu-item';

export default function ActionMenuMailOverflow({
	disabled,
	onMarkRead,
	onFlag,
	onBlock,
	disableBlock,
	multiple,
	read,
	flagged,
	iconOnly,
	monotone,
	arrow,
	actionButtonClass,
	popoverClass
}) {
	return (
		<ActionMenu
			actionButtonClass={actionButtonClass}
			icon="ellipsis-h"
			iconOnly={iconOnly}
			label="More"
			disabled={disabled}
			monotone={monotone}
			arrow={arrow}
			popoverClass={popoverClass}
		>
			<DropDownWrapper>
				{multiple ? (
					<ActionMenuGroup>
						<ActionMenuItem onClick={callWith(onMarkRead, true)}>
							Mark as Read
						</ActionMenuItem>
						<ActionMenuItem onClick={callWith(onMarkRead, false)}>
							Mark as Unread
						</ActionMenuItem>
						<ActionMenuItem onClick={callWith(onFlag, true)}>Star</ActionMenuItem>
						<ActionMenuItem onClick={callWith(onFlag, false)}>
							Clear Star
						</ActionMenuItem>
						<ActionMenuItem onClick={onBlock} disabled={disableBlock}>
							Block
						</ActionMenuItem>
					</ActionMenuGroup>
				) : (
					<ActionMenuGroup>
						<ActionMenuItem onClick={callWith(onMarkRead, !read)}>
							Mark as {read ? 'Unread' : 'Read'}
						</ActionMenuItem>
						<ActionMenuItem onClick={callWith(onFlag, !flagged)}>
							{flagged ? 'Clear Star' : 'Star'}
						</ActionMenuItem>
						<ActionMenuItem onClick={onBlock} disabled={disableBlock}>
								Block
						</ActionMenuItem>
					</ActionMenuGroup>
				)}
			</DropDownWrapper>
		</ActionMenu>
	);
}
