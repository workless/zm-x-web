import moment from 'moment';

export default function inviteDate(start, end) {
	return `${moment(start).format('LLLL')} - ${moment(end).format('LLLL')}`;
}
