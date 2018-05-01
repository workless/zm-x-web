import { h, Component, cloneElement } from 'preact';
import s from './style';
import cx from 'classnames';
import Portal from 'preact-portal';
import Icon from '../icon';
import { Manager, Reference, Popper } from 'react-popper';
import ClickOutsideDetector from '../click-outside-detector';
import { callWith } from '@zimbra/util/src/call-with';

export default class Popover extends Component {
	static defaultProps = {
		anchor: 'start',
		onDropdownClick: () => {},
		corners: 'all',
		placement: 'bottom',
		boundariesElement: 'window',
		useMouseDownEvents: false,
		classes: {}
	};

	state = { active: this.props.active || false }

	/**
	 * After closing the Popover, if props.focusAfterClosing is truthy, re-focus the Popover button
	 */
	focusAfterToggle = () => {
		!this.state.active && this.props.focusAfterClosing && this.buttonRef.focus();
	};

	/**
	 * Open or close the Popover
	 */
	togglePopover = () => {
		const active = !this.state.active;

		this.setState({ active }, this.focusAfterToggle);
		this.props.onToggle && this.props.onToggle(active);
	};

	/**
	 * close the Popover when clicked outside
	 */
	closePopover = () => {
		if (this.state.active) {
			this.setState({ active: false }, this.focusAfterToggle);
			this.props.onToggle && this.props.onToggle(false);
		}
	}

	openPopover = () => {
		if (!this.state.active) {
			this.setState({ active: true }, this.focusAfterToggle);
			this.props.onToggle && this.props.onToggle(true);
		}
	}

	handleMouseEnterTarget = () => {
		this.hoverTarget = true;
		this.handleMouseEnter();
	}

	handleMouseEnterChild = () => {
		this.hoverChild = true;
		this.handleMouseEnter();
	}

	// Hovering over target will open its popover after a waiting period if it isn't already open
	// If an active timer to close a popover is running, it will clear it
	handleMouseEnter = () => {
		if (this.timer) {
			clearTimeout(this.timer);
			delete this.timer;
		}
		if (!this.state.active) {
			this.timer = setTimeout(() => (this.hoverTarget || this.hoverChild) && this.openPopover(), this.props.hoverDuration);
		}
	}

	handleMouseLeaveTarget = () => {
		this.hoverTarget = false;
		this.handleMouseLeave();
	}

	handleMouseLeaveChild = () => {
		this.hoverChild = false;
		this.handleMouseLeave();
	}

	handleMouseLeave = () => {
		if (this.timer) {
			clearTimeout(this.timer);
			delete this.timer;
		}
		if (this.state.active) {
			this.timer = setTimeout(() => !(this.hoverTarget || this.hoverChild) && this.closePopover(), this.props.hoverDuration);
		}
	}

	// Rather than support 4 props for classes, just use one classes object:
	getClasses = () => {
		let { popoverClass, toggleClass, titleClass, containerClass, classes } = this.props;
		return { popoverClass, toggleClass, titleClass, containerClass, ...classes };
	}

	/**
	 * set our own ref for the button/target, and tell react-popper about it as well by calling its callback function
	 */
	chainReferences = (refFn, c) => refFn(this.buttonRef = c);

	componentWillReceiveProps({ active }) {
		typeof active === 'boolean' && this.props.active !== active && this.setState({ active }, this.focusAfterToggle);
	}

	renderReference = ({ ref }) => {
		let handler = this.props.useMouseDownEvents ? { onMouseDown: this.togglePopover } : { onClick: this.togglePopover };
		let { disabled, icon, iconPosition, target, text, tooltip, hoverDuration } = this.props;
		let classes = this.getClasses();

		if (typeof icon==='string') {
			icon = <Icon name={icon} />;
		}

		return (
			<div
				ref={callWith(this.chainReferences, ref, true)}
				role="button"
				aria-haspopup="true"
				aria-expanded={String(Boolean(this.state.active))}
				class={cx(classes.toggleClass, s.button)}
				{...handler}
				onMouseEnter={hoverDuration && this.handleMouseEnterTarget}
				onMouseLeave={hoverDuration && this.handleMouseLeaveTarget}

				disabled={disabled}
				title={tooltip}
			>
				{ iconPosition==='left' && icon }
				{ text && <span class={cx(s.title, classes.titleClass)}>{text}</span> }
				{ target }
				{ iconPosition!=='left' && icon }
			</div>
		);
	}

