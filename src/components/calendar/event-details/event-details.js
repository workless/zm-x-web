import { h } from 'preact';
import { Icon, Button } from '@zimbra/blocks';
import { Text } from 'preact-i18n';
import format from 'date-fns/format';
import style from './style';
import cx from 'classnames';

export default function CalendarEventDetails({ event, onPrint, onDelete, onEdit, ...props }) {
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
				<li><span style={`background-color: ${event.color}`} /> {event.parentFolderName}</li>
			</ul>

			<ul class={style.flags}>
				{event.isRecurring && (
					<li>
						<Icon size="sm" name="fa:refresh" />
						Recurring
					</li>
				)}
				{event.class === 'PRI' && (
					<li>
						<Icon size="sm" name="fa:lock" />
						<Text id="buttons.private" />
					</li>
				)}
			</ul>

			<p>
				Notes note notes...
			</p>

			<div>
				<Button onClick={onEdit}>Edit</Button>
				<Button onClick={onPrint}>Print</Button>
				<Button onClick={onDelete}>Delete</Button>
			</div>
		</div>
	);
}
