
// High Fidelity Document Preview for Network Edition only - see https://wiki.zimbra.com/wiki/High_Fidelity_Document_Preview
// const HFDP_PREVIEW_SUPPORTED_MIMETYPES = /(?:(?:^(?:image\/|text\/plain))|(?:ms-?(?:powerpoint|excel|word))|(?:(?:wordprocessing|spreadsheet|presentation)ml)|(?:opendocument\.(?:presentation|spreadsheet|text))|pdf$|(?:(?:application|multipart)\/(?:x-)?zip(?:-compressed)?))/i;

const PREVIEW_SUPPORTED_MIMETYPES = /(?:(?:^(?:image\/|text\/plain))|pdf)$/i;

/* Annotated:
	((^(image\/|text\/plain))                             - Any image, or plaintext
	(ms-?(powerpoint|excel|word))                         - MS Office documents
	((wordprocessing|spreadsheet|presentation)ml)         - open office documents
	(opendocument\.(presentation|spreadsheet|text))       - open office documents
	pdf$                                                  - pdf files
	((application|multipart)\/(x-)?zip(-compressed)?)     - zip files
*/

export function hasAttachmentPreview(attachment) {
	return (
		attachment &&
		attachment.contentType &&
		PREVIEW_SUPPORTED_MIMETYPES.test(attachment.contentType)
	);
}

export function isImage(attachment) {
	return (
		attachment &&
		attachment.contentType &&
		attachment.contentType.indexOf('image/') === 0
	);
}

export const isImageDeep = item => isImage(item.attachment);

export function isInline(attachment) {
	const contentDisposition = String(attachment.cd || attachment.contentDisposition);
	return contentDisposition==='inline' || ((attachment.cid || attachment.contentId) && contentDisposition !== 'attachment');
}

export function isAttachmentDisposition(attachment) {
	return !isInline(attachment);
}

/**
 * Given a file, force it to a given contentDisposition
 */
export function forceContentDisposition(attachment, contentDisposition) {
	return contentDisposition === 'attachment'
		? { ...attachment, contentDisposition, contentId: undefined }
		: contentDisposition === 'inline'
			? { ...attachment, contentDisposition }
			: attachment;
}

