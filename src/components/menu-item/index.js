import { h } from 'preact';
import cx from 'classnames';
import { Link } from 'preact-router/match';
import escapeStringRegexp from 'escape-string-regexp';
import { Icon } from '@zimbra/blocks';
import style from './style';

export default function MenuItem({
	customClass,
	activeClass,
	iconClass,
	innerClass,
	match,
	icon,
	iconPosition = 'left',
	iconText,
	responsive,
	children,
	href,
	sidebarEnable,
	noBorder,
	...props
}) {
	if (match && typeof match === 'string') {
		match = new RegExp('^' + escapeStringRegexp(match));
	}

	const navLink = (
		<Link {...props}
			activeClassName={cx(style.active, activeClass)}
			href={href}
			class={cx(
				!customClass && style.navItem,
				icon && (iconPosition==='right' ? style.iconRight : style.iconLeft),
				customClass!==true && customClass,
				props.class,
				responsive && style.responsive,
				props.disabled && style.disabled,
				noBorder && style.noBorder
			)}
		>
			{ icon && (
				<span class={iconClass || style.icon}>
					{typeof icon === 'string' ? <Icon name={icon} /> : icon}
					{ iconText && (
						<span class={style.iconText}>{iconText}</span>
					) }
				</span>
			)}
			<span class={cx(style.inner, innerClass)}>{children}</span>
		</Link>);

	return sidebarEnable ? (<div class={style.sidebarSectionHeader}>
		{ navLink }
	</div>) : navLink;
}
