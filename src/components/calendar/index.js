import { h, Component } from 'preact';
import cx from 'classnames';
import { branch, renderComponent, withProps } from 'recompose';
import moment from 'moment';
import BigCalendar from 'react-big-calendar';
import 'react-big-calendar/lib/less/styles.less';
import { Text } from 'preact-i18n';

import startOfDay from 'date-fns/start_of_day';
import startOfWeek from 'date-fns/start_of_week';
import startOfMonth from 'date-fns/start_of_month';
import endOfMonth from 'date-fns/end_of_month';
// import isToday from 'date-fns/is_today';
import format from 'date-fns/format';
import addMilliseconds from 'date-fns/add_milliseconds';
import { connect } from 'preact-redux';
import * as calendarActionCreators from '../../store/calendar/actions';
import { graphql } from 'react-apollo';
import get from 'lodash/get';
import flatMap from 'lodash/flatMap';
import invert from 'lodash/invert';
import find from 'lodash/find';
import cloneDeep from 'lodash/cloneDeep';
import some from 'lodash/some';
import flow from 'lodash/flow';

import {
	VIEW_AGENDA,
	VIEW_DAY,
	VIEW_WEEK,
	VIEW_MONTH,
	VIEW_YEAR
} from './constants';
import CalendarToolbar from './toolbar';
import CalendarSectionToolbar from './section-toolbar';
import CalendarSidebar from './sidebar';
import CalendarRightbar from './rightbar';
import CalendarDateHeader from './date-header';
import CreateCalendarModal from './create-calendar-modal';
import CreateSharedCalendarModal from './create-shared-calendar-modal';
import { CalendarEventDetailsModal } from './event-details';
import ImportCalendarModal from './import-calendar-modal';
import ExportCalendarModal from './export-calendar-modal';
import { CalendarEvent, CalendarEventWrapper, getEventProps } from './event';
import YearView from './year-view';
import QuickAddEventPopover from './quick-add-event-popover';
import AppointmentEditEvent from './appointment-edit';
import SkeletonWithSidebar from '../skeletons/with-sidebar';

import CalendarsAndAppointmentsQuery from '../../graphql/queries/calendar/calendars-and-appointments.graphql';
import PreferencesQuery from '../../graphql/queries/preferences/preferences.graphql';
import PrefCalendarInitialViewMutation from '../../graphql/queries/preferences/calendar/initial-view-mutation.graphql';
import AccountInfoQuery from '../../graphql/queries/preferences/account-info.graphql';
import { withCreateAppointment, withModifyAppointment, withDeleteAppointment } from '../../graphql-decorators/calendar';

import colorForCalendar from '../../utils/color-for-calendar';
import { hasFlag } from '../../utils/folders';
import { newAlarm } from '../../utils/event';
import { soapTimeToJson } from '../../utils/prefs';
import withMediaQuery from '../../enhancers/with-media-query';
import { minWidth, screenMd } from '../../constants/breakpoints';
import { notify as notifyActionCreator } from '../../store/notifications/actions';

import style from './style';
import { switchTimeFormat } from '../../lib/util';
import { shallowEqual } from '../../lib/pure-component';

BigCalendar.setLocalizer(BigCalendar.momentLocalizer(moment));

const PREF_TO_VIEW = {
	day: 'day',
	list: 'agenda',
	month: 'month',
	week: 'week',
	workWeek: 'work_week',
	year: 'year'
};
const VIEW_TO_PREF = invert(PREF_TO_VIEW);

const DAY = 24 * 60 * 60 * 1000;

const TIMES = {
	agenda: 0,
	day: DAY,
	week: 7 * DAY,
	month: 31 * DAY, // (3 months = buffer)
	year: 0
};

const FORMATS = {
	selectRangeFormat: ({ start, end }) =>
		`${format(start, 'h:mm A')} - ${format(end, 'h:mm A')}`,
	eventTimeRangeFormat: () => null,
	timeGutterFormat: date => format(date, 'h A'),
	dayFormat: date => format(date, 'ddd D'),
	dayHeaderFormat: date => format(date, 'dddd, MMMM D, YYYY'),
	dayRangeHeaderFormat: ({ start, end }) =>
		`${format(start, 'MMMM D')} - ${format(
			end,
			start.getMonth() !== end.getMonth() ? 'MMMM D, YYYY' : 'D, YYYY'
		)}`
};

const VIEWS = {
	agenda: true,
	day: true,
	week: true,
	work_week: true,
	month: true,
	year: YearView // @TODO Zimbra doesn't support year view
};

const DECLINED = 'DE';
function isParticipatingInEvent({ participationStatus }) {
	return !~[
		DECLINED
	].indexOf(participationStatus);
}

