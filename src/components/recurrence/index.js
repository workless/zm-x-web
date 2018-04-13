import { h } from 'preact';
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
	let freq = FREQS[getRecurrenceField(recurrence, 'freq')],
		slots = array(getRecurrenceField(recurrence, 'byday')),
		interval = getRecurrenceField(recurrence, 'interval');

	freq = interval===1 ? freq[1] : `Every ${interval} ${freq[0]}`;

	if (slots.join(',')==='MO,TU,WE,TH,FR') {
		freq = 'Every weekday';
	}
	else {
		freq += ' on ' + slots.map(s => DAYS[s.day || s] || s).join(', ') + '.';
	}

	return freq;
}

/**
 * Recurrence can look like { freq: "WEE", byday: ["MO", "TU"], interval: 1 } or if there are exceptions to the recurence, like
 * { add: { [ {freq: "WEE", byday: ["MO", "TU"], interval: [1] ] }, exclude: [ "20170601T140000Z", { dtval: ["20171123T100000", tz: "America/New_York"} ] },
 */
function getRecurrenceField(recurrence, field) {
	return get(recurrence, field, get(recurrence, `add.0.${field}`));
}
