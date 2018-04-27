import { h } from 'preact';
import ActionMenuGroup from '../action-menu-group';
import ActionMenuItem from '../action-menu-item';
import ContextMenu from '../context-menu';
import { callWith } from '../../lib/util';

export default function CalendarEventContextMenu({ children, disabled, ...rest }) {
	return  (
		<ContextMenu
			disabled={disabled}
			menu={
				<CalendarEventContextMenuMenu {...rest} />
			}
			// Make sure context menu opens from entire event box, not just the text part
			style={{ height: '100%' }}
		>
			{children}
		</ContextMenu>
	);
}

const CalendarEventContextMenuMenu = ({ onEdit, event }) => (
	<ActionMenuGroup>
		<ActionMenuItem onClick={callWith(onEdit, event)} disabled={!onEdit} >
			Edit
		</ActionMenuItem>
	</ActionMenuGroup>
);