function getView({ preferences }) {
	return (
		(preferences && PREF_TO_VIEW[preferences.zimbraPrefCalendarInitialView]) ||
		VIEW_MONTH
	);
}

function getWorkingHours({ preferences }) {
	return (
		preferences && soapTimeToJson(preferences.zimbraPrefCalendarWorkingHours)
	);
}

/**
 * returns the zimbra calendar first day of the week pref as a number
 * @param {Object} preferences
 * @returns {number}            Day of the Week as a number
 */
function getDOW({ preferences }) {
	return (
		preferences && parseInt(preferences.zimbraPrefCalendarFirstDayOfWeek, 10)
	);
}

@withMediaQuery(minWidth(screenMd), 'matchesScreenMd')
@connect(
	({ calendar = {} }) => ({
		date: calendar.date
	}),
	{
		setDate: calendarActionCreators.setDate,
		notify: notifyActionCreator
	}
)
@graphql(AccountInfoQuery, {
	name: 'accountInfoData'
})
@graphql(PreferencesQuery, {
	name: 'preferencesData'
})
@withProps(({ preferencesData }) => ({
	view: getView(preferencesData)
}))
@graphql(CalendarsAndAppointmentsQuery, {
	props: ({ data: { getFolder = {}, ...data } }) => ({
		calendarsData: {
			...data,
			calendars: [
				...(get(getFolder, 'folders.0.folders') || []),
				...(get(getFolder, 'folders.0.linkedFolders') || [])
			]
		}
	}),
	options: ({ date, preferencesData, view }) => {
		if (!preferencesData.preferences) {
			return { skip: true };
		}

		const dayOfTheWeek = getDOW(preferencesData);

		moment.locale('en', {
			week: {
				dow: dayOfTheWeek
			}
		});

		let start = new Date(date);
		let end;

		// @TODO drop silly end calcs and use date-fns addWeeks() / addMonths()
		if (view === VIEW_YEAR) {
			// Don't fetch any events when showing a full year (seems to crash zcs)
			return {};
			// start = startOfYear(start);
			// end = endOfYear(start);
		}
		else if (view === VIEW_MONTH) {
			start = startOfMonth(start);
		}
		else if (view === VIEW_WEEK) {
			start = startOfWeek(start);
		}
		else if (view === VIEW_DAY) {
			start = startOfDay(start);
		}
		else if (view === VIEW_AGENDA) {
			start = startOfMonth(start);
			end = endOfMonth(start);
		}

		return {
			fetchPolicy: 'cache-and-network',
			variables: {
				start: start.getTime() - TIMES[view],
				end: end || start.getTime() + TIMES[view] * 3 // @TODO this should work like start's offset
			}
		};
	}
})
@branch(
	({ accountInfoData, preferencesData, calendarsData }) =>
		!accountInfoData.accountInfo || !preferencesData.preferences || !calendarsData.calendars,
	renderComponent(SkeletonWithSidebar)
)
@graphql(PrefCalendarInitialViewMutation, {
	props: ({ mutate }) => ({
		setView: value =>
			mutate({
				variables: { value },
				optimisticResponse: {
					__typename: 'Mutation',
					prefCalendarInitialView: value
				},
				update: (cache, { data: { prefCalendarInitialView } }) => {
					const data = cache.readQuery({ query: PreferencesQuery });
					data.preferences.zimbraPrefCalendarInitialView = prefCalendarInitialView;

					cache.writeQuery({
						query: PreferencesQuery,
						data
					});
				}
			})
	})
})
@withCreateAppointment()
@withModifyAppointment()
@withDeleteAppointment()
export default class Calendar extends Component {
	static defaultProps = {
		businessHoursStart: 8,
		businessHoursEnd: 17
	};

	state = {
		newEvent: null,
		quickAddBounds: null,
		activeModal: '',
		showEditView: false
	};

	getSlotProps = time => {
		const hoursObject = getWorkingHours(this.props.preferencesData);
		let businessHoursStart = parseInt(
				switchTimeFormat(hoursObject[1].start, 'H:mm A', 'H'),
				10
			),
			businessHoursEnd = parseInt(
				switchTimeFormat(hoursObject[1].end, 'H:mm A', 'H'),
				10
			),
			hour = new Date(time).getHours(),
			className =
				hour >= businessHoursStart && hour <= businessHoursEnd
					? style.businessHours
					: style.afterHours;
		return { className };
	};

