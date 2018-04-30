import { h, Component } from 'preact';
import { Text, withText } from 'preact-i18n';
import linkstate from 'linkstate';
import moment from 'moment';
import get from 'lodash/get';
import isString from 'lodash/isString';
import { Button, Icon } from '@zimbra/blocks';
import cx from 'classnames';

import { newAlarm, hasEmailAlarm, hasDisplayAlarm } from '../../../utils/event';
import { getPrimaryAccountAddress } from '../../../utils/account';

import FormGroup from '../../form-group';
import TextInput from '../../text-input';
import Textarea from '../../textarea';
import DateInput from '../../date-input';
import TimeInput from '../../time-input';
import Select from '../../select';
import AlignedForm from '../../aligned-form';
import AlignedLabel from '../../aligned-form/label';
import AddressField from '../../address-field';
import AvailabilityIndicator from '../../availability-indicator';
import chooseFiles from 'choose-files';
import AttachmentGrid from '../../attachment-grid';
import AppointmentEditToolbar from './appointment-edit-toolbar';
import wire from 'wiretie';

import s from './style.less';
import { ATTENDEE_ROLE } from '../../../constants/calendars';
import withMediaQuery from '../../../enhancers/with-media-query';
import { minWidth, screenMd } from '../../../constants/breakpoints';

const REMIND_OPTIONS = [
	'never',
	'0m',
	'1m',
	'5m',
	'10m',
	'15m',
	'30m',
	'45m',
	'60m',
	'2h',
	'3h',
	'4h',
	'5h',
	'18h',
	'1d',
	'2d',
	'3d',
	'4d',
	'1w',
	'2w'
];

const INTERVAL_SHORTHAND_MAP = {
	m: 'minutes',
	h: 'hours',
	d: 'days',
	w: 'weeks'
};

const SHOW_AS_OPTIONS = ['F', 'T', 'B', 'O'];
const REPEAT_OPTIONS = ['NONE', 'DAI', 'WEE', 'MON', 'YEA'];

function remindValueFor(alarmData) {
	let relativeTrigger = get(alarmData, '0.alarms.0.trigger.0.relative.0');

	return (
		relativeTrigger &&
		((relativeTrigger.weeks && `${relativeTrigger.weeks}w`) ||
		(relativeTrigger.days && `${relativeTrigger.days}d`) ||
		(relativeTrigger.hours && `${relativeTrigger.hours}h`) ||
		(typeof relativeTrigger.minutes === 'number' &&
			`${relativeTrigger.minutes}m`))
	);
}

const DesktopHeading = ( { title, onClose } ) => (<div class={s.header}>
	<h2><Text id={title} /></h2>
	<Button
		styleType="floating"
		class={s.actionButton}
		onClick={onClose}
	/>
</div> );

const MobileHeading = ( { title } ) => (<div class={s.simpleHeader}>
	<h2><Text id={title} /></h2>
</div>);

@withMediaQuery(minWidth(screenMd), 'matchesScreenMd')
@wire('zimbra', {}, zimbra => ({
	attach: zimbra.appointments.attach
}))
@withText({
	errorMsg: 'calendar.editModal.FILE_SIZE_EXCEEDED'
})
export default class AppointmentEditEvent extends Component {
	static defaultProps = {
		title: 'calendar.editModal.title'
	};

	state = {
		event: null,
		remindValue: null,
		remindDesktop: true,
		remindEmail: false,
		repeatValue: 'NONE',
		showAsValue: 'B',
		allDay: false,
		isPrivate: false,
		isChoosingAttachments: false,
		notes: '',
		attendees: [],
		attachments: [],
		aidArr: [],
		isErrored: false
	};

	setEvent = ({ event }) => {
		const { alarm, alarmData } = event;

		this.setState({
			event,
			remindValue: alarm && remindValueFor(alarmData),
			remindDesktop: alarm && hasDisplayAlarm(alarmData),
			remindEmail: alarm && hasEmailAlarm(alarmData),
			allDay: event.allDay,
			isPrivate: this.state.isPrivate
		});
	};

	alarmsFromState = () => {
		const { remindValue, remindDesktop, remindEmail } = this.state;
		const email =
			get(
				this,
				'props.preferencesData.preferences.zimbraPrefCalendarReminderEmail'
			) || getPrimaryAccountAddress(this.props.accountInfoData.accountInfo);
		if (remindValue === 'never') {
			return [];
		}

		const [, intervalValue, intervalType] = remindValue.match(/(\d*)([mhdw])/);
		const interval = {
			[INTERVAL_SHORTHAND_MAP[intervalType]]: parseInt(intervalValue, 10)
		};

		let alarms = [];
		if (remindDesktop) {
			alarms.push(newAlarm({ interval, action: 'DISPLAY' }));
		}
		if (remindEmail && email) {
			alarms.push(
				newAlarm({ interval, action: 'EMAIL', attendees: { email } })
			);
		}

		return alarms;
	};

	recurrenceFromState = () => {
		const { repeatValue } = this.state;
		if (repeatValue === 'NONE') {
			return undefined;
		}

		return {
			add: {
				rule: {
					interval: {
						intervalCount: 1
					},
					frequency: repeatValue
				}
			}
		};
	};

