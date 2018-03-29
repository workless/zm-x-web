import { h } from 'preact';
import { callWith } from '../../lib/util';
import isToday from 'date-fns/is_today';
import format from 'date-fns/format';

import Toolbar from '../toolbar';
import ToolbarSidebarButton from '../toolbar/sidebar-button';
import ToolbarActionButton from '../toolbar/action-button';
import ActionButton from '../action-button';
import ToolbarTitle from '../toolbar/title';

import s from './style.less';

export default function CalendarSectionToolbar({
	date,
	onCreateNewEvent,
	onNavigate
}) {
	return (
		<Toolbar>
			<ToolbarSidebarButton className={s.actionButton} />
			<ToolbarTitle text="calendar.title" />
			<div class={s.actionButtons}>
				<ActionButton
					className={s.todayButton}
					monotone
					onClick={callWith(onNavigate, new Date())}
					icon="calendar-o"
					disabled={isToday(date)}
				>
					<span class={s.date}>
						{format(date, 'D')}
					</span>
				</ActionButton>
				<ToolbarActionButton icon="search" />
				<ToolbarActionButton
					onClick={onCreateNewEvent}
					icon="plus"
					className={s.composeButton}
				/>
			</div>
		</Toolbar>
	);
}
