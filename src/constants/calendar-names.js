import mapValues from 'lodash-es/mapValues';
import feeds from './calendar-feeds';

export default mapValues(
	feeds,
	(v, k) => `calendar.sidebar.holidayCalendars.${k}`
);
