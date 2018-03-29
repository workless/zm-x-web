import { h } from 'preact';
import NakedButton from '../naked-button';
import { Icon } from '@zimbra/blocks';

import s from './style.less';

export default function CondensedMessageOverflowIndicator({
	count,
	onClick
}) {
	return (
		<div class={s.container}>
			<NakedButton onClick={onClick} class={s.button}>
				<Icon name="plus" class={s.icon} size="sm" />
				<span class={s.label}>{count} more {count > 1 ? 'messages' : 'message'}</span>
			</NakedButton>
		</div>
	);
}