import { h, Component } from 'preact';
import { ESCAPE } from '../constants/key-codes';

/**
 * Wraps a component and provides a manner to respond to clicks outside that component.
 */
export default class ClickOutsideDetector extends Component {
	handleKeyDown = e => {
		const { onClickOutside, disableEscape } = this.props;
		if (e.keyCode === ESCAPE && typeof onClickOutside === 'function' && !disableEscape) {
			onClickOutside(e);
		}
	}

	handleClick = e => {
		const { target } = e;
		const { onClickOutside } = this.props;
		if (typeof this.base !== 'undefined' && !this.base.contains(target) && typeof onClickOutside === 'function') {
			onClickOutside(e);
		}
	};

	handleBlur = e => {
		const { onClickOutside } = this.props;
		if (document &&
				document.activeElement &&
				document.activeElement.nodeName === 'IFRAME' &&
				!this.base.contains(document.activeElement) &&
				typeof onClickOutside === 'function') {
			onClickOutside(e);
		}
	}

	events = (onOrOff) => {
		const fn = onOrOff === true ? addEventListener : removeEventListener;
		fn('click', this.handleClick, true);
		fn('touchstart', this.handleClick, true);
		fn('keydown', this.handleKeyDown, true);
		fn('blur', this.handleBlur, true);
		fn('contextmenu', this.handleClick, true);
	}

	componentDidMount() {
		this.events(true);
	}

	componentWillUnmount() {
		this.events(false);
	}

	render({ children }) {
		return children[0] || null;
	}
}
