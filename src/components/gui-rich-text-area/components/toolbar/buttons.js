import { h } from 'preact';
import { Text } from 'preact-i18n';
import { CommandButton } from './command-button';
import cx from 'classnames';
import styles from './style';
import { Button, Spinner } from '@zimbra/blocks';


export function ToggleTextModeButton({ isPlainText, ...props }) {
	return (
		<CommandButton
			{...props}
			title={`togglePlaintext.${String(Boolean(isPlainText))}`}
			icon={`angle-double-${isPlainText ? 'right': 'left'}`}
		/>
	);
}

export function TrashButton(props) {
	return (
		<CommandButton
			{...props}
			title="deleteDraft"
			class={cx(styles.delete, props.class)}
			icon="trash"
		/>
	);
}

export function SendButton({ disabled, ...props }) {
	return (
		<Button {...props} class={cx(styles.send, props.class)} disabled={disabled}>
			<Text id="buttons.send" />
			<span>
				{ disabled && <Spinner dark /> }
			</span>
		</Button>
	);
}
