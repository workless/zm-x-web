import { h } from 'preact';
import { Text } from 'preact-i18n';

import s from './style.less';

const CalendarSearchToolbar = ({ count, more, types }) => (
	<div class={s.toolbar}>
		<Text
			id="calendar.search.results"
			fields={{
				types,
				count: more ? `${count}+` : count
			}}
		/>
	</div>
);

export default CalendarSearchToolbar;
