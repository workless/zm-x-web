/* eslint-disable react/no-string-refs */
import { h, Component, cloneElement } from 'preact';
import { LEFT_ARROW, RIGHT_ARROW } from '../../constants/key-codes';
import linkRef from 'linkref';
import style from './style';
import cx from 'classnames';

/**
 * A tabbed layout. Expects all children to be <Tab> components.
 */

let UID_COUNTER = 0;
export default class Tabs extends Component {
	uniquePrefix = `blocks-tabs-${UID_COUNTER++}`

	state = {
		active: 0
	};

	/**
	 * Set a new active tab.
	 */
	setActive = (index) => {
		if (this.state.active !== index) {
			if (typeof this.props.onChangeActive === 'function') this.props.onChangeActive(index);
			this.setState({ active: index });
		}
	};

	/**
	 * Set a new active tab relative to the current active tab
	 */
	offsetActive(offset) {
		let { active } = this.state,
			max = this.props.children.length - 1;
		active = Math.min(max, Math.max(0, active + offset));
		this.setActive(active);
	}

	/**
	 * Move left or right between tabs using arrow keys
	 */
	handleTabKeyDown = (e) => {
		if (e.keyCode === LEFT_ARROW) {
			this.offsetActive(-1);
		}
		else if (e.keyCode === RIGHT_ARROW) {
			this.offsetActive(1);
		}
	}

	componentWillMount() {
		if (typeof this.props.active !== 'undefined') {
			this.setActive(this.props.active);
		}
	}

	componentWillReceiveProps({ active }) {
		if (typeof active !== 'undefined' && this.state.active !== active) {
			this.setActive(active);
		}
	}

	/**
	 * Render <NavItem>, using the title prop from <Tab> as the text of a <NavItem>
	 */
	renderNavigation = () => this.props.children.map((child, index) => {
		const isActive = index === this.state.active;
		return (
				<NavItem
					class={cx(isActive && this.props.tabActiveClass)}
					index={index}
					active={isActive}
					id={`${this.uniquePrefix}-tab-${index}`}
					aria-controls={`${this.uniquePrefix}-pane-${index}`}
					onClick={this.setActive}
					onKeyDown={this.handleTabKeyDown}
				>
					{child.attributes.title || `Tab ${index}`}
				</NavItem>
		);
	})

	render({ children, ...props }, { active }) {
		delete props.tabActiveClass;

		// Clone active property onto children
		children = children.map((child, index) => (
			cloneElement(child, {
				active: active === index,
				id: `${this.uniquePrefix}-pane-${index}`,
				'aria-labelledby': `${this.uniquePrefix}-tab-${index}`
			})
		));

		return (
			<div {...props}>
				<ul role="tablist" class={style.nav}>
					{this.renderNavigation()}
				</ul>
				{children}
			</div>
		);
	}
}


/**
 * One tab in a tabbed layout. It will be hidden if active === false
 * The title prop is used as the text in the <Tabs> navigation
 *
 * Does not render children until first activation.
 */
export class Tab extends Component {
	render({ children, active, title, ...props }) {
		if (active) this.hasEverBeenActive = true;
		return (
			<div
				{...props}
				role="tabpanel"
				aria-hidden={String(!active)}
				class={cx(style.tab, active && style.active, props.class)}
			>
				{ this.hasEverBeenActive && children }
			</div>
		);
	}
}


/**
 * A navigation item in the <Tabs> nav menu.
 */
export class NavItem extends Component {
	handleClick = (e) => {
		if (typeof e.button !== 'undefined' && e.button !== 0) { return; }

		let { index, onClick } = this.props;
		if (typeof onClick === 'function') {
			onClick(index);
			typeof this.refs.anchor !== 'undefined' && this.refs.anchor.focus();
			e.preventDefault();
		}
	};

	/**
	 * When the component updates, force a change in focus to focus the <a> element.
	 */
	componentWillUpdate(nextProps) {
		if (nextProps.active && this.props.active !== nextProps.active) {
			this.refs.anchor.focus();
		}
	}

	render({ children, onKeyDown, active, id, 'aria-controls': ariaControls, class: className, ...props }) {

		return (
			<li
				role="presentation"
				class={cx(style['nav-item'], active && style.active, className)}
				onKeyDown={onKeyDown}
				onClick={this.handleClick}
			>
				<a
					role="tab"
					id={id}
					ref={linkRef(this, 'anchor')}
					aria-selected={String(Boolean(active))}
					aria-controls={ariaControls}
					tabIndex={active ? 0 : -1}
				>
					{children}
				</a>
			</li>
		);
	}
}
