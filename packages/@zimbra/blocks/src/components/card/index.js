import { h, Component } from 'preact';
import Scrim from '../scrim';
import style from './style';
import cx from 'classnames';

export default class Card extends Component {
	static defaultProps = {
		square: true,
		scrim: true
	}
	// The "hovered" state is singleton across all Card components.
	// This makes it impossible to for two items to appear hovered at the same time
	setHovered = () => {
		const { hoveredInstance } = Card;
		const { onHover, scrim } = this.props;
		if (scrim) {
			if (typeof hoveredInstance !== 'undefined') {
				hoveredInstance.unsetHovered();
			}

			Card.hoveredInstance = this;
			this.setState({ hovered: true });
		}

		if (typeof onHover === 'function') {
			onHover(true);
		}
	}

	unsetHovered = (e) => {
		if (typeof e !== 'undefined' && this.base.contains(e.relatedTarget)) {
			// When a blur event fires on `this.base`, do nothing if
			// the focus cursor is still within `this.base`.
			return;
		}
		const { hoveredInstance } = Card;
		const { onHover, scrim } = this.props;
		if (scrim) {
			if (hoveredInstance === this) {
				delete Card.hoveredInstance;
			}
			this.setState({ hovered: false });
		}

		if (typeof onHover === 'function') {
			onHover(false);
		}
	}

	render({ componentClass, square, scrim, scrimProps = {}, children, ...props }, { hovered }) {
		const Tag = componentClass || (
			typeof props.href === 'string'
				? 'a'
				: 'div'
		);

		return (
			<Tag
				{...props}
				{...(typeof props.onClick === 'function' ? { role: 'button' } : {})}
				onFocusIn={this.setHovered}
				onBlur={this.unsetHovered}
				onMouseEnter={this.setHovered}
				onMouseLeave={this.unsetHovered}
				class={cx(style.card, square === true && style.square, props.class)}
			>
				{children}
				{hovered && (scrim === true ? <Scrim {...scrimProps} /> : scrim)}
			</Tag>
		);
	}
}
