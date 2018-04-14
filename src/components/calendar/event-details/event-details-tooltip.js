import { h, Component } from 'preact';
import CloseButton from '../../close-button';
import CalendarEventDetails from './event-details';
import MouseTooltip from '../../mouse-tooltip';
import style from './style';
import cx from 'classnames';

export default class CalendarEventDetailsTooltip extends Component {
	handleClickClose = (e) => {
		e.stopPropagation();
		this.props.onClose && this.props.onClose(e);
	}

	render({ origin, onClose, ...props }) {
		return (
			<MouseTooltip origin={origin} class={cx(style.eventTooltip, props.class)}>
				<CloseButton class={style.close} onClick={this.handleClickClose} />

				<CalendarEventDetails {...props} />
			</MouseTooltip>
		);
	}
}
