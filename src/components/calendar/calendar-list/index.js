import { h, Component } from 'preact';
import { connect } from 'preact-redux';
import { Icon } from '@zimbra/blocks';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import find from 'lodash/find';
import differenceWith from 'lodash/differenceWith';
import differenceBy from 'lodash/differenceBy';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import { callWith } from '../../../lib/util';

import HolidayCalendarModal from '../holiday-calendar-modal';
import CalendarListItem from './item';
import CalendarListSection from './section';
import ContextMenu from '../../context-menu';
import {
	OtherCalendarsSectionContextMenu
} from '../../context-menus';

import CalendarChangeColorMutation from '../../../graphql/queries/calendar/calendar-change-color.graphql';
import CalendarsQuery from '../../../graphql/queries/calendar/calendars.graphql';
import CalendarCheckMutation from '../../../graphql/queries/calendar/calendar-check.graphql';
import { FolderActionMutation } from '../../../graphql/queries/folders/folders.graphql';
import SendShareNotificationMutation from '../../../graphql/queries/shares/send-notification.graphql';
import { notify } from '../../../store/notifications/actions';
import { hasFlag } from '../../../utils/folders';
import {
	calendarType as getCalendarType
} from '../../../utils/calendar';
import {
	CALENDAR_TYPE,
	CALENDAR_LIST_ORDER,
	ZIMBRA_GRANT_IDS
} from '../../../constants/calendars';
import style from './style';
import { USER_FOLDER_IDS } from '../../../constants';

class CalendarList extends Component {
	state = {
		createCalendarModalOpen: false,
		holidayCalendarModalOpen: false,
		error: { visible: false, message: '', source: '' }
	};

	toggleCreateCalendarModal = () => {
		this.setState({
			createCalendarModalOpen: !this.state.createCalendarModalOpen
		});
	};

	toggleHolidayCalendarModal = () => {
		this.setState({
			holidayCalendarModalOpen: !this.state.holidayCalendarModalOpen
		});
	};

	handleUpdateACL = (calendar, nextACL) => {
		const { folderAction, sendShareNotification } = this.props;
		const prevACL = calendar.acl || { grant: [] };
		const addGrants = differenceWith(nextACL.grant, prevACL.grant, isEqual);
		const removeGrants = differenceBy(
			differenceWith(prevACL.grant, nextACL.grant, isEqual),
			addGrants,
			'zimbraId'
		);

		return Promise.all([
			...addGrants.map(grant =>
				folderAction({
					op: 'grant',
					id: calendar.id,
					grant
				}).then(
					res =>
						grant.address
							? sendShareNotification({
								item: { id: calendar.id },
								address: { address: grant.address }
							})
							: res
				)
			),
			...removeGrants.map(grant =>
				folderAction({
					op: '!grant',
					id: calendar.id,
					zimbraId: grant.zimbraId || ZIMBRA_GRANT_IDS[grant.granteeType]
				})
			)
		]).then(() => this.props.calendarsAndAppointmentsData.refetch());
	};


	renderSectionActionContent = ({ openContextMenu }) => (
		<Icon
			class={style.sectionActionButton}
			name="cog"
			size="sm"
			onClick={openContextMenu}
		/>
	)

	renderSectionAction = (sectionType) => () => {
		if (CALENDAR_TYPE.own === sectionType) {
			return (
				<div onClick={callWith(this.props.openModal, 'createCalendar')}>
					<Icon class={style.sectionActionButton} name="plus" size="sm" />
				</div>
			);
		}
		if (CALENDAR_TYPE.holiday === sectionType) {
			return (
				<div onClick={this.toggleHolidayCalendarModal}>
					<Icon class={style.sectionActionButton} name="plus" size="sm" />
					{this.state.holidayCalendarModalOpen && (
						<HolidayCalendarModal
							onClose={this.toggleHolidayCalendarModal}
							refetchCalendars={this.props.calendarsAndAppointmentsData.refetch}
							calendarsData={this.props.calendars}
						/>
					)}
				</div>
			);
		}
		if (CALENDAR_TYPE.other === sectionType) {
			return (
				<ContextMenu
					menu={<OtherCalendarsSectionContextMenu onAddFriendsCalendarClicked={callWith(this.props.openModal, 'createSharedCalendar')} />}
					render={this.renderSectionActionContent}
				/>
			);
		}
	}

