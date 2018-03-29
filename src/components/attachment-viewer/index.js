import { h, Component } from 'preact';
import { ModalDialog, Spinner } from '@zimbra/blocks';
import AttachmentViewerToolbar from './toolbar';
import AttachmentViewerControls from './controls';
import cx from 'classnames';
import saveAs from '../../lib/save-as';
import { isImage } from '../../utils/attachments';
import { connect } from 'preact-redux';
import { setPreviewAttachment, previewNextPage, previewPreviousPage } from '../../store/attachment-preview/actions';
import { getSelectedAttachmentPreview } from '../../store/attachment-preview/selectors';
import { configure } from '../../config';
import PdfjsViewer from '../pdfjs-viewer';
import linkref from 'linkref';
import style from './style';

@configure('zimbraOrigin')
@connect((state) => ({
	attachment: getSelectedAttachmentPreview(state),
	page: state.attachmentPreview.selected + 1
}), {
	onClose: setPreviewAttachment,
	onPreviousAttachment: previewPreviousPage,
	onNextAttachment: previewNextPage
})
export default class AttachmentViewer extends Component {
	static defaultProps = {
		maxZoom: 3,
		minZoom: 0.5,
		zoomStep: 0.1
	}
	state = {
		fullScreen: false,
		pending: false,
		zoom: 1
	}

	download = () => {
		saveAs(this.props.attachment.url, this.props.attachment.filename);
	};

	openFullScreen = () => { this.setState({ fullScreen: true }); }
	closeFullScreen = () => { this.setState({ fullScreen: false }); }

	handleClose = () => {
		if (this.state.fullScreen) {
			this.closeFullScreen();
		}
		else {
			this.props.onClose();
		}
	}

	handlePdfPageChange = (pageIndex) => {
		this.setState({ currentPage: pageIndex });
	}

	handleLoad = (pdfDoc) => {
		if (pdfDoc && pdfDoc.numPages) {
			this.setState({ currentPage: 1, numPages: pdfDoc.numPages });
		}
		this.setState({ pending: false });
	}

	handleZoomIn = () => {
		let nextZoom = Math.min(this.props.maxZoom, (this.state.zoom + this.props.zoomStep).toFixed(2));
		nextZoom !== this.state.zoom && this.setState({ zoom: nextZoom });
	}

	handleZoomOut = () => {
		let nextZoom = Math.max(this.props.minZoom, (this.state.zoom - this.props.zoomStep).toFixed(2));
		nextZoom !== this.state.zoom && this.setState({ zoom: nextZoom });
	}

	componentWillReceiveProps({ attachment = {}, page }) {
		if (attachment.url && (this.props.attachment || {}).url !== attachment.url) {
			this.setState({ pending: true, currentPage: undefined, numPages: undefined });
		}
		if (page !== this.props.page && this.state.zoom !== 1) {
			this.setState({ zoom: 1 });
		}
	}

	render({ attachment, onNextAttachment, onPreviousAttachment }, { pending, fullScreen, zoom, currentPage, numPages }) {
		let translate = zoom <= 2 ? 50 : 100 / zoom,
			zoomStyle = `transform: scale(${zoom}) translate(-${translate}%, -${translate}%)`;

		const children = ([
			<AttachmentViewerToolbar
				page={currentPage}
				maxPages={numPages}
				attachment={attachment}
				fullScreen={fullScreen}
				onDownload={this.download}
				onFullScreen={this.openFullScreen}
				onClose={this.handleClose}
			/>,
			<div class={style.inner} ref={linkref(this, 'inner')}>
				{attachment && pending && <Spinner block />}
				{attachment && (
					isImage(attachment) ? (
						<img src={attachment.url} style={zoomStyle} class={cx(pending && style.hidden)} onLoad={this.handleLoad} />
					) : (
						<PdfjsViewer
							scale={zoom}
							container={this.refs && this.refs.inner}
							src={`${attachment.url}&view=html`}
							class={cx(pending && style.hidden)}
							onChangePage={this.handlePdfPageChange}
							onLoadDocument={this.handleLoad}
						/>
					)
				) }
			</div>,
			<AttachmentViewerControls
				onPreviousAttachment={onPreviousAttachment}
				onNextAttachment={onNextAttachment}
				onZoomOut={this.handleZoomOut}
				onZoomIn={this.handleZoomIn}
			/>
		]);

		return (
			<div class={cx(style.attachmentViewer, attachment && style.showing)}>
				{fullScreen && (
					<ModalDialog class={style.modal} onClickOutside={this.closeFullScreen}>
						{children}
					</ModalDialog>
				)}
				{children}
			</div>
		);
	}
}