	render({
		placement,
		boundariesElement,
		children,
		classes,
		disabled,
		hoverDuration,
		popoverClass,
		toggleClass,
		titleClass,
		containerClass,
		icon,
		iconPosition,
		text,
		target,
		arrow,
		anchor,
		corners,
		tooltip,
		href,
		onDropdownClick,
		useMouseDownEvents,
		...props
	}, {
		active
	}) {
		delete props.onToggle;
		delete props.active;

		classes = this.getClasses();

		if (anchor === 'center') anchor=false;

		return (
			<Manager>
				<div {...props} class={cx(s['popover-container'], classes.containerClass, props.class)}>
					<Reference>
						{this.renderReference}
					</Reference>
					{active &&
							<ActivePopper arrow={arrow}
								classes={classes}
								onDropdownClick={onDropdownClick}
								onMouseEnter={hoverDuration && this.handleMouseEnterChild}
								onMouseLeave={hoverDuration && this.handleMouseLeaveChild}
								onClickOutside={this.closePopover}
								placement={placement} anchor={anchor}
								boundariesElement={boundariesElement}
							>
								{children}
							</ActivePopper>
					}
				</div>
			</Manager>
		);
	}
}

class ActivePopper extends Component {

	// Pass the scheduleUpdate function that the Popper component gives to its first child if it is a function, to each
	// child, so any given child can kick tell popper to reposition itself
	renderPopper =  ({ ref, style, placement, scheduleUpdate, arrowProps }) => {
		let { arrow, children, classes, onDropdownClick, onMouseEnter, onMouseLeave } = this.props;

		let newArrowProps, borderArrowProps;

		if (arrow) {
			//To avoid "snapping" as the popover is repositioned after the css classes are applied, apply margins in
			//inline styles for popover and arrow
			let inversePlacement = placement === 'left' ? 'right' : placement === 'right' ? 'left' : placement === 'top' ? 'bottom' : 'top';
			style = { ...style, [`margin-${inversePlacement}`]: '13px' };

			let arrowMargins = placement === 'left' || placement === 'right' ? ['6.5px 0', '6px 0']  : ['0 6.5px', '0 6px'];

			newArrowProps = {
				...arrowProps,
				style: { ...(arrowProps.style),  margin: arrowMargins[0] }
			};
			borderArrowProps = {
				...arrowProps,
				style: { ...(arrowProps.style),  margin: arrowMargins[1] }
			};

		}


		return (
			<div arrow={!!arrow} ref={ref} style={style} data-placement={placement} class={cx(s.popper, classes.popoverClass)}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
			>
				{children && children.length &&
					<div onClick={onDropdownClick}>
						{children.map(c => c ? cloneElement(c, { scheduleUpdate }) : c)}
					</div>
				}
				{ arrow &&
					 <div {...borderArrowProps} class={s.borderArrow} />
				}
				{ arrow &&
					<div {...newArrowProps} class={s.arrow} />
				}
			</div>
		);
	}

	render({ arrow, placement, anchor, boundariesElement, onClickOutside }) {
		return (
			<Portal into="body">
				<ClickOutsideDetector onClickOutside={onClickOutside}>
					<Popper arrow={arrow} placement={`${placement}${anchor ? `-${anchor}` : ''}`}
						modifiers={{
							preventOverflow: {
								boundariesElement
							}
						}}
					>
						{this.renderPopper}
					</Popper>
				</ClickOutsideDetector>
			</Portal>
		);
	}
}
