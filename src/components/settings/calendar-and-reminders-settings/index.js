import { h } from 'preact';
import { Text, withText } from 'preact-i18n';
import moment from 'moment-timezone';
import cx from 'classnames';
import ErrorTooltip from '../../error-tooltip';
import TimePicker from '../../time-picker';
import HelpTooltip from '../../help-tooltip';
import PureComponent from '../../../lib/pure-component';
import cloneDeep from 'lodash-es/cloneDeep';
import mapValues from 'lodash-es/mapValues';
import style from '../style';
import TimeZones from '../../../constants/time-zones';

@withText({
	generalSettingsTitle: 'settings.calendarAndReminders.generalSettingsTitle'
})
export default class CalendarAndRemindersSettings extends PureComponent {
	state = {
		timeOfDay: cloneDeep(this.props.value.timeOfDay),
		timeError: { visible: false, message: '' },
		tooltipsVisibility: {
			timezone: false
		}
	};

	dismiss = e => {
		e.stopPropagation();
		this.setState({
			tooltipsVisibility: mapValues(this.state.tooltipsVisibility, () => false)
		});
	};

	toggleTooltip = id =>
		this.setState({
			tooltipsVisibility: mapValues(
				this.state.tooltipsVisibility,
				(val, key) => key === id
			)
		});

	updateStartTime = timeSlot => {
		if (
			moment(timeSlot, 'hh:mm A') >=
			moment(this.state.timeOfDay[1].end, 'hh:mm A')
		) {
			this.setState({
				timeError: {
					visible: true,
					message: 'Start of day cannot be after the end of day.'
				}
			});
			return;
		}
		let timeOfDayCopy = this.state.timeOfDay;
		timeOfDayCopy = mapValues(timeOfDayCopy, day => ({
			...day,
			start: timeSlot
		}));
		this.setState(
			{ timeOfDay: timeOfDayCopy, timeError: { visible: false, message: '' } },
			() => {
				this.props.onFieldChange('timeOfDay')({
					target: { value: this.state.timeOfDay }
				});
			}
		);
	};

	updateEndTime = timeSlot => {
		if (
			moment(timeSlot, 'hh:mm A') <=
			moment(this.state.timeOfDay[1].start, 'hh:mm A')
		) {
			this.setState({
				timeError: {
					visible: true,
					message: 'End of day cannot be before the start of day.'
				}
			});
			return;
		}
		let timeOfDayCopy = this.state.timeOfDay;
		timeOfDayCopy = mapValues(timeOfDayCopy, day => ({
			...day,
			end: timeSlot
		}));
		this.setState(
			{ timeOfDay: timeOfDayCopy, timeError: { visible: false, message: '' } },
			() => {
				this.props.onFieldChange('timeOfDay')({
					target: { value: this.state.timeOfDay }
				});
			}
		);
	};

	render({ generalSettingsTitle, onFieldChange, value }) {
		const { timeError, timeOfDay, tooltipsVisibility } = this.state;
		const startTime = timeOfDay[1].start;
		const endTime = timeOfDay[1].end;
		return (
			<div>
				<div>
					<div class={style.sectionTitle}>{generalSettingsTitle}</div>
					{timeError.visible && <ErrorTooltip message={timeError.message} />}
					<div class={style.subsection}>
						<div class={cx(style.subsectionTitle, style.forSelect)}>
							<Text id="settings.calendarAndReminders.startOfWeekSubsection">
								Start of Week
							</Text>
						</div>
						<div class={style.subsectionBody}>
							<select
								class={cx(style.select, style.half)}
								value={value.startOfWeek}
								onChange={onFieldChange('startOfWeek')}
							>
								{moment
									.weekdays()
									.map(day => <option value={day}>{day}</option>)}
							</select>
						</div>
					</div>
					<div class={style.subsection}>
						<div class={cx(style.subsectionTitle, style.forSelect)}>
							<Text id="settings.calendarAndReminders.startOfDaySubsection">
								Start of Day
							</Text>
						</div>
						<div class={style.subsectionBody}>
							<TimePicker
								displayedTime={startTime}
								onUpdateTime={this.updateStartTime}
							/>
						</div>
					</div>
					<div class={style.subsection}>
						<div class={cx(style.subsectionTitle, style.forSelect)}>
							<Text id="settings.calendarAndReminders.endOfDaySubsection">
								End of Day
							</Text>
						</div>
						<div class={style.subsectionBody}>
							<TimePicker
								displayedTime={endTime}
								onUpdateTime={this.updateEndTime}
							/>
						</div>
					</div>
					<div class={style.subsection}>
						<div class={cx(style.subsectionTitle, style.forSelect)}>
							<Text id="settings.calendarAndReminders.timeZoneSubsection">
								Time Zone
							</Text>
						</div>
						<div class={cx(style.subsectionBody, style.flexContainer)}>
							<select
								onChange={onFieldChange('timeZone')}
								class={style.select}
								value={value.timeZone}
							>
								{TimeZones.map(TimeZone => (
									<option value={TimeZone}>{TimeZone}</option>
								))}
							</select>
							<HelpTooltip
								dismiss={this.dismiss}
								name="timezone"
								toggleTooltip={this.toggleTooltip}
								tooltipsVisibility={tooltipsVisibility}
							>
								<p>Set your Timezone Preference.</p>
							</HelpTooltip>
						</div>
					</div>
					<div class={style.subsection}>
						<div class={style.subsectionTitle}>
							<Text id="settings.calendarAndReminders.eventsListsSubsection">
								Invitations
							</Text>
						</div>
						<div class={style.subsectionBody}>
							<ul class={style.list}>
								<li>
									<label>
										<input
											onChange={onFieldChange('autoAddAppointmentsToCalendar')}
											type="checkbox"
											checked={value.autoAddAppointmentsToCalendar}
										/>
										<Text id="settings.calendarAndReminders.autoAddAppointmentsToCalendar">
											Automatically add to my calendar
										</Text>
									</label>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
