import { h } from 'preact';
import { Text } from 'preact-i18n';
import InlineModalDialog from '../../../inline-modal-dialog';

export default function FilterRuleRemoveModal({ onConfirm, onClose, value }) {
	return (
		<InlineModalDialog
			title="settings.filterRuleRemoveModal.title"
			actionLabel="buttons.yes"
			onAction={onConfirm}
			onClose={onClose}
		>
			<p>
				<Text
					id="settings.filterRuleRemoveModal.description"
					fields={{ name: value.name }}
				/>
			</p>
		</InlineModalDialog>
	);
}