	renderListItem = (calendar) => {
		const {
			openModal,
			checkCalendar,
			accountInfoData,
			changeCalendarColor,
			folderAction,
			calendarsAndAppointmentsData,
			notify: displayNotification
		} = this.props;
		return (
			<CalendarListItem
				calendar={calendar}
				checkCalendar={checkCalendar}
				changeCalendarColor={changeCalendarColor}
				onUpdateACL={this.handleUpdateACL}
				calendarsAndAppointmentsData={calendarsAndAppointmentsData}
				accountInfoData={accountInfoData}
				folderAction={folderAction}
				notify={displayNotification}
				openModal={openModal}
			/>
		);
	};

	render({ calendarSections, matchesScreenMd }) {
		return (
			<ul class={style.groupList}>
				{calendarSections.map(({ label, items, type }) => (
					<CalendarListSection
						type={type}
						items={items}
						label={label}
						renderAction={this.renderSectionAction(type)}
						renderItem={this.renderListItem}
						initialExpanded={type === CALENDAR_TYPE.own}
						matchesScreenMd={matchesScreenMd}
					/>
				))}
				{!matchesScreenMd &&
					<li class={style.item}>
						<a href="" class={style.itemInner}>Tasks</a>
					</li>
				}
			</ul>
		);
	}
}

export default compose(
	connect(({ email = {} }) => ({
		username: get(email, 'account.name')
	}), { notify }),
	graphql(CalendarsQuery, {
		props: ({ data: { calendars = [] } }) => {
			const calFolders = calendars.filter(cl => cl.id !== String(USER_FOLDER_IDS.TRASH));

			return {
				calendars: calFolders,
				calendarSections: calFolders.reduce(
					(sections, calendar) => {
						const sectionsIdx = CALENDAR_LIST_ORDER[getCalendarType(calendar)];
						sections[sectionsIdx || 0].items.push(calendar);
						return sections;
					},
					[
						{
							type: CALENDAR_TYPE.own,
							label: 'My Calendars',
							items: []
						},
						{
							type: CALENDAR_TYPE.holiday,
							label: 'Holidays',
							items: []
						},
						{
							type: CALENDAR_TYPE.other,
							label: 'Others',
							items: []
						}
					]
				)
			};
		}
	}),
	graphql(CalendarChangeColorMutation, {
		props: ({ ownProps: { calendarsAndAppointmentsData }, mutate }) => ({
			changeCalendarColor: (newId, newColor) => {
				mutate({
					variables: { id: newId, color: newColor }
				}).then(() => calendarsAndAppointmentsData.refetch());
			}
		})
	}),
	graphql(CalendarCheckMutation, {
		props: ({ ownProps: { calendarsAndAppointmentsData, calendars }, mutate }) => ({
			checkCalendar: id =>
				mutate({
					variables: {
						calendarId: id,
						value: !hasFlag(find(calendars, { id }), 'checked')
					}
				}).then(() => calendarsAndAppointmentsData.refetch())
		})
	}),
	graphql(FolderActionMutation, {
		props: ({ mutate }) => ({
			folderAction: action => {
				// Remove the apollo cache key, which is not a real attribute
				// and is a result of deep cloning. Would like to remove this
				// manual step in the future.
				if (action.grant && action.grant.__typename) {
					delete action.grant.__typename;
				}

				return mutate({ variables: { action } });
			}
		})
	}),
	graphql(SendShareNotificationMutation, {
		props: ({ mutate }) => ({
			sendShareNotification: shareNotification =>
				mutate({ variables: { shareNotification } })
		})
	})
)(CalendarList);
