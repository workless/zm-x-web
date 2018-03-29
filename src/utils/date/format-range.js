import moment from 'moment';

const DAY_FORMATS = {
	short: 'LT',
	long: 'ddd[,] MMM D LT'
};

/**
 * Format two dates with context around how to format each part
 * of the range.
 */
export function formatDayRange(start, end, formats = DAY_FORMATS) {
	const s = moment(start);
	const e = moment(end);

	if (s.isSame(end, 'day')) {
		return `${s.format(formats.long)} - ${e.format(formats.short)}`;
	}

	return `${s.format(formats.long)} - ${e.format(formats.long)}`;
}
