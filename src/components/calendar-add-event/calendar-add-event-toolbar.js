import { h } from 'preact';

import Toolbar from '../toolbar';
import CalendarAddEventAction from './calendar-add-event-action';
import s from './style.less';

export default function CalendarAddEventToolbar({ onSave, onCancel, isMobileActive, ...props }) {
	return isMobileActive ? (<Toolbar>
		<CalendarAddEventAction class={s.toolbarAction} onSave={onSave} onCancel={onCancel} {...props} />
	</Toolbar>) : (<CalendarAddEventAction class={s.footer} onSave={onSave} onCancel={onCancel} {...props} />);
}
