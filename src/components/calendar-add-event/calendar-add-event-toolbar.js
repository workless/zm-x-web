import { h } from 'preact';

import Toolbar from '../toolbar';
import CalendarAddEventAction from './calendar-add-event-action';
import s from './style.less';

export default function CalendarAddEventToolbar({ isMobileActive, ...props }) {
	const c = <CalendarAddEventAction class={isMobileActive ? s.toolbarAction : s.footer}  {...props} />;
	return isMobileActive ? <Toolbar>{c}</Toolbar> : c;
}
