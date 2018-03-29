import { h, Component, cloneElement } from 'preact';
import linkref from 'linkref';
import getScrollParent from '@zimbra/util/src/get-scroll-parent';
import debounce from '@zimbra/util/src/debounce';
import position from 'dom-helpers/query/position';

/**
 * Affix/sticky position an element within a container.
 * @param {Object} props
 * @param {Number} [props.offsetTop=0]                The distance below the top
 *    of the container at which the affixed element should rest/become affixed.
 * @param {Number} [props.viewportOffsetBottom=0]     When the affixed element is
 *    locked in place, the offset from the bottom of the viewport in pixels.
 */

export default class AffixBottom extends Component {
	static defaultProps = {
		offsetTop: 0,
		viewportOffsetBottom: 0
	}

	state = {
		affixed: ''
	}

	onUpdate = () => {
		if (!this._isMounted) { return; }

		// If any of these HTMLElements are missing, calculations are not possible.
		const base = this.getChildBase(),
			container = this.getContainer(),
			scrollingAncestor =  getScrollParent(this.getContainer());

		if (!container || !base || !scrollingAncestor) {
			return;
		}

		const { offsetTop, viewportOffsetBottom } = this.props,
			{ affixed } = this.state,

			// Calculate needed dimensions of base, container, and scrollingAncestor
			{ top: containerOffsetTop } = position(container, scrollingAncestor),
			{ offsetHeight: containerHeight } = container,
			{ offsetHeight: scrollAncestorHeight, scrollTop } = scrollingAncestor,
			scrollBottom = scrollTop + scrollAncestorHeight,

			// Calculate top and bottom threshold
			topThreshold = Math.max(0, containerOffsetTop - scrollAncestorHeight + offsetTop),
			bottomThreshold = containerOffsetTop + containerHeight + viewportOffsetBottom,

			// Calculate strategy based on thresholds
			scrollViewportBelowChild = scrollBottom > bottomThreshold,

			//some browsers (Safari) let you scroll up more than the top if you pull down with the mouse/touch, yielding a negative scrollTop
			scrollViewportAboveChild = Math.max(0, scrollTop) < topThreshold;

		if (containerHeight < offsetTop) {
			// Do not affix elements smaller than offsetTop
			affixed && this.setState({ affixed: '' });
			return;
		}

		if (scrollViewportBelowChild)	{
			affixed && this.setState({ affixed: '' });
		}
		else if (scrollViewportAboveChild) {

			affixed !== 'top' && this.setState({ affixed: 'top' });
		}
		else {
			affixed !== 'bottom' && this.setState({ affixed: 'bottom' });
		}
	}

	handleResize = debounce(() => {
		this.setState({ affixed: '' }, this.onUpdate);
	}, 17) // 17ms = 60hz~

	handleScroll = this.onUpdate

	handleDocumentClick = () => {
		// A click has a good chance of causing a re-paint, so update after clicks.
		requestAnimationFrame(() => this.onUpdate());
	}

	getChildBase = () => this.refs && this.refs.child && ( this.refs.child.base || this.refs.child )
	getContainer = () => typeof this.props.container === 'function' ? this.props.container() : this.props.container

	getChildDimensions = () => {
		let child = this.getChildBase();
		return child && child.getBoundingClientRect();
	}

	componentDidMount() {
		this._isMounted = true;

		addEventListener('resize', this.handleResize);
		addEventListener('scroll', this.handleScroll, { capture: true, passive: true });
		document.addEventListener('click', this.handleDocumentClick);

		this.onUpdate();
	}


	componentWillReceiveProps() {
		this._needPositionUpdate = true;
	}

	componentDidUpdate() {
		if (this._needPositionUpdate) {
			this._needPositionUpdate = false;
			this.onUpdate();
		}
	}

	componentWillUnmount() {
		this._isMounted = false;

		removeEventListener('resize', this.handleResize);
		removeEventListener('scroll', this.handleScroll, { capture: true, passive: true });
		document.removeEventListener('click', this.handleDocumentClick);
	}

	render({ offsetTop, viewportOffsetBottom, children }, { affixed }) {
		const child = children && children[0],
			{ left, width, height } = this.getChildDimensions() || {},
			placeholderProps = affixed === 'bottom' ? { style: `height: ${height}px; width: ${width}px;` } : { style: 'display: none;' },
			childProps = { ref: linkref(this, 'child') },
			style = affixStyle({
				affixed,
				top: offsetTop,
				bottom: viewportOffsetBottom,
				width,
				left,
				extra: child && child.attributes && child.attributes.style
			});

		if (style) {
			childProps.style = style;
		}

		return child && (
			<div>
				{cloneElement(child, childProps)}
				<div {...placeholderProps} />
			</div>
		);
	}
}

function affixStyle({ affixed, top, bottom, width, left, extra }) {
	// Any styles passed in as `extra` are passed through and overridden
	extra = extra ? extra + '; ' : '';

	return extra + (
		affixed === 'top'
			? `left: 0; top: ${top}px; position: absolute; z-index: 1;`
			: affixed === 'bottom'
				? `width: ${width}px; left: ${left}px; position: fixed; bottom: ${bottom ? `${bottom}px` : '0'}; z-index: 1;`
				: ''
	);
}
