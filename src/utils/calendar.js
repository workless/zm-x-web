import format from 'date-fns/format';
import differenceInDays from 'date-fns/difference_in_days';
import startOfDay from 'date-fns/start_of_day';
import isSameWeek from 'date-fns/is_same_week';
import isSameMonth from 'date-fns/is_same_month';
import isSameYear from 'date-fns/is_same_year';

import { CALENDAR_TYPE } from '../constants/calendars';

export function calendarDateFormat(date, formats = {
	sameDay: '[Today]',
	nextDay: '[Tomorrow]',
	nextWeek: 'dddd',
	lastDay: '[Yesterday]',
	lastWeek: '[Last] dddd',
	sameElse: 'DD/MM/YYYY'
}) {
	const now = Date.now();
	const diff = differenceInDays(startOfDay(date), startOfDay(now));

	// Logic from moment...
	const formatStr =
		diff < -6 && isSameMonth(date, now) ? formats.sameMonth :
			diff < -6 && isSameYear(date, now) ? formats.sameYear :
				diff < -6 ? formats.sameElse :
					diff < -1 && isSameWeek(date, now) ? formats.sameWeek :
						diff < -1 ? formats.lastWeek :
							diff < 0  ? formats.lastDay  :
								diff < 1  ? formats.sameDay  :
									diff < 2  ? formats.nextDay  :
										diff < 7  ? formats.nextWeek : formats.sameElse;

	return format(date, formatStr || formats.sameElse);
}

// Is this a holiday calendar?
export const isHolidayCalendar = (calendar) =>
	!calendar.owner && (
		calendar.name && /holiday/i.test(calendar.name) ||
		calendar.url && /holiday/i.test(calendar.url.test)
	);

// Is this a calendar owned by the user?
export const isOwnCalendar = (calendar) =>
	!calendar.owner && !isHolidayCalendar(calendar);

// Is this an external calendar that has been linked
// with this user?
export const isOtherCalendar = (calendar) =>
	calendar.owner && !isOwnCalendar(calendar);

export const calendarType = (calendar) =>
	isOtherCalendar(calendar)
		? CALENDAR_TYPE.other
		: isOwnCalendar(calendar)
			? CALENDAR_TYPE.own
			: isHolidayCalendar(calendar)
				? CALENDAR_TYPE.holiday
				: null;