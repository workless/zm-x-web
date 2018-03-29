import { h, Component } from 'preact';

import Header from './header';
import IndicatorTable from './indicator-table';

import { graphql } from 'react-apollo';
import FreeBusyQuery from '../../graphql/queries/calendar/free-busy.graphql';
import AccountInfoQuery from '../../graphql/queries/preferences/account-info.graphql';
import { callWith } from '../../lib/util';
import {
	merge as mergeFreeBusy
} from '../../utils/free-busy';

import moment from 'moment';
import toPairs from 'lodash/toPairs';
import flatMap from 'lodash/flatMap';
import map from 'lodash/map';
import concat from 'lodash/concat';
import find from 'lodash/find';
import filter from 'lodash/filter';
import cloneDeep from 'lodash/cloneDeep';
import isString from 'lodash/isString';

import s from './style.less';
import { ATTENDEE_ROLE } from '../../constants/calendars';

const freeBusyQueryVariables = ({ accountInfoData, attendees, event }) => ({
	names: concat(
		[accountInfoData.accountInfo.address],
		attendees
			.filter(attendee => !isString(attendee))
			.map(({ address }) => address),
	),
	start: moment(event.start).startOf('day').valueOf(),
	end: moment(event.start).endOf('day').valueOf()
});

@graphql(AccountInfoQuery, {
	props: ({ data: { accountInfo, ...rest } }) => {
		const {
			zimbraPrefFromDisplay: name,
			zimbraPrefFromAddress: address
		} = accountInfo.identities.identity[0]._attrs;
		return {
			accountInfoData: {
				accountInfo: { address, name },
				...rest
			}
		};
	}
})
@graphql(FreeBusyQuery, {
	skip: ({ accountInfoData }) =>
		!accountInfoData || accountInfoData.loading || accountInfoData.error,
	options: (props) => ({
		variables: freeBusyQueryVariables(props),
		// FIXME: with default fetchPolicy, query resolves with the same data
		// even when variables change.
		fetchPolicy: 'network-only'
	}),
	props: ({
		ownProps: { attendees, accountInfoData },
		data: { freeBusy = [], ...rest }
	}) => {
		let userFreeBusy = freeBusy.map(({ id, ...statuses }) => {
			let statusInstances = flatMap(toPairs(statuses),
				([status, events]) => map(events, ({ start, end }) => ({
					status,
					start,
					end
				}))
			);

			// Remove any empty instances caused by null values created during
			// normalization, chronologically sort of statuses
			statusInstances = statusInstances
				.filter(inst => inst && inst.start && inst.end)
				.sort((instA, instB) => instA.start - instB.start);

			let attendee = find(attendees, ({ address }) => address === id);

			if (!attendee && id === accountInfoData.accountInfo.address) {
				// Create an attendee entry for the current user, as it's missing
				// from the array.
				attendee = {
					...accountInfoData.accountInfo,
					role: ATTENDEE_ROLE.required
				};
			}
			return {
				attendee,
				disableRequiredToggle: attendee.address === accountInfoData.accountInfo.address,
				statuses: filter(statusInstances, inst => inst && inst.start && inst.end),
				isRequired: !attendee || attendee.role === ATTENDEE_ROLE.required
			};
		});

		if (!userFreeBusy.length) {
			// When freeBusy query has not resolved, fallback to using the raw attendee list
			// tobuild an empty table and prevent a scroll jump once the real data resolves.
			userFreeBusy = concat([accountInfoData.accountInfo], attendees).map((attendee) => ({
				attendee,
				disableRequiredToggle: attendee.address === accountInfoData.accountInfo.address,
				statuses: [],
				isRequired: true
			}));
		}

		// Create a mock attendee entry that represents the merged statuses of all
		// attendees.
		const allFreeBusy = {
			attendee: { name: 'All Invitees' },
			disableRequiredToggle: true,
			statuses: mergeFreeBusy(userFreeBusy.map(({ statuses }) => statuses)),
			isRequired: true
		};
		return {
			freeBusyData: {
				...rest,
				freeBusy: concat(
					[allFreeBusy],
					userFreeBusy
				)
			}
		};
	}
})
export default class AvailabilityIndicator extends Component {

	onDayChange = (dayModifier) => {
		const availabilityDate = (
			moment(this.props.event.start)
				.add(dayModifier, 'days')
				.valueOf()
		);

		this.props.onStartChange(availabilityDate);
	}

	handleRefresh = () =>
		this.props.freeBusyData.refetch(freeBusyQueryVariables(this.props))

	onChangeIsRequired = (attendee, newRole) => {
		const attendees = cloneDeep(this.props.attendees);
		const attendeeIdx = this.props.attendees
			.findIndex((a) => a.address === attendee.address);
		if (attendeeIdx !== -1) {
			const updatedAttendee = {
				...attendees[attendeeIdx],
				role: newRole
			};
			attendees[attendeeIdx] = updatedAttendee;
			this.props.onAttendeesChange({ value: attendees });
		}
	}

	render ({
		event,
		freeBusyData
	}) {
		return (
			<div class={s.availabilityIndicator}>
				<Header
					onNextDay={callWith(this.onDayChange, 1)}
					onPrevDay={callWith(this.onDayChange, -1)}
					onRefresh={this.handleRefresh}
					onClose={this.props.onClose}
					value={freeBusyData.variables.start}
				/>
				<IndicatorTable
					onChangeIsRequired={this.onChangeIsRequired}
					event={event}
					freeBusy={freeBusyData.freeBusy}
				/>
			</div>
		);
	}
}
