import { h, Component } from 'preact';
import format from 'date-fns/format';
import { STATUS_BUSY, STATUS_FREE, VIEW_MONTH } from './constants';
import { CalendarEventDetailsTooltip } from './event-details';
import cx from 'classnames';
import withMediaQuery from '../../enhancers/with-media-query';
import { minWidth, screenMd } from '../../constants/breakpoints';
import { hexToRgb } from '../../lib/util';

import style from './style';

function styledGradientBackground(color, freeBusy) {
	if (!(freeBusy === 'T' || freeBusy === 'F')) { return {}; }

	const rgb = hexToRgb(color);
	const rgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, .6)`;

	return {
		backgroundColor: rgba,
		backgroundImage: `linear-gradient(
			-45deg,
			${color} 25%,
			transparent 25%,
			transparent 50%,
			${color} 50%,
			${color} 75%,
			transparent 75%,
			transparent
		)`,
		backgroundSize: freeBusy === 'F' ? '40px 40px' : `10px 10px`
	};
}

export function getEventProps(event, start, end, isSelected) {
	return {
		className: cx(
			style.event,
			isSelected && style.isSelected,
			event.alarm && style.hasAlarm,
			event.freeBusy === STATUS_BUSY
				? style.isBusy
				: event.freeBusy === STATUS_FREE ? style.isFree : null,
			event.new && style.quickAdd
		),
		style: {
			backgroundColor: event.color,
			...styledGradientBackground(event.color, event.freeBusy)
		}
	};
}

// Reverse RBC's adjustment factors to get back to a non-overlapping column layout for events.
function getAdjustedSize(cssStyle) {
	let width = parseInt(cssStyle.width, 10);
	let left = parseInt(cssStyle.left, 10);
	// single events are unaffected:
	if (!width || width === 100) return cssStyle;
	// reverse built-in RBC adjustment factors:
	width -= width * 0.3;
	left += left * 0.3;
	// round sizes to the nearest edge:
	let box = 100 / Math.round(100 / width);
	width = Math.round(width / box) * box;
	left = Math.round(left / box) * box;
	cssStyle.width = `${width | 0}%`;
	cssStyle.left = `${left | 0}%`;
	return cssStyle;
}

export function CalendarEventWrapper(props) {
	let child = props.children[0];
	if (child && child.props && child.props.style) {
		getAdjustedSize(child.props.style);
	}
	return child;
}

@withMediaQuery(minWidth(screenMd), 'matchesScreenMd')
class SavedCalendarEvent extends Component {
	state = {
		hoverOrigin: false
	}

	handleMouseEnter = ({ clientX, clientY }) => {
		this.setState({
			hoverOrigin: {
				x: clientX,
				y: clientY
			}
		});
	}

	handleMouseMove = ({ clientX, clientY }) => {
		if (!this.state.hoverOrigin || !this.base) { return; }

		const hoveredElement = document.elementFromPoint(clientX, clientY);
		if (!this.base.contains(hoveredElement)) {
			this.setState({ hoverOrigin: false });
		}
	}

	componentWillMount() {
		document.addEventListener('mousemove', this.handleMouseMove);
	}

	componentWillUnmount() {
		document.removeEventListener('mousemove', this.handleMouseMove);
	}

	render({ view, title, event, matchesScreenMd }, { hoverOrigin }) {
		const start = event.date;
		return (
			<div class={style.eventInner} onMouseEnter={matchesScreenMd && this.handleMouseEnter}>
				{view === VIEW_MONTH && !event.allDay && (
					<time title={start}>
						{format(start, 'h:mm A').replace(':00', '')}
					</time>
				)}
				{title}

				{hoverOrigin && (
					<CalendarEventDetailsTooltip origin={hoverOrigin} event={event} />
				)}
			</div>
		);
	}
}

export default class QuickAddEvent extends Component {
	update = () => {
		this.props.event.onRender({
			bounds: this.base.getBoundingClientRect()
		});
	};

	componentDidMount() {
		this.update();
	}

	componentDidUpdate() {
		this.update();
	}

	render() {
		return (
			<div class={cx(style.eventInner, style.quickAddEvent)}>
				(No title)
			</div>
		);
	}
}

export function CalendarEvent(props) {
	return props.event.new ? (
		<QuickAddEvent {...props} />
	) : (
		<SavedCalendarEvent {...props} />
	);
}
