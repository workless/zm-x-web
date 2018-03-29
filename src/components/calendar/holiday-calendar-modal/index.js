import { h, Component } from 'preact';
import { Text, withText } from 'preact-i18n';
import map from 'lodash-es/map';
import cx from 'classnames';
import ModalDialog from '../../modal-dialog';
import Select from '../../select';
import CreateCalendarModal from '../create-calendar-modal';
import feeds from '../../../constants/calendar-feeds';
import calendarNames from '../../../constants/calendar-names';

import style from './style';
import { callWith } from '../../../lib/util';

@withText(calendarNames)
export default class HolidayCalendarModal extends Component {
	state = {
		selectedCalendar: 'Australian',
		step: 'PICK',
		error: ''
	};

	// @TODO Go to create new calendar Screen ('Next' behavior)
	onAction = () => this.setState({ step: 'CUSTOMIZE' });

	onFieldChange = event =>
		this.setState({ selectedCalendar: event.target.value });

	toggleCreateHolidayCalendarModal = saved => {
		if (saved) this.props.onClose('Holidays');
		this.setState({
			step: 'PICK'
		});
	};
	render(
		{ onClose, calendarsData, refetchCalendars },
		{ selectedCalendar, error, step }
	) {
		return (
			<div>
				{step === 'PICK' && (
					<ModalDialog
						title="calendar.dialogs.holidayCalendar.DIALOG_TITLE"
						actionLabel="buttons.next"
						onAction={this.onAction}
						onClose={callWith(onClose, 'Holidays')}
						class={style.holidayCalendarModal}
						contentClass={style.holidayCalendarModalContent}
					>
						{error && <div class={style.error}>{error}</div>}
						<div class={style.subsection}>
							<div class={cx(style.subsectionTitle, style.forSelect)}>
								<Text id="calendar.dialogs.holidayCalendar.HOLIDAY_CALENDAR_LABEL" />
							</div>
							<Select value={selectedCalendar} onChange={this.onFieldChange} fullWidth>
								{map(feeds, (v, k) => (
									<option value={k}>
										<Text id={`calendar.sidebar.holidayCalendars.${k}`} />
									</option>
								))}
							</Select>
						</div>
					</ModalDialog>
				)}
				{step === 'CUSTOMIZE' && (
					<CreateCalendarModal
						onClose={this.toggleCreateHolidayCalendarModal}
						calendarsData={calendarsData}
						predefinedUrl={feeds[selectedCalendar]}
						predefinedName={this.props[selectedCalendar]}
						refetchCalendars={refetchCalendars}
						calendarType={'Holidays'}
					/>
				)}
			</div>
		);
	}
}
