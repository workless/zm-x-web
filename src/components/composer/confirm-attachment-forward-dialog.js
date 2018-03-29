import { h } from 'preact';
import { Text } from 'preact-i18n';
import Dialog from '../modal-dialog';
import  { callWith } from '../../lib/util';

export default function ConfirmAttachmentForwardDialog({ onConfirm }) {
	return (
		<Dialog
			title="compose.confirmAttachmentForward.TITLE"
			actionLabel="compose.confirmAttachmentForward.CONFIRM"
			cancelLabel="compose.confirmAttachmentForward.CANCEL"
			onAction={callWith(onConfirm, true)}
			onClose={callWith(onConfirm, false)}
		>
			<p>
				<Text id="compose.confirmAttachmentForward.DESCRIPTION" />
			</p>
		</Dialog>
	);
}
