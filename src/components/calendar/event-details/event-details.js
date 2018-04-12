import { h, Component } from 'preact';
import { Icon, Spinner, Button } from '@zimbra/blocks';
import { Text } from 'preact-i18n';
import format from 'date-fns/format';
import get from 'lodash/get';
import style from './style';
import cx from 'classnames';
import { graphql } from 'react-apollo';
import MessageQuery from '../../../graphql/queries/message.graphql';

@graphql(MessageQuery, {
	name: 'appointmentData',
	options: ({ event: { inviteId } }) => ({ variables: { id: inviteId } })
})
export default class CalendarEventDetails extends Component {
	render({ event, appointmentData, onPrint, onDelete, onEdit, ...props }) {
		const inviteComponent = get(appointmentData, 'message.invitations.0.components.0');
		const excerpt = get(inviteComponent, 'excerpt');
		return (
			<div {...props} class={cx(style.eventDetails, props.class)}>
				<h2>{event.name}</h2>

				{event.location && (
					<div class={style.location}>at {event.location}</div>
				)}

				<div>
					<time>{`${format(new Date(event.start), 'ddd, MMM DD, hh:mm A')} - ${format(new Date(event.end), 'hh:mm A')}`}</time>
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
							<Text id="calendar.eventFields.recurring" />
						</li>
					)}
					{event.class === 'PRI' && (
						<li>
							<Icon size="sm" name="fa:lock" />
							<Text id="buttons.private" />
						</li>
					)}
				</ul>

				{excerpt.loading ? <Spinner block /> : excerpt && (
					<p>
						{excerpt}
					</p>
				)}

				<div>
					<Button onClick={onEdit}>Edit</Button>
					<Button onClick={onPrint}>Print</Button>
					<Button onClick={onDelete}>Delete</Button>
				</div>
			</div>
		);
	}
}
