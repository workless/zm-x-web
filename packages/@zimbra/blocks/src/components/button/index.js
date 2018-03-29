import { h } from 'preact';
import Icon from '../icon';
import cx from 'classnames';
import style from './style';

export default function Button({ styleType, size='regular', brand='', iconPosition='left', icon, iconName, children, alignLeft, ...props }) {
	icon = iconName || typeof icon==='string' ? <Icon name={iconName || icon} class={cx(style.icon, style[iconPosition])} /> : icon;
	let ComponentClass = 'button';
	if (props.href) {
		ComponentClass = 'a';
		props.role = 'button';
	}
	else if (!props.type) props.type = 'button';

	return (
		<ComponentClass
			{...props}
			class={cx(style.button, styleType && style[styleType], style[size], brand && style[`brand-${brand}`], alignLeft && style.alignLeft, props.class)}
		>
			{iconPosition === 'left' && icon}
			{children}
			{iconPosition === 'right' && icon}
		</ComponentClass>
	);
}
