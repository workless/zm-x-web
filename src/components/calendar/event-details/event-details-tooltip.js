import { h, Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import { Icon } from '@zimbra/blocks';
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
				<Localizer>
					<button
						class={style.close}
						aria-label={<Text id="buttons.close" />}
						onClick={this.handleClickClose}
					>
						<Icon name="close" />
					</button>
				</Localizer>

				<CalendarEventDetails {...props} />
			</MouseTooltip>
		);
	}
}
