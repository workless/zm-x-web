import { h, Component } from 'preact';
import cx from 'classnames';
import style from './style';

const PLACEMENTS = {
	top: {
		left: '0',
		bottom: '100%'
	},
	left: {
		right: '100%',
		top: '0'
	},
	bottom: {
		left: '0',
		top: '100%'
	},
	right: {
		left: '100%',
		top: '0'
	}
};

// The side of the parent container to which this Tooltip will anchor itself. Use "right" to align the tooltip to the right side of the Parent container.
const ANCHORS = {
	right: {
		right: 0,
		left: 'auto'
	},
	left: {
		right: 'auto',
		left: 0
	}
};

const VALID_PLACEMENTS = Object.keys(PLACEMENTS);
const VALID_ANCHORS = Object.keys(ANCHORS);

/**
 * Render one container next to another container
 */
export default class Tooltip extends Component {

	/**
	 * Convert an object to an inline style string
	 * @param {Object[]} obj - Objects containing CSS rules, e.g. { top: '50px' }
	 * @returns {String}
	 */
	objectsToInlineStyle(objs) {
		objs = Array.isArray(objs) ? objs : [objs];

		return objs.reduce((memo, styles) => {
			if (!styles) { return memo; }

			Object.keys(styles).forEach((key) => {
				let value = styles[key];
				memo += `${key}: ${value};`;
			});
			return memo;
		}, '');
	}

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
			style: containerStyle = {},
			class: containerClass = '',
			...props
		} = containerProps;

		const placement = typeof position !== 'undefined' && PLACEMENTS[position];
		const placementAnchor = typeof anchor !== 'undefined' && ANCHORS[anchor];
		const positionStyles = typeof containerStyle === 'string'
			? this.objectsToInlineStyle([placement, placementAnchor]) + containerStyle
			: this.objectsToInlineStyle([placement, placementAnchor, containerStyle]);

		return visible ? (
			<div
				role="tooltip"
				style={positionStyles}
				class={cx(style.tooltip, containerClass)}
				{...props}
			>
				{children}
			</div>
		) : (
			null
		);
	}
}
