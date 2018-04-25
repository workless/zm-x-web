import { h } from 'preact';

import { Text } from 'preact-i18n';
import { Button } from '@zimbra/blocks';

import s from './style.less';

export default function CalendarAddEventAction({ onSave, onCancel, ...props }) {
	return (
		<div {...props}>
			<Button class={s.addEventAction} styleType="primary" brand="primary" onClick={onSave} ><Text id="buttons.save" /></Button>
			<Button class={s.addEventAction} onClick={onCancel}><Text id="buttons.cancel" /></Button>
		</div>
	);
}
