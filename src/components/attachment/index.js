import { h } from 'preact';
import PureComponent from '../../lib/pure-component';
import FileIcon from '../file-icon';
import { Button, Icon } from '@zimbra/blocks';
import prettyBytes from 'pretty-bytes';
import { hasAttachmentPreview } from '../../utils/attachments';
import saveAs from '../../lib/save-as';
import preactRedux from 'preact-redux';
import { configure } from '../../config';
import { setPreviewAttachment } from '../../store/attachment-preview/actions';
import { hide } from '../../store/media-menu/actions';
import style from './style';

const { connect } = preactRedux;

@configure('zimbraOrigin')
@connect(null, { preview: setPreviewAttachment, hideMediaMenu: hide })
export default class Attachment extends PureComponent {
	download = () => {
		saveAs(this.props.attachment.url, this.props.attachment.filename);
	};

	preview = e => {
		let { attachment, preview, hideMediaMenu, attachmentGroup } = this.props;
		if (hideMediaMenu) hideMediaMenu();
		if (preview) preview(attachment, attachmentGroup);
		return e.stopPropagation(), false;
	 };

	remove = e => {
		let { attachment, onRemove } = this.props;
		if (onRemove) onRemove({ attachment });
		return e.stopPropagation(), false;
	};

	render({ attachment={}, children, preview=true, previewOnClick=false, removable=false, downloadable=true, onRemove, ...props }) {
		let hasPreview = preview !== false && hasAttachmentPreview(attachment),
			canRemove = String(removable)==='true',		// @TODO this seems dumb
			canDownload = String(downloadable)!=='false';
		return (
			<div
				class={style.attachment}
				onClick={hasPreview && previewOnClick ? this.preview : canDownload && this.download}
				{...props}
			>
				<FileIcon
					type={String(attachment.contentType).toLowerCase()}
					class={style.icon}
				/>

				{ hasPreview && !previewOnClick && (
					<Button class={style.button} styleType="floating" onClick={this.preview}>
						<Icon name="eye" />
					</Button>
				) }
				{ canRemove && (
					<Button class={style.button} styleType="floating" onClick={this.remove}>
						<Icon name="trash" />
					</Button>
				) }

				<span class={style.size}>{ +attachment.size > 0 && prettyBytes(attachment.size).replace(/\.\d+/,'') }</span>

				<p class={style.name}>{attachment.filename || attachment.name || 'Unnamed'}</p>
			</div>
		);
	}
}
