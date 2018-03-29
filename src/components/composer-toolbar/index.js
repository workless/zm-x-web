import { h } from 'preact';

import { Text } from 'preact-i18n';
import Toolbar from '../toolbar';
import ToolbarSVGActionButton from '../toolbar/svg-action-button';
import ActionButton from '../action-button';

import s from './style.less';

export default function ComposerToolbar({ onSend, onClose }) {
	return (
		<Toolbar>
			<ToolbarSVGActionButton
				onClick={onClose}
				iconClass={s.closeIcon}
			/>
			<div class={s.sendButtonContainer}>
				<ActionButton
					className={s.sendButton}
					onClick={onSend}
				>
					<Text id="buttons.send" />
				</ActionButton>
			</div>
		</Toolbar>
	);
}