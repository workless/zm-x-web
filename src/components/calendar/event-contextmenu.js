import { h } from 'preact';
import ActionMenuGroup from '../action-menu-group';
import ActionMenuItem from '../action-menu-item';
import ContextMenu from '../context-menu';
import { callWith } from '../../lib/util';

export default function CalendarEventContextMenu({ children, ...rest }) {
	return  (
		<ContextMenu
			menu={
				<CalendarEventContextMenuMenu {...rest} />
			}
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
