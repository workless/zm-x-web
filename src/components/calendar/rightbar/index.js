import { h } from 'preact';
import cx from 'classnames';
import Tasks from '../../tasks';
import style from './style';

export default function CalendarRightbar(props) {
	return (
		<div class={cx(style.rightbar, props.class)}>
			<Tasks />
		</div>
	);
}