	selectSlot = ({ start, end }) => {
		const allDay = start === end;

		this.setState({
			newEvent: {
				allDay,
				new: true,
				location: '',
				start,
				end: allDay
					? moment(start)
						.endOf('day')
						.valueOf()
					: end,
				alarms: [newAlarm()],
				onRender: this.handleQuickAddRender
			}
		});
	};

	handleCreateNewEvent = () => {
		const now = moment();
		const start =
			now.minutes() >= 29
				? now.endOf('hour').add(1, 'second')
				: now.startOf('hour').add(30, 'minutes');

		this.selectSlot({
			start: start.toDate(),
			end: start.add(30, 'minutes').toDate()
		});
		this.setState( { showEditView: true } );
	};

	handleCloseAddEvent = () => {
		this.setState( { showEditView: false } );
		this.clearNewEvent();
	};

	clearNewEvent = () => {
		this.setState({
			newEvent: null,
			quickAddBounds: null
		});
	};

	closeActiveModal = () => {
		this.setState({
			activeModal: '',
			activeModalProps: {}
		});
	};

	openModal = (modalType, extraProps) => {
		this.setState({
			activeModal: modalType,
			activeModalProps: extraProps
		});
	};

	selectEvent = event => {
		const { matchesScreenMd } = this.props;
		if (!matchesScreenMd) {
			this.openModal('eventDetails', {
				event,
				onEdit: this.editEvent
			});
		}
	};

	editEvent = event => {
		this.setState({
			showEditView: true,
			newEvent: event
		});
	};

	handleQuickAddRender = ({ bounds }) => {
		// Called on render of the QuickAddPopover, avoid infinite loops
		if (this.state.quickAddBounds && shallowEqual(this.state.quickAddBounds, bounds)) {
			return;
		}

		this.setState({
			quickAddBounds: bounds
		});
	};

	handleAppointmentSave = appointment => {
		appointment.new ? this.handleCreateAppointment(appointment) : this.handleEditAppointment(appointment);

		this.handleCloseAddEvent();
	};

	handleEditAppointment = appointment => {
		this.props.modifyAppointment(appointment);
		// @TODO show errors
	};

	handleCreateAppointment = appointment => {
		this.props.createAppointment({
			name: '(No title)',
			...appointment
		}).catch( () => {
			this.props.notify({
				message: <Text id="calendar.editModal.notifications.problemInCreating" />,
				action: {
					label: <Text id="calendar.editModal.notifications.tryAgain" />,
					fn: () => {
						this.handleCreateNewEvent();
					}
				}
			});
		} );
	};

	handleCancelAdd = () => {
		this.clearNewEvent();
	};

	handleNavigate = payload => {
		this.clearNewEvent();
		this.props.setDate(payload);
	};

	handleSetView = view => {
		const viewPref = VIEW_TO_PREF[view];
		if (viewPref) {
			this.clearNewEvent();
			this.props.setView(viewPref);
		}
	};

	handleQuickAddMoreDetails = event => {
		this.setState({
			newEvent: event,
			showEditView: true
		});
	};

	handleBeginSelectEvent = () => {
		this.clearNewEvent();
	}

	constructor(props) {
		super(props);

		// BigCalendar passes through only whitelisted props, we can circumvent
		// to pass through components bound to component methods. You could
		// also e.g. rebind on render if necessary.
		this.BIG_CALENDAR_COMPONENTS = {
			toolbar: withProps({
				openModal: this.openModal,
				setView: this.handleSetView
			})(CalendarToolbar),
			dateHeader: CalendarDateHeader,
			eventWrapper: CalendarEventWrapper,
			event: withProps({
				view: props.view,
				onEdit: this.editEvent
			})(CalendarEvent)
		};
		this.MODALS = {
			createCalendar: {
				Component: CreateCalendarModal,
				props: () => ({
					calendarsData: this.props.calendarsData,
					refetchCalendars: this.props.calendarsData.refetch
				})
			},
			createSharedCalendar: {
				Component: CreateSharedCalendarModal,
				props: () => ({
					validateNewSharedCalendar: sharedCalendar =>
						!some(
							this.props.calendarsData.calendars,
							({ name }) =>
								name.toLowerCase() === sharedCalendar.name.toLowerCase()
						),
					onRefetchCalendars: this.props.calendarsData.refetch,
					providerName:
						this.props.accountInfoData.accountInfo &&
						this.props.accountInfoData.accountInfo.publicURL &&
						this.props.accountInfoData.accountInfo.publicURL.split(
							/http:\/\/|https:\/\//
						)[1]
				})
			},
			eventDetails: {
				Component: CalendarEventDetailsModal
			},
			importCalendarModal: {
				Component: ImportCalendarModal,
				props: () => ({
					onRefetchCalendars: this.props.calendarsData.refetch
				})
			},
			exportCalendarModal: {
				Component: ExportCalendarModal,
				props: () => ({})
			}
		};
	}

