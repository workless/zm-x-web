import { h } from 'preact';
import { Link } from 'preact-router/match';

import s from './style.less';

import cx from 'classnames';

export default function SVGActionButton({ className, href, iconClass, onClick }) {
	return (
		href
			? (
				<Link href={href} class={cx(s.button, className)}>
					<div
						class={cx(s.icon, iconClass)}
					/>
				</Link>
			)
			: (
				<div onClick={onClick} class={cx(s.button, className)}>
					<div
						class={cx(s.icon, iconClass)}
					/>
				</div>
			)
	);
}