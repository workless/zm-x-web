import { h, Component } from 'preact';
import { callWith, toGroups } from '../../../lib/util';
import { Select, Option } from '@zimbra/blocks';
import NakedButton from '../../naked-button';
import ActionButton from '../../action-button';
import isToday from 'date-fns/is_today';
import isSameDay from 'date-fns/is_same_day';
import isSameWeek from 'date-fns/is_same_week';
import isSameMonth from 'date-fns/is_same_month';
import isSameYear from 'date-fns/is_same_year';
import startOfWeek from 'date-fns/start_of_week';
import startOfMonth from 'date-fns/start_of_month';
import startOfYear from 'date-fns/start_of_year';
import setMonth from 'date-fns/set_month';
import addDays from 'date-fns/add_days';
import addMonths from 'date-fns/add_months';
import addYears from 'date-fns/add_years';
import eachDay from 'date-fns/each_day';
import format from 'date-fns/format';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { VIEW_MONTH, VIEW_YEAR, VIEW_YEARS } from '../constants';
import cx from 'classnames';
import style from './style';

const toWeeks = toGroups(7);

const getMiniCalViewForCalendarView = calendarView =>
	VIEW_MAPPING[calendarView] || VIEW_MAPPING.default;

// Move by 1 year when paging in the years view
const YEARS_VIEW_PAGE_SIZE = 1;

const VIEW_MAPPING = {
	default: VIEW_MONTH,
	[VIEW_MONTH]: VIEW_YEAR,
	[VIEW_YEAR]: VIEW_YEARS
};

const VIEWS = {
	[VIEW_MONTH]: () => MonthView,
	[VIEW_YEAR]: () => YearView,
	[VIEW_YEARS]: () => YearsView
};

const dayOfWeek = gql`
	query DayOfWeek {
		preferences {
			zimbraPrefCalendarFirstDayOfWeek
		}
	}
`;

export default class MiniCal extends Component {
	state = {
		displayDate: this.props.date || new Date()
	};

	getView = () => {
		let { view, calendarView } = this.props;
		return view || getMiniCalViewForCalendarView(calendarView);
	};

	navigate = (date, displayOnly = false, dateInput = false) => {
		if (date === 'TODAY') {
			this.setState({ displayDate: this.props.date });
			this.props.onNavigate(new Date());
		}
		else if (date === 'NEXT' || date === 'PREV') {
			let view = getMiniCalViewForCalendarView(this.props.calendarView),
				offset =
					(date === 'NEXT' ? 1 : -1) *
					(view === VIEW_YEARS
						? 12 * YEARS_VIEW_PAGE_SIZE
						: view === VIEW_YEAR ? 12 : 1),
				displayDate = addMonths(startOfMonth(this.state.displayDate), offset);
			this.setState({ displayDate });
			//navigate the big calendar only on Years view with NEXT/PREV
			this.getView() === VIEW_YEARS && this.props.onNavigate(displayDate);
			dateInput && this.props.onNavigate(displayDate);
		}
		else if (displayOnly) {
			this.setState({ displayDate: date });
		}
		else {
			this.props.onNavigate(date);
		}
	};

	componentWillReceiveProps({ view, date }) {
		if (view !== this.props.view) {
			// if the view changed, go back to showing current.
			this.setState({ displayDate: date });
		}
		else if (
			String(date) !== String(this.props.date) &&
			String(date) !== String(this.state.displayDate)
		) {
			// if the main calendar date changes, follow it.
			this.setState({ displayDate: date });
		}
	}

	render(
		{ date, view, calendarView, onNavigate, dateInput, ...props },
		{ displayDate }
	) {
		view = this.getView();
		let CalendarView = VIEWS[view](displayDate);
		let childProps = {
			view,
			date,
			displayDate,
			onNavigate: this.navigate
		};
		return (
			<div
				{...props}
				class={cx(
					style.minical,
					props.class,
					style['fullCalendarView_' + calendarView]
				)}
			>
				<MiniCalHeader {...childProps} dateInput={dateInput} />
				<CalendarView {...childProps} />
			</div>
		);
	}
}

