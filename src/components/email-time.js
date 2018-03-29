import { h } from 'preact';
import format from 'date-fns/format';

const DAY = 24 * 60 * 60 * 1000;
const formatTime = date => format(date, 'h:mm A');
const formatDate = date => format(date, 'YYYY-MM-DD');
const formatDateThisYear = date => format(date, 'MMM D');

export function emailTime(date) {
	let now = new Date(),
		nowDay = formatDate(now),
		time = formatTime(date),
		day = formatDate(date);
	if (nowDay===day || (now.getTime() - date.getTime()) < DAY) return time;
	if (now.getFullYear()===date.getFullYear()) return formatDateThisYear(date);
	return formatDate(date);
}

export default function EmailTime({ time, ...props }) {
	let date = new Date(time);
	return <time {...props} title={date}>{emailTime(date)}</time>;
}
