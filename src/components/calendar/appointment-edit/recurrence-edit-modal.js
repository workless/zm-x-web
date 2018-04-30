import { h, Component } from 'preact';
import { Text } from 'preact-i18n';

import ModalDialog from '../../modal-dialog';
import s from './style.less';

export default class RecurrenceEditModal extends Component {

	onAction = () => {
		this.props.onClose();
	}

	render({ onClose }) {
		return (
			<ModalDialog
				title="calendar.dialogs.recurrence_edit.title"
				actionLabel="buttons.continue"
				onAction={this.onAction}
				onClose={onClose}
			>
				<div>
					<Text id="calendar.dialogs.recurrence_edit.label">You're editing a recurring event. Apply chnages to:</Text>
				</div>
				<div>
					<label>
						<input
							type="radio"
							name="recurrenceType"
							value="event"
							checked
						/>
						<Text id="calendar.dialogs.recurrence_edit.event_only">This Event Only</Text>
					</label>
				</div>
				<div>
					<label>
						<input
							type="radio"
							name="recurrenceType"
							value="all"
						/>
						<Text id="calendar.dialogs.recurrence_edit.all_events">All Events</Text>
					</label>
				</div>
			</ModalDialog>
		);
	}
}
