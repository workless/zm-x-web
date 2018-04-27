import { graphql, compose } from 'react-apollo';
import moment from 'moment';
import get from 'lodash-es/get';

import withAccountInfo from '../../graphql-decorators/account-info';
import { getPrimaryAccountName, getPrimaryAccountAddress } from '../../utils/account';
import CalendarsAndAppointmentsQuery from '../../graphql/queries/calendar/calendars-and-appointments.graphql';
import AppointmentDeleteMutation from '../../graphql/queries/calendar/appointment-delete.graphql';
import AppointmentCreateMutation from '../../graphql/queries/calendar/appointment-create.graphql';
import AppointmentModifyMutation from '../../graphql/queries/calendar/appointment-modify.graphql';
import MessageQuery from '../../graphql/queries/message.graphql';

import htmlInviteEmail from '../../components/calendar/emails/html-invite-email';
import plainTextInviteEmail from '../../components/calendar/emails/plain-text-invite-email';

import { USER_FOLDER_IDS } from '../../constants';

function zimbraFormat(date, allDay) {
	return moment.utc(date).format(allDay ? 'YYYYMMDD' : 'YYYYMMDD[T]HHmmss[Z]');
}

function inviteEmailMailParts(options) {
	return [
		{
			contentType: 'text/plain',
			content: plainTextInviteEmail(options)
		},
		{
			contentType: 'text/html',
			content: htmlInviteEmail(options)
		}
	];
}

function createAppointmentMutationVariables({
	inviteId,
	folderId,
	modifiedSequence,
	revision,
	name,
	location,
	start,
	end,
	alarms,
	recurrence,
	freeBusy,
	allDay,
	isPrivate,
	notes,
	attachments,
	attendees = [],
	accountInfoData
}) {
	const account = accountInfoData.accountInfo.identities.identity[0]._attrs;
	const organizer = {
		address: account.zimbraPrefFromAddress,
		name: account.zimbraPrefFromDisplay
	};
	const startVal = { date: zimbraFormat(start, allDay) };
	const endVal = allDay ? null : { date: zimbraFormat(end, allDay) };
	const classType = isPrivate ? 'PRI' : 'PUB';
	const attendeesVal = attendees.map(e => ({
		role: e.role,
		participationStatus: 'NE',
		rsvp: true,
		address: e.address,
		name: e.name
	}));

	//fields only set when modifying an appointment
	let modifyFields = !inviteId ? {} : {
		id: inviteId,
		modifiedSequence,
		revision
	};

	let description = !notes  ? {} : {
		mimeParts: {
			contentType: 'multipart/alternative',
			mimeParts: inviteEmailMailParts({
				organizer,
				start,
				end,
				attendees: attendeesVal,
				subject: name,
				body: notes
			})
		}
	};

	return {
		appointment: {
			...modifyFields,
			message: {
				folderId: folderId || String(USER_FOLDER_IDS.CALENDAR),
				subject: name,
				invitations: {
					components: [
						{
							name,
							location,
							alarms,
							recurrence,
							freeBusy,
							allDay,
							class: classType,
							organizer,
							start: startVal,
							end: endVal,
							attendees: attendeesVal
						}
					]
				},
				emailAddresses: attendees.map(e => ({
					address: e.address,
					name: e.name,
					type: 't'
				})),
				...description,
				...(attachments && attachments.length ? {
					attach: {
						aid: attachments.join(',')
					}
				} : {})
			}
		}
	};
}

export function withAppointmentData() {
	return graphql(MessageQuery, {
		name: 'appointmentData',
		skip: props => !get(props, 'event.inviteId'),
		options: ({ event: { inviteId } }) => ({ variables: { id: inviteId } })
	});
}

export function withCreateAppointment() {
	return compose(
		withAccountInfo(({ data: { accountInfo } }) => ({
			userDisplayName: accountInfo && getPrimaryAccountName(accountInfo),
			primaryAddress: accountInfo && getPrimaryAccountAddress(accountInfo)
		})),
		graphql(AppointmentCreateMutation, {
			props: ({ ownProps: { accountInfoData }, mutate }) => ({
				createAppointment: (createAppointmentInput) => {
					let mutationVariables = createAppointmentMutationVariables({
						...createAppointmentInput,
						accountInfoData
					});

					return mutate({
						variables: mutationVariables,
						// @TODO optimistic update?
						refetchQueries: [{
							query: CalendarsAndAppointmentsQuery
						}]
					});
				}
			})
		})
	);
}

export function withModifyAppointment() {
	return compose(
		withAccountInfo(({ data: { accountInfo } }) => ({
			userDisplayName: accountInfo && getPrimaryAccountName(accountInfo),
			primaryAddress: accountInfo && getPrimaryAccountAddress(accountInfo)
		})),
		withAppointmentData(),
		graphql(AppointmentModifyMutation, {
			props: ({ ownProps: { accountInfoData }, mutate }) => ({
				modifyAppointment: (modifyAppointmentInput) => {
					let mutationVariables = createAppointmentMutationVariables({
						...modifyAppointmentInput,
						accountInfoData
					});

					return mutate({
						variables: mutationVariables,
						// @TODO optimistic update?
						refetchQueries: [{
							query: CalendarsAndAppointmentsQuery
						}]
					});
				}
			})
		})
	);
}

export function withDeleteAppointment() {
	return graphql(AppointmentDeleteMutation, {
		props: ({ mutate }) => ({
			deleteAppointment: inviteId =>
				mutate({
					variables: { inviteId },
					// @TODO optimistic update?
					refetchQueries: [{
						query: CalendarsAndAppointmentsQuery
					}]
				})
		})
	});
}
