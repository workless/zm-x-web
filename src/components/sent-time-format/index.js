import { h } from 'preact';
import { Text } from 'preact-i18n';
import format from 'date-fns/format';
import isToday from 'date-fns/is_today';
import isYesterday from 'date-fns/is_yesterday';
import isSameYear from 'date-fns/is_same_year';

const SentTimeFormat = ({ date }) => {
	date = date instanceof Date ? date : new Date(date);

	return isToday(date) ? (
		format(date, 'h:mm A')
	) : isYesterday(date) ? (
		<Text id="dates.yesterday" />
	) : isSameYear(new Date(), date) ? (
		format(date, 'MMM D')
	) : (
		format(date, 'MMM D, YYYY')
	);
};

export default SentTimeFormat;
