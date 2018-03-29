import { h, Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { Icon } from '@zimbra/blocks';
import { connect } from 'preact-redux';
import withMediaQuery from '../../enhancers/with-media-query';
import { screenSmMax, minWidth } from '../../constants/breakpoints';
import style from './style';
import cx from 'classnames';

@connect(({ mediaMenu }) => ({ open: mediaMenu.visible }))
@withMediaQuery(minWidth(screenSmMax), 'matchesScreenMd')
export class MediaMenuButton extends Component {
	render({ open, ...props }) {
		return (
			<Localizer>
				<button
					{...props}
					title={<Text id={`mediaMenu.toggleButton.${open ? 'close' : 'open'}`} />}
					class={cx(style.icon, open && style.active, props.class)}
				>
					<Icon size="lg" name={`multimedia${open ? '-active' : ''}`} />
				</button>
			</Localizer>
		);
	}
}

