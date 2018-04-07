import { h } from 'preact';
import { Icon } from '@zimbra/blocks';
import MouseTooltip from '../mouse-tooltip';
import style from './style';
import cx from 'classnames';

export default function CalendarEventTooltip({ event, onPrint, onDelete, onEdit, onClose, ...props }) {
	return (
		<MouseTooltip {...props} class={cx(style.eventTooltip, props.class)}>
			<button onClick={onClose}>X</button>
			<h2>Title</h2>
			<div>at Location</div>
			<time>{(new Date('2018-04-01')).toLocaleString()}</time>
			{<Icon size="xs" name={`fa:bell${event.alarm ? '' : '-slash'}`} />}

			<hr />

			<ul>
				<li>Tags</li>
				<li>Occurrances</li>
			</ul>

			<p>
				Notes note notes...
			</p>

			<div>
				<button onClick={onEdit}>Edit</button>
				<button onClick={onPrint}>Print</button>
				<button onClick={onDelete}>Delete</button>
			</div>
		</MouseTooltip>
	);
}
