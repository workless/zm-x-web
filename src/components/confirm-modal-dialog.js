import { h } from 'preact';
import ModalDialog from './modal-dialog';
import { Text } from 'preact-i18n';
import { Button } from '@zimbra/blocks';
import { callWith } from '../lib/util';

/**
 * Ask the user for yes/no/cancel. Calls `onResult` with true/false/null.
 */
export default function ConfirmModalDialog({ children, onResult, cancelButton = true, ...props }) {
	return (
		<ModalDialog
			{...props}
			buttons={[
				<Button styleType="primary" onClick={callWith(onResult, true)}>
					<Text id="buttons.yes" />
				</Button>,
				<Button onClick={callWith(onResult, false)}>
					<Text id="buttons.no" />
				</Button>
			]}
			onClose={callWith(onResult, null)}
			cancelButton={cancelButton}
		>
			{children}
		</ModalDialog>
	);
}
