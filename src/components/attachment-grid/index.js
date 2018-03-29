import { h } from 'preact';
import AttachmentItem from './item';
import AttachmentGridHeader from './header';
import { connect } from 'preact-redux';
import { compose } from 'recompose';
import { setPreviewAttachment } from '../../store/attachment-preview/actions';
import saveAs from '../../lib/save-as';

import s from './style.less';

function AttachmentGrid({
	attachments,
	removable,
	onPreview,
	onViewAll,
	onDownloadAll,
	onRemove,
	onRemoveAll,
	isEventAttachments
}) {
	return (
		<div>
			{!isEventAttachments && (
				<AttachmentGridHeader
					attachments={attachments}
					removable={removable}
					onViewAll={onViewAll}
					onDownloadAll={onDownloadAll}
					onRemoveAll={onRemoveAll}
				/>
			)}
			<div class={s.attachments}>
				{attachments.map(attachment => (
					<AttachmentItem
						removable={removable}
						onRemove={onRemove}
						onPreview={onPreview}
						attachment={attachment}
						isEventAttachments
					/>
				))}
			</div>
		</div>
	);
}

export default compose(
	connect(null, (dispatch, { attachments, onRemove }) => ({
		onPreview: attachment =>
			dispatch(setPreviewAttachment(attachment, attachments)),
		onViewAll: () =>
			dispatch(setPreviewAttachment(attachments[0], attachments)),
		onDownloadAll: () =>
			attachments.forEach(attachment =>
				saveAs(attachment.url, attachment.filename)
			),
		onRemoveAll: () =>
			attachments.forEach(attachment => onRemove({ attachment }))
	}))
)(AttachmentGrid);
