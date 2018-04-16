import { h } from 'preact';
import CalendarEventDetails from './event-details';
import ModalDrawer from '../../modal-drawer';
import style from './style';

export default function CalendarEventDetailsModal(props) {
	return (
		<ModalDrawer onClickOutside={props.onClose}>
			<div class={style.eventDrawer}>
				<CalendarEventDetails {...props} />
			</div>
		</ModalDrawer>
	);
}
