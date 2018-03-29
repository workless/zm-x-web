/* eslint-disable react/no-string-refs */
import { h, Component } from 'preact';
import style from './style';
import cx from 'classnames';
import Portal from 'preact-portal';
import Icon from '../icon';
import { Manager, Target, Popper, Arrow } from 'react-popper';
import ClickOutsideDetector from '../click-outside-detector';
import linkRef from 'linkref';

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
		!this.state.active && this.props.focusAfterClosing && this.refs.button.focus();
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
		this.setState({ active: false }, this.focusAfterToggle);
		this.props.onToggle && this.props.onToggle(false);
	}

	componentWillReceiveProps({ active }) {
		typeof active === 'boolean' && this.props.active !== active && this.setState({ active }, this.focusAfterToggle);
	}

	render({
		placement,
		boundariesElement,
		children,
		classes,
		disabled,
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

		// Rather than support 4 props for classes, just use one classes object:
		classes = { popoverClass, toggleClass, titleClass, containerClass, ...classes };

		if (typeof icon==='string') {
			icon = <Icon name={icon} />;
		}
		let handler = useMouseDownEvents ? { onMouseDown: this.togglePopover } : { onClick: this.togglePopover };

		if (anchor === 'center') anchor=false;

		return (
			<div {...props} class={cx(style['popover-container'], classes.containerClass, props.class)}>
				<Manager>
					<Target>
						<div
							role='button'
							aria-haspopup="true"
							aria-expanded={String(Boolean(active))}
							class={cx(classes.toggleClass, style.button)}
							{...handler}
							ref={linkRef(this, 'button')}
							disabled={disabled}
							title={tooltip}
						>
							{ iconPosition==='left' && icon }
							{ text && <span class={cx(style.title, classes.titleClass)}>{text}</span> }
							{ target }
							{ iconPosition!=='left' && icon }
						</div>
					</Target>
					{active &&
						<Portal into="body">
							<ClickOutsideDetector onClickOutside={this.closePopover}>
								<Popper arrow={arrow} placement={`${placement}${anchor ? `-${anchor}` : ''}`} class={cx(style.popper, classes.popoverClass)} modifiers={{
									preventOverflow: {
										boundariesElement
									}
								}}
								>
									{ children && children.length && (
										<div
											onClick={onDropdownClick}
										>
											{children}
										</div>
									) }
									{arrow &&
										<Arrow class={style.borderArrow} />
									}
									{arrow &&
										<Arrow class={style.arrow} />
									}
								</Popper>
							</ClickOutsideDetector>
						</Portal>
					}
				</Manager>
			</div>
		);
	}
}
