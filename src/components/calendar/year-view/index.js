import { h, Component } from 'preact';
import BigCalendar from 'react-big-calendar';
import dates from 'react-big-calendar/lib/utils/dates';
import moment from 'moment';
import { callWith } from '../../../lib/util';
import NakedButton from '../../naked-button';
import startOfYear from 'date-fns/start_of_year';
import setMonth from 'date-fns/set_month';
import isToday from 'date-fns/is_today';
import isSameMonth from 'date-fns/is_same_month';
import isSameDay from 'date-fns/is_same_day';
import startOfWeek from 'date-fns/start_of_week';
import endOfWeek from 'date-fns/end_of_week';
import endOfMonth from 'date-fns/end_of_month';
import eachDay from 'date-fns/each_day';
import format from 'date-fns/format';
import { VIEW_MONTH } from '../constants';
import style from './style';
import cx from 'classnames';

export default class YearView extends Component {
	static title(date) {
		return moment(date).format('YYYY');
	}

	static navigate(date, action) {
		switch (action) {
			case BigCalendar.Navigate.PREVIOUS:
				return dates.add(date, -1, 'year');

			case BigCalendar.Navigate.NEXT:
				return dates.add(date, 1, 'year');

			default:
				return date;
		}
	}

	static range(date) {
		let start = dates.startOf(date, 'year'),
			end = dates.endOf(date, 'year');
		return { start, end };
	}

	navigate = date => {
		let { getDrilldownView, onView, onNavigate } = this.props;
		let view = (date && date.view) || getDrilldownView(date);
		onNavigate(null, (date && date.date) || date);
		onView(view);
	};

	renderMonth = start => (
		<Month start={start} date={this.props.date} onNavigate={this.navigate} />
	);

	render({ date }) {
		let start = startOfYear(date);
		let months = [];
		for (let month = 0; month < 12; month++) {
			months.push(setMonth(start, month));
		}

		return <div class={style.year}>{months.map(this.renderMonth)}</div>;
	}
}

class Month extends Component {
	renderDayName = date => (
		<span class={cx(style.day, style.dayName)}>{format(date, 'dd')[0]}</span>
	);

	renderDay = date => (
		<NakedButton
			class={cx(
				style.day,
				isToday(date) && style.today,
				isSameMonth(date, this.props.start)
					? isSameDay(date, this.props.date) && style.current
					: style.outsideOfMonth
			)}
			onClick={callWith(this.props.onNavigate, date)}
			title={format(date, 'MMMM D, YYYY')}
		>
			{date.getDate()}
		</NakedButton>
	);

	render({ start, onNavigate }) {
		let days = eachDay(startOfWeek(start), endOfWeek(endOfMonth(start)));

		return (
			<div class={style.month}>
				<h3
					class={style.heading}
					tabIndex="0"
					onClick={callWith(onNavigate, { view: VIEW_MONTH, date: start })}
				>
					{format(start, 'MMM YYYY')}
				</h3>
				{days.slice(0, 7).map(this.renderDayName)}
				{days.map(this.renderDay)}
			</div>
		);
	}
}
