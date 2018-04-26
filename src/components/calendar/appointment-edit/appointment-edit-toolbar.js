import { h } from 'preact';

import Toolbar from '../toolbar';
import { Text } from 'preact-i18n';
import { Button } from '@zimbra/blocks';
import s from './style.less';

export default function AppointmentEditToolbar({ isMobileActive, ...props }) {
	const c = <AppointmentEditToolbarItems class={isMobileActive ? s.toolbarAction : s.footer}  {...props} />;
	return isMobileActive ? <Toolbar>{c}</Toolbar> : c;
}

function AppointmentEditToolbarItems({ onSave, onCancel, ...props }) {
	return (
		<div {...props}>
			<Button class={s.addEventAction} styleType="primary" brand="primary" onClick={onSave} ><Text id="buttons.save" /></Button>
			<Button class={s.addEventAction} onClick={onCancel}><Text id="buttons.cancel" /></Button>
		</div>
	);
}
