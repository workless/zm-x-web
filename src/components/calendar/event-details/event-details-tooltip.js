import { h } from 'preact';
import CalendarEventDetails from './event-details';
import MouseTooltip from '../../mouse-tooltip';
import style from './style';
import cx from 'classnames';

export default function CalendarEventDetailsTooltip({ origin, ...props }) {
	return (
		<MouseTooltip origin={origin} class={cx(style.eventTooltip, props.class)}>
			<CalendarEventDetails {...props} />
		</MouseTooltip>
	);
}
