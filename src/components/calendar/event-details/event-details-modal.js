import { h } from 'preact';
import CalendarEventDetails from './event-details';
import ModalDrawer from '../../modal-drawer';

export default function CalendarEventDetailsModal(props) {
	return (
		<ModalDrawer onClickOutside={props.onClose}>
			<CalendarEventDetails {...props} />
		</ModalDrawer>
	);
}