	handleSubmit = () => {
		const {
			showAsValue,
			allDay,
			event,
			attendees,
			notes,
			isPrivate,
			attachments
		} = this.state;

		const promiseArray = this.getAttachPromises(attachments);
		Promise.all(promiseArray)
			.then(res => {
				const aidArr = res;
				this.props.onAction({
					...event,
					allDay,
					attendees,
					isPrivate,
					attachments: aidArr,
					notes,
					alarms: this.alarmsFromState(),
					recurrence: this.recurrenceFromState(),
					freeBusy: showAsValue
				});
			});

			/*.catch(() => {
				// @TODO Show error somewhere
				this.setState({ isErrored: true });
			});*/
	};

	handleAttendeesChange = e => {
		const attendees = e.value.map(a => {
			if (isString(a)) {
				return a;
			}

			const attendee = this.state.attendees.find(
				({ address }) => a.address === address
			);
			return {
				role: attendee ? attendee.role : ATTENDEE_ROLE.required,
				...a
			};
		});

		const update = { attendees };

		if (this.state.availabilityVisible && !attendees.some(a => !isString(a))) {
			update.availabilityVisible = false;
		}

		this.setState(update);
	};

	handleToggleAvailabilty = () => {
		this.setState({
			availabilityVisible: !this.state.availabilityVisible
		});
	};

	handleStartChange = date => {
		const { event } = this.state;
		const diff = moment(event.start).diff(date);
		this.setState({
			event: {
				...event,
				start: date,
				end: moment(event.end)
					.subtract(diff)
					.toDate()
			}
		});
	};

	handleEndChange = date => {
		this.setState({
			event: {
				...this.state.event,
				end: date
			}
		});
	};

	chooseAttachments = () => {
		this.setState({ isChoosingAttachments: true });
		chooseFiles(this.addAttachments);
	};

	addAttachments = attachments => {
		this.setState({
			...this.state,
			isChoosingAttachments: false,
			isErrored: false,
			attachments: this.state.attachments.concat(attachments)
		});
	};

	getAttachPromises = attachments =>
		attachments &&
		attachments.map(attachment =>
			this.props.attach(attachment, {
				filename: attachment.name,
				contentType: attachment.type
			})
		);

	onClose = () => {
		if (!this.state.isChoosingAttachments) {
			this.props.onClose();
		}
	};

	removeAttachment = ({ attachment }) => {
		let { attachments } = this.state;
		this.setState({
			...this.state,
			isErrored: false,
			attachments: attachments.filter(a => a !== attachment)
		});
	};

	componentWillMount() {
		this.setEvent(this.props);
	}

	componentWillReceiveProps(nextProps) {
		this.setEvent(nextProps);
	}

