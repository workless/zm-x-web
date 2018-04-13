import { h } from 'preact';
import { capitalizeFirstLetter } from '../../lib/util';
import get from 'lodash-es/get';
import array from '@zimbra/util/src/array';

// @TODO use <Text /> pluralization
const FREQS = {
	SEC: ['seconds', 'secondly'],
	MIN: ['minutes', 'minutely'],
	HOU: ['hours', 'hourly'],
	DAI: ['days', 'daily'],
	WEE: ['weeks', 'weekly'],
	MON: ['months', 'monthly'],
	YEA: ['years', 'yearly']
};

const DAYS = {
	MO: 'Monday',
	TU: 'Tuesday',
	WE: 'Wednesday',
	TH: 'Thursday',
	FR: 'Friday',
	SA: 'Saturday',
	SU: 'Sunday'
};

export default function Recurrence({ recurrence, ...props }) {
	return <span {...props}>{getFrequency(recurrence)}</span>;
}

function getFrequency(recurrence) {
	let freq = FREQS[getRecurrenceField(recurrence, 'frequency')],
		days = array(getRecurrenceField(recurrence, 'byday.0.wkday')).map(({ day }) => day),
		interval = getRecurrenceField(recurrence, 'interval.0.intervalCount');

	if (!freq) { return; }

	freq = interval===1 ? freq[1] : `Every ${interval ? `${interval} ` : ''}${interval ? freq[0] : freq[0].slice(0, -1)}`;

	if (days.join(',')==='MO,TU,WE,TH,FR') {
		freq = 'Every weekday.';
	}
	else if (days.length) {
		freq += ' on ' + days.map((day) => DAYS[day] || day).join(', ') + '.';
	}

	return capitalizeFirstLetter(freq);
}

/**
 * Recurrence can look like { freq: "WEE", byday: ["MO", "TU"], interval: 1 } or if there are exceptions to the recurence, like
 * { add: { [ {freq: "WEE", byday: ["MO", "TU"], interval: [1] ] }, exclude: [ "20170601T140000Z", { dtval: ["20171123T100000", tz: "America/New_York"} ] },
 */
function getRecurrenceField(recurrence, field) {
	return get(recurrence, `add.0.rule.0.${field}`);
}
