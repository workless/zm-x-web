import { h } from 'preact';
import { Icon, Button } from '@zimbra/blocks';
import { Localizer, Text } from 'preact-i18n';
import MouseTooltip from '../mouse-tooltip';
import format from 'date-fns/format';
import style from './style';
import cx from 'classnames';

export default function CalendarEventTooltip({ event, onPrint, onDelete, onEdit, onClose, ...props }) {
	return (
		<MouseTooltip {...props} class={cx(style.eventTooltip, props.class)}>
			<Localizer>
				<button
					class={style.close}
					aria-label={<Text id="buttons.close" />}
					onClick={onClose}
				>
					<Icon name="close" />
				</button>
			</Localizer>
			<h2>{event.name}</h2>
			{event.location && <div class={style.location}>at {event.location}</div>}
			<time>{`${format(new Date(event.start), 'ddd, MMM DD, hh:mm A')} - ${format(new Date(event.end), 'hh:mm A')}`}</time>
			{<Icon size="sm" name={`fa:bell${event.alarm ? '' : '-slash'}`} />}

			<hr />

			<ul class={style.tags}>
				<li>{'{{Tags?}}'}</li>
			</ul>

			<ul class={style.flags}>
				<li>
					<Icon size="sm" name="fa:refresh" />
					{'{{Repeats?}}'}
				</li>
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
		</MouseTooltip>
	);
}
