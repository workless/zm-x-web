import { h } from 'preact';
import startOfMonth from 'date-fns/start_of_month';
import isSameWeek from 'date-fns/is_same_week';
import endOfMonth from 'date-fns/end_of_month';
import format from 'date-fns/format';
import style from './style';
import cx from 'classnames';


export default function DateHeader({ label, date, isOffRange, onDrillDown }) {
	let isFirstRow = isSameWeek(date, startOfMonth(date)) || isOffRange && isSameWeek(date, endOfMonth(date));
	return (
		<span class={cx(style.dateHeader, isOffRange && style.isOffRange)} onClick={onDrillDown}>
			{ isFirstRow && <strong>{format(date, 'ddd')}</strong> }
			{ label|0 }
		</span>
	);
}