import { h, Component } from 'preact';
import { Icon, Spinner, Button } from '@zimbra/blocks';
import { Text } from 'preact-i18n';
import { callWith } from '../../../lib/util';
import format from 'date-fns/format';
import get from 'lodash/get';
import isSameDay from 'date-fns/is_same_day';
import style from './style';
import cx from 'classnames';
import { graphql } from 'react-apollo';
import Recurrence from '../../recurrence';
import MessageQuery from '../../../graphql/queries/message.graphql';

@graphql(MessageQuery, {
	name: 'appointmentData',
	options: ({ event: { inviteId } }) => ({ variables: { id: inviteId } })
})
export default class CalendarEventDetails extends Component {
	render({ event, appointmentData, onPrint, onDelete, onEdit, ...props }) {
		const inviteComponent = get(appointmentData, 'message.invitations.0.components.0');
		const excerpt = get(inviteComponent, 'excerpt');
		const recurrence = get(inviteComponent, 'recurrence.0');
		const startDate = new Date(event.start);
		const endDate = new Date(event.end);
		const dateFormatLeftHandSide = format(startDate, 'ddd, MMM DD, hh:mm A');
		const dateFormatRightHandSide = format(endDate, `${isSameDay(startDate, endDate) ? '' : 'ddd, MMM DD, '}hh:mm A`);

		return (
			<div {...props} class={cx(style.eventDetails, props.class)}>
				<h2>{event.name}</h2>

				{event.location && (

					<div class={style.location}>
						<Text id="prepositions.at" />
						&nbsp;
						{event.location}
					</div>
				)}

				<div class={style.time}>
					<time>
						{`${dateFormatLeftHandSide} - ${dateFormatRightHandSide}`}
					</time>
					{<Icon size="xs" name={`fa:bell${event.alarm ? '' : '-slash'}`} />}
				</div>

				{!event.isOrganizer && event.organizer && event.organizer.address && (
					<div class={style.organizer}>
						<Text id="calendar.eventFields.organizer" />
						{': '}
						{event.organizer.address}
					</div>
				)}
				<hr />

				<ul class={style.parentCalendar}>
					<li>
						<span role="img" style={`background-color: ${event.color}`} />
						{event.parentFolderName}
					</li>
				</ul>

				<ul class={style.flags}>
					{event.isRecurring && (
						<li>
							<Icon size="sm" name="fa:refresh" />
							<Text id="calendar.repeats" />
							&nbsp;
							<Recurrence recurrence={recurrence} />
						</li>
					)}
					{event.class === 'PRI' && (
						<li>
							<Icon size="sm" name="fa:lock" />
							<Text id="buttons.private" />
						</li>
					)}
				</ul>

				{appointmentData.loading ? (
					<Spinner class={style.spinner} block />
				) : excerpt && (
					<p>
						{excerpt}
					</p>
				)}

				<Button onClick={callWith(onEdit, event)}>
					<Text id="buttons.edit" />
				</Button>
				<Button onClick={callWith(onPrint, event)}>
					<Text id="buttons.print" />
				</Button>
				<Button onClick={callWith(onDelete, event)}>
					<Text id="buttons.delete" />
				</Button>
			</div>
		);
	}
}
