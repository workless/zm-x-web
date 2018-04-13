/* eslint-disable react/no-string-refs */
import { h, Component, cloneElement } from 'preact';
import style from './style';
import cx from 'classnames';
import ToggleButtonText from './toggle-button-text';
import Icon from '../icon';
import ClickOutsideDetector from '../click-outside-detector';
import get from 'lodash-es/get';
import linkref from 'linkref';
import * as KEY_CODES from '../../constants/key-codes';
import createKeyBuffer from '@zimbra/util/src/create-key-buffer';
import isAlphanum from '@zimbra/util/src/is-alphanum';
import getListTextContent from '@zimbra/util/src/get-list-text-content';
import { withAriaId } from '@zimbra/a11y';

function getOptionId({ a11yId, index }) {
	return `${a11yId}-${index}`;
}

/**
 * <Select> defines a dropdown selection menu to choose options from.
 */
export class SelectBase extends Component {
	state = {
		focused: 0,
		value: this.props.value
	}

	static defaultProps = {
		iconPosition: 'left',
		icon: 'angle-down',
		anchor: 'left',
		typeahead: true
	};

	getSelectedIndex = (props) => {
		let { children } = props || this.props;
		let { value } = props || this.state;

		if (children && children.length) {
			for (let index = 0; index < children.length; ++index) {
				let child = children[index];

				if (child.attributes.value === value || (!value && index === 0)) {
					return index;
				}
			}
		}

		return 0;
	}

	/**
	 * Open or close the Select box
	 * @return {Boolean} false
	 */
	toggleNav = () => {
		let { active } = this.state,
			{ disabled } = this.props;

		if (!disabled || active) {
			this.setState({ active: !active, focused: this.getSelectedIndex() });
		}

		return false;
	};

	setFocus = (focused) => {
		this.setState({ focused });
	}

	bumpFocus = (n = 1) => {
		let children = this.refs.menu.childNodes;

		let focused = +this.state.focused + +n;
		focused = focused < 0
			? children.length - 1
			: focused >= children.length
				? 0
				: focused;

		this.setFocus(focused);
	}

	/**
	 * selectNavItem is the callback called when a item is selected
	 * @param  {Object} target the target the user interacted with
	 * @return {Boolean}    false
	 */
	selectNavItem = ( { index, value, title }) => {
		let { onChange } = this.props;
		// if no title, title is just the value:
		title = title || value;
		if (this.state.value!==value) {
			this.setState({ value, focused: index });
			if (onChange) onChange({ value, title });
		}
		if (this.state.active) {
			this.toggleNav();
		}
		return false;
	};

	selectChildByIndex = (index) => {
		this.selectNavItem({ index, ...get(this.props, `children.${index}.attributes`) });
	}

	keyBuffer = createKeyBuffer();

	handleTypeahead = (e, onMatch) => {
		if (!this.props.typeahead || !onMatch) { return; }
		const char = String.fromCharCode(e.keyCode);
		const inputStr = this.keyBuffer(char).join('').toLowerCase();
		const childTextContent = getListTextContent(this.base);
		for (let index=0; index<childTextContent.length; index++) {
			if (childTextContent.hasOwnProperty(index)) {
				const textContent = childTextContent[index].toLowerCase();
				if (textContent.indexOf(inputStr) === 0) {
					onMatch(index);
					return;
				}
			}
		}
	}

	handleButtonKeyDown = (e) => {
		let { active } = this.state;
		let preventDefault = true;

		if (!active) {
			if (e.keyCode === KEY_CODES.DOWN_ARROW || e.keyCode === KEY_CODES.SPACE_BAR) {
				this.toggleNav();
			}
			else {
				preventDefault = false;
				isAlphanum(e.keyCode) && this.handleTypeahead(e, this.selectChildByIndex);
			}
		}
		else if (e.keyCode === KEY_CODES.UP_ARROW) {
			this.bumpFocus(-1);
		}
		else if (e.keyCode === KEY_CODES.DOWN_ARROW) {
			this.bumpFocus(1);
		}
		else if (e.keyCode === KEY_CODES.CARRIAGE_RETURN || e.keyCode === KEY_CODES.SPACE_BAR) {
			this.selectChildByIndex(this.state.focused);
		}
		else if (e.keyCode === KEY_CODES.TAB) {
			if (e.shiftKey) {
				this.bumpFocus(-1);
			}
			else {
				this.bumpFocus(1);
			}
		}
		else if (e.keyCode === KEY_CODES.HOME) {
			this.setFocus(0);
		}
		else if (e.keyCode === KEY_CODES.END) {
			this.setFocus(this.props.children.length - 1);
		}
		else if (isAlphanum(e.keyCode)) {
			this.handleTypeahead(e, this.setFocus);
		}
		else {
			preventDefault = false;
		}
		preventDefault && e.preventDefault();
	}

