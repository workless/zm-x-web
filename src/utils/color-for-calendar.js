import COLORS from '../constants/colors';

export default function colorForCalendar(calendar) {
	return COLORS[calendar.color || 0];
}
