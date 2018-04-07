import { h, Component } from 'preact';
import { FixedDialog } from '@zimbra/blocks';

export default class MouseTooltip extends Component {
	static defaultProps = {
		origin: {
			x: 0,
			y: 0
		},
		transformOrigin: {
			x: 0,
			y: 144
		}
	}

	render({ origin, transformOrigin, ...props }) {
		return typeof origin.x !== 'undefined' && typeof origin.y !== 'undefined' && (
			<div {...props} style={`position: fixed; top: ${origin.y - transformOrigin.y}px; left: ${origin.x - transformOrigin.x}px; z-index: 100;`} />
		);
	}
}