	componentWillMount() {
		let selected = this.getSelectedIndex();
		if (this.state.focused !== selected) {
			this.setState({ focused: selected });
		}
	}

	componentWillReceiveProps(nextProps) {
		let { value } = nextProps;
		if (value !== this.state.value) {
			this.setState({ value, focused: this.getSelectedIndex(nextProps) });
		}
	}

	render({ children, onChange, displayValue, iconPosition, icon, anchor, disabled, forceOpen, a11yId, dropup = false, buttonIconClass, toggleButtonClass, ...props }, { value, active, focused }) {

		props.value && delete props.value; // remove props.value in favor of state.value
		icon = typeof icon === 'string' ? <Icon class={cx(style.buttonIcon, buttonIconClass)} name={icon} /> : icon;

		// Calculate the active title to display on the button.
		let selected = this.getSelectedIndex();
		let { title: childTitle, value: childValue } = get(children, `${selected}.attributes`) || {};
		let activeTitle = displayValue || childTitle || childValue || value;

		children = children && children.map((child, index) => (
			cloneElement(child, {
				selected: selected === index,
				focused: focused === index,
				index,
				a11yId,
				onMouseOver: this.setFocus,
				onChange: this.selectNavItem
			})
		));

		let ulID = `${a11yId}-ul`;

		return (
			<ClickOutsideDetector onClickOutside={active && this.toggleNav}>
				<div
					{...props}
					class={cx(style.select, props.class, disabled && style.disabled)}
				>
					<div
						aria-label={props['aria-label']}
						aria-disabled={disabled && 'true'}
						aria-haspopup="true"
						aria-expanded={(active || forceOpen) ? 'true' : 'false'}
						aria-activedescendant={getOptionId({ a11yId, index: focused })}
						aria-owns={ulID}
						aria-autocomplete="list"
						role="combobox"
						tabindex={!disabled && '0'}
						onClick={this.toggleNav}
						onKeyDown={this.handleButtonKeyDown}
						title={activeTitle}
						class={cx(style.button, toggleButtonClass)}
					>
						<ToggleButtonText
							iconPosition={iconPosition}
							icon={icon}
							value={activeTitle}
						/>
					</div>
					{ (active || forceOpen) && (
						<ul
							id={ulID}
							role="listbox"
							class={cx(style[anchor], dropup && style.dropup, (active || forceOpen) && style.active)}
							ref={linkref(this, 'menu')}
						>
							{children}
						</ul>
					) }
				</div>
			</ClickOutsideDetector>
		);
	}
}

export const Select = withAriaId('select')(SelectBase);

export class Option extends Component {
	static defaultProps = {
		iconPosition: 'left',
		icon: <Icon name="check" />
	};

	select = () => {
		this.props.onChange(this.props);
	};

	handleMouseOver = () => {
		isOverflowedX(this.refs.text) && this.setState({ showTooltip: true });
		this.props.onMouseOver && this.props.onMouseOver(this.props.index);
	}

	handleMouseOut = () => {
		this.setState({ showTooltip: false });
	}

	render({ onChange, title, value, selected, focused, children, iconPosition, icon, tooltip, a11yId, index, ...props }, { showTooltip }) {
		// if no title, display value instead
		title = title || (children && children.length && children) || value;
		return (
			<li
				{...props}
				id={getOptionId({ a11yId, index })}
				onClick={this.select}
				onMouseOver={this.handleMouseOver}
				onMouseOut={this.handleMouseOut}
				class={cx(style[iconPosition], selected && style.active, focused && style.focus, focused && props.highlightClass, style.item, props.class)}
				role="option"
				aria-selected={selected && 'true'}
			>
				<div
					ref={linkref(this, 'text')}
					class={cx(style.itemTitle)}
					title={tooltip || showTooltip && title}
				>
					{title}
				</div>
				<i class={style.itemIcon}>{icon}</i>
			</li>
		);
	}
}

function isOverflowedX(element){
	// source: http://stackoverflow.com/questions/9333379/javascript-css-check-if-overflow
	return element.scrollWidth > element.clientWidth;
}