	render(
		{ title, inline, class: cls, matchesScreenMd },
		{
			allDay,
			isPrivate,
			attendees,
			event,
			notes,
			remindDesktop,
			remindEmail,
			remindValue,
			repeatValue,
			showAsValue,
			availabilityVisible,
			attachments
		}
	) {
		const start = moment(event.start);
		const endDate = allDay ? start.endOf('day') : event.end;
		const invalidDateRange = !allDay && start.diff(event.end) > 0;
		const showAvailabilityButtonVisible =
			!availabilityVisible && attendees.some(a => !isString(a));

		let desktopHeading, mobileHeading;
		if ( matchesScreenMd ){
			// desktop view
			desktopHeading = ( <DesktopHeading title={title} onClose={this.onClose} /> );
		}
		else {
			mobileHeading = ( <MobileHeading title={title} /> );
		}

		return (
			<div className={cx(cls, s.wrapper, inline && s.inlineWrapper)}>
				{ desktopHeading }
				<AlignedForm class={s.formWrapper}>
					{ mobileHeading }
					<FormGroup>
						<TextInput
							placeholderId={title}
							value={event.name}
							onInput={linkstate(this, 'event.name')}
							wide
							autofocus
						/>
					</FormGroup>
					<FormGroup>
						<AlignedLabel class={s.alignedLabel} align="left"><Text id="calendar.editModal.fields.start" /></AlignedLabel>
						<div class={s.datepickerWrapper}>
							<DateInput
								class={s.dateSelector}
								dateValue={event.start}
								onDateChange={this.handleStartChange}
							/>
							<TimeInput
								class={s.timeSelector}
								dateValue={
									allDay ? moment(event.start).startOf('day') : event.start
								}
								onDateChange={this.handleStartChange}
								disabled={allDay}
							/>
							<label class={s.allDay}>
								<input
									type="checkbox"
									checked={allDay}
									onChange={linkstate(this, 'allDay')}
								/>
								<Text id="calendar.editModal.fields.allDay" />
							</label>
						</div>
					</FormGroup>
					<FormGroup>
						<AlignedLabel class={s.alignedLabel} align="left"><Text id="calendar.editModal.fields.end" /></AlignedLabel>
						<div class={s.datepickerWrapper}>
							<DateInput
								class={s.dateSelector}
								dateValue={endDate}
								onDateChange={linkstate(this, 'event.end')}
								disabled={allDay}
								invalid={invalidDateRange}
							/>
							<TimeInput
								class={s.timeSelector}
								dateValue={endDate}
								onDateChange={this.handleEndChange}
								disabled={allDay}
								invalid={invalidDateRange}
							/>
						</div>
					</FormGroup>
					<FormGroup>
						<AlignedLabel class={s.alignedLabel} align="left"><Text id="calendar.editModal.fields.repeat" /></AlignedLabel>
						<Select
							value={repeatValue}
							onChange={linkstate(this, 'repeatValue')}
						>
							{REPEAT_OPTIONS.map(k => (
								<option value={k} key={k}>
									<Text id={`calendar.editModal.fields.repeatOptions.${k}`} />
								</option>
							))}
						</Select>
						<AlignedLabel class={s.privateWrapper} align="left">
							<label>
								<input
									type="checkbox"
									checked={isPrivate}
									onChange={linkstate(this, 'isPrivate')}
								/>
								<Text id="calendar.editModal.fields.private" />
							</label>
						</AlignedLabel>
					</FormGroup>
					<FormGroup>
						<AlignedLabel class={s.alignedLabel} align="left"><Text id="calendar.editModal.fields.location" /></AlignedLabel>
						<TextInput
							value={event.location}
							onInput={linkstate(this, 'event.location')}
							wide
						/>
					</FormGroup>
					<FormGroup class={s.inviteesGroup}>
						<AlignedLabel class={s.alignedLabel} align="left"><Text id="calendar.editModal.fields.invitees" /></AlignedLabel>
						<AddressField
							class={s.addressField}
							value={attendees}
							onChange={this.handleAttendeesChange}
							formSize
						/>
					</FormGroup>
					<FormGroup
						class={(availabilityVisible || showAvailabilityButtonVisible) && s.availabilityIndicatorGroup}
					>
						{availabilityVisible ? (
							<AvailabilityIndicator
								event={event}
								attendees={attendees}
								onAttendeesChange={this.handleAttendeesChange}
								onStartChange={this.handleStartChange}
								onClose={this.handleToggleAvailabilty}
							/>
						) : (
							showAvailabilityButtonVisible && (
								<Button
									class={cx(s.fieldOffset, s.availabilityButton)}
									onClick={this.handleToggleAvailabilty}
								>
									<Text id="calendar.editModal.buttons.showAvailability" />
								</Button>
							)
						)}
					</FormGroup>
					<FormGroup>
						<AlignedLabel class={s.alignedLabel} align="left"><Text id="calendar.editModal.fields.notes" /></AlignedLabel>
						<div class={s.notesContainer}>
							<Textarea
								class={s.textArea}
								rows="5"
								wide
								value={notes}
								onInput={linkstate(this, 'notes')}
							/>
							{attachments &&
								(attachments.length > 0 && (
									<div class={s.attachments}>
										<AttachmentGrid
											attachments={attachments}
											isEventAttachments
											removable
											onRemove={this.removeAttachment}
										/>
									</div>
								))}
						</div>
						<Button
							title={<Text id="calendar.editModal.buttons.addAttachment" />}
							class={s.attachmentButton}
							onClick={this.chooseAttachments}
						>
							<Icon size="md" name="paperclip" />
						</Button>
					</FormGroup>
					<FormGroup compact>
						<AlignedLabel class={s.alignedLabel} align="left"><Text id="calendar.editModal.fields.remind" /></AlignedLabel>
						<Select
							value={remindValue}
							onChange={linkstate(this, 'remindValue')}
						>
							{REMIND_OPTIONS.map(k => (
								<option value={k} key={k}>
									<Text id={`calendar.editModal.fields.remindOptions.${k}`} />
								</option>
							))}
						</Select>
					</FormGroup>
					{remindValue !== 'never' && (
						<FormGroup class={s.fieldOffset} rows>
							<label class={s.subOption}>
								<input
									type="checkbox"
									onChange={linkstate(this, 'remindDesktop')}
									checked={remindDesktop}
								/>
								<Text id="calendar.editModal.fields.mobileDesktop" />
							</label>
							<label class={s.subOption}>
								<input
									type="checkbox"
									onChange={linkstate(this, 'remindEmail')}
									checked={remindEmail}
								/>
								<Text id="calendar.editModal.fields.email" />
							</label>
						</FormGroup>
					)}
					<FormGroup>
						<AlignedLabel class={s.alignedLabel} align="left"><Text id="calendar.editModal.fields.showAs" /></AlignedLabel>
						<Select
							value={showAsValue}
							onChange={linkstate(this, 'showAsValue')}
						>
							{SHOW_AS_OPTIONS.map(k => (
								<option value={k} key={k}>
									<Text id={`calendar.editModal.fields.showAsOptions.${k}`} />
								</option>
							))}
						</Select>
					</FormGroup>
				</AlignedForm>
				<AppointmentEditToolbar isMobileActive={!matchesScreenMd} onSave={this.handleSubmit} onCancel={this.onClose} />
			</div>
		);
	}
}
