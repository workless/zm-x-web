import { h, Component } from 'preact';
import format from 'date-fns/format';
import { STATUS_BUSY, STATUS_FREE, VIEW_MONTH } from './constants';
import { connect } from 'preact-redux';
import cx from 'classnames';
import { hexToRgb } from '../../lib/util';

import style from './style';

import debounce from 'lodash-es/debounce';
import pick from 'lodash-es/pick';
class MouseTooltip extends Component {
	static defaultProps = {
		transformOrigin: {
			x: 0,
			y: 144
		}
	}
	handleMouseMove = debounce((e) => {
		this.setState(pick(e, [ 'clientX', 'clientY' ]));
	}, 50)

	componentWillMount() {
		document.addEventListener('mousemove', this.handleMouseMove);
	}
	componentWillUnmount() {
		document.removeEventListener('mousemove', this.handleMouseMove);
	}

	render({ transformOrigin, ...props }, { clientX, clientY }) {
		return (
			<div {...props} style={`position: fixed; top: ${clientY - transformOrigin.y}px; left: ${clientX - transformOrigin.x}px`} />
		);
	}
}

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

class SavedCalendarEvent extends Component {
	state = {
		hover: false
	}

	handleMouseLeave = (e) => {
		this.setState({ hover: false });
	}

	handleMouseEnter = (e) => {
		this.setState({ hover: true });
	}

	handleMouseMove = (e) => {
		//move the tooltip - optimizeME
	}


	render({ view, title, event }, { hover }) {
		const start = event.date;
		return (
			<div class={style.eventInner} onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
				{view === VIEW_MONTH &&
					!event.allDay && (
					<time title={start}>
						{format(start, 'h:mm A').replace(':00', '')}
					</time>
				)}
				{title}

				{hover && <MouseTooltip>Hovered</MouseTooltip>}
			</div>
		);
	};
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

export const CalendarEvent = connect(({ calendar }) => ({
	view: calendar && calendar.view
}))(
	props =>
		props.event.new ? (
			<QuickAddEvent {...props} />
		) : (
			<SavedCalendarEvent {...props} />
		)
);