	componentWillReceiveProps({ view }) {
		if (view !== this.props.view) {
			this.BIG_CALENDAR_COMPONENTS.event = withProps({ view })(CalendarEvent);
		}
	}

	render(
		{ view, date, calendarsData, pending, matchesScreenMd },
		{ newEvent, quickAddBounds, activeModal, activeModalProps, showEditView }
	) {
		if (!view) {
			return null;
		}

		const checkedCalendars =
			calendarsData && calendarsData.calendars
				? calendarsData.calendars.filter(calendar =>
					hasFlag(calendar, 'checked')
				)
				: [];
		const appointments = flatMap(
			checkedCalendars,
			c =>
				c.appointments
					? c.appointments.appointments.map(appointment => ({
						...appointment,
						parentFolderName: c.name,
						color: colorForCalendar(c)
					}))
					: []
		);
		const savedEvents = flatMap(
			appointments,
			appointment =>
				appointment.instances
					? appointment.instances.map(instance => ({
						...appointment,
						date: new Date(instance.start)
					}))
					: {
						...appointment,
						date: new Date(appointment.date)
					}
		).map(event => ({
			...event,
			start: event.date,
			end: addMilliseconds(event.date, event.duration)
		}));
		const events = newEvent ? [...savedEvents, newEvent] : savedEvents;

		const modal = cloneDeep(find(this.MODALS, (_, key) => key === activeModal));
		if (modal) {
			const modalProps = modal.props ? modal.props() : {};
			// Enable modals to set custom onClose, onSubmit handlers, but
			// pipe into our modal visibility state handler.
			modalProps.onAction = modalProps.onAction
				? flow(modalProps.onAction, this.closeActiveModal)
				: this.closeActiveModal;
			modalProps.onClose = modalProps.onClose
				? flow(modalProps.onClose, this.closeActiveModal)
				: this.closeActiveModal;
			modal.props = modalProps;
		}

		return (
			<div
				class={cx(
					style.calendar,
					pending && style.loading,
					style[view + 'View']
				)}
			>
				<CalendarSidebar
					view={view}
					date={date}
					calendarsAndAppointmentsData={calendarsData}
					accountInfoData={this.props.accountInfoData}
					onNavigate={this.handleNavigate}
					onCreateNew={this.handleCreateNewEvent}
					openModal={this.openModal}
					matchesScreenMd={matchesScreenMd}
				/>
				{ showEditView ? (
					<AppointmentEditEvent
						className={style.calendarInner}
						event={newEvent}
						onAction={this.handleAppointmentSave}
						onClose={this.handleCloseAddEvent}
						preferencesData={this.props.preferencesData}
						accountInfoData={this.props.accountInfoData}
						{...activeModalProps}
					/>
				) : (<div className={style.calendarWrapper}>
					<BigCalendar
						className={style.calendarInner}
						formats={FORMATS}
						components={this.BIG_CALENDAR_COMPONENTS}
						views={VIEWS}
						elementProps={{ className: style.calendarInner }}
						eventPropGetter={getEventProps}
						slotPropGetter={this.getSlotProps}
						view={view}
						date={date}
						events={events.filter(isParticipatingInEvent)}
						titleAccessor="name"
						allDayAccessor="allDay"
						// @TODO: scrollToTime happens on any re-render of Big Calendar
						// which causes various issues with manipulation and is disabled
						// until a fix is available.
						// scrollToTime={isToday(date) ? new Date() : null}
						popup={false}
						selectable
						onNavigate={this.handleNavigate}
						onView={this.handleSetView}
						onSelectSlot={this.selectSlot}
						onSelectEvent={this.selectEvent}
						onDoubleClickEvent={this.editEvent}
					/>
					<CalendarRightbar class={style.rightbar} />
					<CalendarSectionToolbar
						date={date}
						onCreateNewEvent={this.handleCreateNewEvent}
						onNavigate={this.handleNavigate}
					/>
				</div>)
				}

				{newEvent && quickAddBounds && !showEditView && (
					<QuickAddEventPopover
						event={newEvent}
						onSubmit={this.handleCreateAppointment}
						onAddMoreDetails={this.handleQuickAddMoreDetails}
						onClose={this.handleCancelAdd}
						style={{
							left: quickAddBounds.left + quickAddBounds.width / 2,
							top: quickAddBounds.top
						}}
					/>
				)}
				{modal && (
					<modal.Component
						{...modal.props}
						{...activeModalProps}
						onClose={this.closeActiveModal}
					/>
				)}
			</div>
		);
	}
}
