import { h, Component } from 'preact';
import cx from 'classnames';
import style from './style';

const PLACEMENTS = {
	top: 'left: 0; bottom: 100%;',
	left: 'right: 100%; top: 0;',
	bottom: 'left: 0; top: 100%;',
	right: 'left: 100%; top: 0;'
};

// The side of the parent container to which this Tooltip will anchor itself.
const ANCHORS = {
	right: 'right: 0; left: auto',
	left: 'right: auto; left: 0;'
};

const VALID_PLACEMENTS = Object.keys(PLACEMENTS);
const VALID_ANCHORS = Object.keys(ANCHORS);

/**
 * Render one container next to another container
 */
export default class Tooltip extends Component {
	render({ position, anchor, visible, children, ...containerProps }) {
		if (process.env.NODE_ENV !== 'production') {
			if (position && VALID_PLACEMENTS.indexOf(position) < 0) {
				throw new Error('<Tooltip> Err: Invalid value for prop "position"');
			}

			if (anchor && VALID_ANCHORS.indexOf(anchor) < 0) {
				throw new Error('<Tooltip> Err: Invalid value for prop "anchor"');
			}
		}

		let {
			style: containerStyle = '',
			class: containerClass = '',
			...props
		} = containerProps;

		const placement = typeof position !== 'undefined' && PLACEMENTS[position];
		const placementAnchor = typeof anchor !== 'undefined' && ANCHORS[anchor];
		const positionStyles = `${placement || ''}${placementAnchor || ''}${containerStyle || ''}`;

		return (
			<div
				style={positionStyles}
				class={cx(style.tooltip, containerClass)}
				{...props}
			>
				{children}
			</div>
		);
	}
}