class MiniCalHeader extends Component {
	go = date => () => {
		this.props.onNavigate(date, false, this.props.dateInput);
	};
	next = this.go('NEXT');
	prev = this.go('PREV');

	selectDate = ({ value }) => {
		this.props.onNavigate(new Date(value), this.props.view !== VIEW_YEARS);
	};

	render({ view, displayDate }) {
		let isYears = /^year/.test(view),
			titleFormat = isYears ? 'YYYY' : 'MMM YYYY',
			range = isYears ? 4 : 5,
			items = [];
		for (let offset = -range; offset <= range; offset++) {
			let d = (isYears ? addYears : addMonths)(displayDate, offset);
			items.push(<Option value={String(d)} title={format(d, titleFormat)} />);
		}
		return (
			<header class={style.header}>
				<ActionButton
					class={style.prev}
					monotone
					icon="angle-left"
					onClick={this.prev}
				/>
				<ActionButton
					class={style.next}
					monotone
					icon="angle-right"
					onClick={this.next}
				/>
				<Select
					class={style.picker}
					iconPosition="none"
					toggleButtonClass={style.button}
					value={String(displayDate)}
					onChange={this.selectDate}
					anchor="right"
					displayValue={format(displayDate, titleFormat)}
				>
					{items}
				</Select>
			</header>
		);
	}
}

@graphql(dayOfWeek, {
	props: ({ data: { loading, preferences } }) => ({ loading, preferences })
})
class MonthView extends Component {
	renderDayName = date => (
		<span class={cx(style.day, style.dayName)}>{format(date, 'dd')[0]}</span>
	);

	renderDay = date => (
		<NakedButton
			class={cx(
				style.day,
				isToday(date) && style.today,
				isSameDay(date, this.props.date) && style.current,
				!isSameMonth(date, this.props.displayDate) && style.outsideOfMonth
			)}
			onClick={callWith(this.props.onNavigate, date)}
			title={format(date, 'MMMM D, YYYY')}
		>
			{date.getDate()}
		</NakedButton>
	);

	renderWeek = days => (
		<div
			class={cx(
				style.week,
				isSameWeek(days[0], this.props.date) && style.current
			)}
		>
			{days.map(this.renderDay)}
		</div>
	);

	render({ displayDate, preferences }) {
		let start = startOfWeek(startOfMonth(displayDate), {
				weekStartsOn: preferences
					? parseInt(preferences.zimbraPrefCalendarFirstDayOfWeek, 10)
					: 0
			}),
			end = addDays(start, 41), //always show an even 6 weeks so the height of the minical doesn't jumpt around
			dates = eachDay(start, end),
			weeks = dates.reduce(toWeeks, []);

		return (
			<div class={style.monthView}>
				<div class={cx(style.week, style.dayNames)}>
					{weeks[0].map(this.renderDayName)}
				</div>
				{weeks.map(this.renderWeek)}
			</div>
		);
	}
}

class YearView extends Component {
	renderMonth = date => (
		<NakedButton
			class={cx(
				style.month,
				isSameMonth(date, new Date()) && style.today,
				isSameMonth(date, this.props.date) && style.current
			)}
			onClick={callWith(this.props.onNavigate, date)}
			title={format(date, 'MMMM, YYYY')}
		>
			{format(date, 'MMM')}
		</NakedButton>
	);

	render({ displayDate }) {
		let start = startOfYear(displayDate);
		let months = [];
		for (let month = 0; month < 12; month++) {
			months.push(setMonth(start, month));
		}

		return <div class={style.yearView}>{months.map(this.renderMonth)}</div>;
	}
}

class YearsView extends Component {
	renderYear = date => (
		<NakedButton
			class={cx(
				style.year,
				isSameYear(date, new Date()) && style.today,
				isSameYear(date, this.props.date) && style.current
			)}
			onClick={callWith(this.props.onNavigate, date)}
			title={date.getFullYear()}
		>
			{date.getFullYear()}
		</NakedButton>
	);

	render({ displayDate }) {
		let start = startOfYear(displayDate);
		let years = [];
		for (let offset = -4; offset <= 4; offset++) {
			years.push(addYears(start, offset));
		}

		return <div class={style.yearsView}>{years.map(this.renderYear)}</div>;
	}
}
