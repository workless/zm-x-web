import { h } from 'preact';
import ActionButton from '../../action-button';

import cx from 'classnames';
import s from './style.less';

export default function ToolbarActionButton({ className, iconOnly, monotone,...props }) {
	return (
		<ActionButton
			className={cx(s.actionButton, className)}
			iconOnly
			monotone
			{...props}
		/>
	);
}
