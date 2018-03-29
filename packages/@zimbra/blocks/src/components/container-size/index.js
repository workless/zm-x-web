import { h, cloneElement, Component } from 'preact';
import cx from 'classnames';
import style from './style';

const STYLE = 'position: absolute; left: 0; top: -100%; width: 100%; height: 100%; margin: 1px 0 0; border: none; opacity: 0.0000001; z-index: -1; pointer-events: none;';

/** Measures its size and passes {width,height} as props to its child.
 *	@param {Object} props
 *	@param {Number|Boolean} [props.width]	Default width, or `false` to disable passing width to children.
 *	@param {Number|Boolean} [props.width]	Default height, or `false` to disable passing height to children.
 *	@param {Boolean} [props.defer=false]	If `true`, no initial size detection is performed on mount.
 *	@param {Function} [onBeforeResize]		Invoked prior to re-rendering in response to a resize. Gets passed a mutable `{ width, height }` object.
 */
export default class ContainerSize extends Component {

	state = {
		event: {
			width: this.props.width,
			height: this.props.height
		}
	};

	handleResize = () => {
		let target = this.base;
		if (!target) return;
		if (this.props.target!=='self' && target.parentNode) target = target.parentNode;
		let prev = this.state.event;
		let event = {
			width: target.clientWidth || target.offsetWidth,
			height: target.clientHeight || target.offsetHeight
		};
		if (this.props.excludePadding || this.props.padding===false) {
			let computed = getComputedStyle(target);
			event.width -= parseFloat(computed.paddingLeft) + parseFloat(computed.paddingRight);
			event.height -= parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom);
		}
		if (event.width!==prev.width || event.height!==prev.height) {
			if (this.props.onBeforeResize && this.props.onBeforeResize(event)===false) return;
			this.setState({ event });
		}
	};

	frameRef = frame => {
		if (!this.frame && frame && frame.contentWindow) frame.contentWindow.onresize = this.handleResize;
		this.frame = frame;
	};

	componentDidMount() {
		if (this.frame && this.frame.contentWindow) this.frame.contentWindow.onresize = this.handleResize;
		if (!this.props.defer) {
			//Won't know all CSS adjusted sizes until everything is loaded
			if (document.readyState !== 'complete') {
				window.addEventListener('load', this.handleResize);
			}
			//Fire an event now to get a "close enough" size
			this.handleResize();
		}
	}

	componentWillUnmount() {
		if (this.frame && this.frame.contentWindow) this.frame.contentWindow.onresize = null;
	}

	render({ component: Wrap, dimensions, defer, target, onBeforeResize, width, height, children, ...props }, { event }) {
		children = children && children.slice() || [];

		let params = {};
		if (dimensions!==false) {
			if (width!==false) params.width = event.width;
			if (height!==false) params.height = event.height;
		}
		for (let i=children.length; i--; ) {
			let child = children[i];
			if (typeof child==='function') {
				children[i] = child(params);
			}
			else if (child && typeof child==='object') {
				children[i] = cloneElement(child, params);
			}
		}

		Wrap = Wrap || 'div';
		return (
			<Wrap {...props} class={cx(style.containerSize, props.class)}>
				<iframe style={STYLE} ref={this.frameRef} />
				{children}
			</Wrap>
		);
	}
}
