import { h, Component } from 'preact';
import { callWith } from '../../lib/util';
import FileIcon from '../file-icon';

import s from './style.less';
import cx from 'classnames';

const formatFilename = (fileName, { maxWidth, fontSize }) => {
	const extensionPivotIdx = fileName.lastIndexOf('.');

	const ruler = document.createElement('span');
	ruler.style.visibility = 'hidden';
	ruler.style.whitespace = 'nowrap';
	ruler.style.fontSize = fontSize + 'px';
	document.body.appendChild(ruler);
	ruler.innerHTML = fileName;
	// no truncation needed, filname fits in container.
	if (ruler.offsetWidth < maxWidth) {
		return fileName;
	}

	let [name, extension] =
		extensionPivotIdx !== -1
			? [
				fileName.slice(0, extensionPivotIdx),
				fileName.slice(extensionPivotIdx + 1)
			]
			: [fileName, ''];

	// truncate the name part of the filename, preserving the extension,
	// until it fits in the container.
	ruler.innerHTML = name + '...' + extension;
	while (ruler.offsetWidth > maxWidth) {
		name = name.slice(0, name.length - 1);
		ruler.innerHTML = name + '...' + extension;
	}
	const output = ruler.innerHTML;
	document.body.removeChild(ruler);
	return output;
};

export default class AttachmentTile extends Component {
	componentDidMount() {
		const { attachment } = this.props;
		if (attachment) {
			const filename = attachment.filename || attachment.name || 'Unnamed';
			// eslint-disable-next-line react/no-did-mount-set-state
			this.setState({
				filename,
				formattedFilename: formatFilename(filename, {
					maxWidth: 82,
					fontSize: 12
				})
			});
		}
	}

	componentWillReceiveProps(nextProps) {
		const { attachment } = nextProps;
		if (attachment) {
			const nextFilename = attachment.filename || attachment.name || 'Unnamed';
			if (nextFilename !== this.state.filename) {
				this.setState({
					filename: nextFilename,
					formattedFilename: formatFilename(nextFilename, {
						maxWidth: 82,
						fontSize: 12
					})
				});
			}
		}
	}

	render(
		{ attachment, onPreview, removable, onRemove, isEventAttachments },
		{ formattedFilename }
	) {
		return (
			<div
				class={cx(s.attachment, isEventAttachments && s.calendarAttachment)}
				onClick={removable ? callWith(onRemove, { attachment }) : onPreview}
			>
				<div class={s.iconContainer}>
					<FileIcon
						type={String(
							attachment.contentType || attachment.type
						).toLowerCase()}
						class={s.icon}
					/>
					{removable && <div class={s.removeIcon} />}
				</div>
				<div
					class={cx(
						s.nameContainer,
						isEventAttachments && s.calendarNameContainer
					)}
				>
					{formattedFilename}
				</div>
			</div>
		);
	}
}

AttachmentTile.defaultProps = {
	onRemove: () => {

		/* noop */
	}
};
