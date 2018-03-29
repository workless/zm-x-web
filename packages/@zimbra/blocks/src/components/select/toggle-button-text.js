import { h } from 'preact';
import style from './style';
import cx from 'classnames';

export default function ToggleButtonText({ iconPosition, icon, value }) {
	return (
		<div>
			{ iconPosition === 'left' && icon }
			<p class={cx(style.toggle)} title={value}>
				{value}
			</p>
			{ iconPosition === 'right' && icon }
		</div>
	);
}
