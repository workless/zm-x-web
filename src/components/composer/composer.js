/* eslint-disable new-cap */
import { h, Component } from 'preact';
import cx from 'classnames';
import { withText, Text, Localizer } from 'preact-i18n';
import { Button, Icon } from '@zimbra/blocks';
import { shallowEqual } from '../../lib/pure-component';
import { withAriaId } from '@zimbra/a11y';
import Select from '../select';
import Textarea from '../gui-textarea';
import RichTextArea from '../gui-rich-text-area';
import { connect } from 'preact-redux';
import { setPreviewAttachment } from '../../store/attachment-preview/actions';
import {
	toggle as toggleMediaMenu,
	selectTab,
	clearBuffer,
	setActiveEditor,
	unsetActiveEditor
} from '../../store/media-menu/actions';
import { recentlyActiveMediaMenu } from '../../store/media-menu/selectors';
import ConfirmAttachmentForwardDialog from './confirm-attachment-forward-dialog';
import AddressField from '../address-field';
import ComposerToolbar from '../composer-toolbar';
import ActionMenuComposeAttachments from '../action-menu-compose-attachments';
import chooseFiles from 'choose-files';
import wire from 'wiretie';
import get from 'lodash-es/get';
import find from 'lodash-es/find';
import { addNodeDeleteHandler, htmlToText, getEmailHTMLDocument,
	insertAtCaret, findElementByIdInEmail, placeCaretAfterElement,
	findElementParent, getCharacterPrecedingCaret } from '../../lib/html-email';
import { STRIP_ATTRS, STRIP_NODES } from '../../lib/html-viewer';
import { removeNode, getId } from '../../lib/util';
import array from '@zimbra/util/src/array';
import { isAttachmentDisposition } from '../../utils/attachments';
import { minWidth, screenMd } from '../../constants/breakpoints';
import { TEXT_MODE, HTML_MODE } from '../../constants/composer';
import withMediaQuery from '../../enhancers/with-media-query';
import LinkCard from './vhtml-templates/link-card';
import EnhancedLinkCard, { CARD_SIZE, CARD_LOCATION } from './vhtml-templates/enhanced-link-card/link-card';
import FooterLinks from './vhtml-templates/enhanced-link-card/footer-links';
import Img from './vhtml-templates/img';
import EmojiImg from './vhtml-templates/emoji-img';
import style from './style';

const CLEAN = {
	to: [],
	cc: [],
	bcc: [],
	subject: '',
	body: '',
	draftId: undefined,
	showCc: false,
	originalMessage: null,
	attachments: [],
	inlineAttachments: [],
	confirmSend: null,
	showAttachmentForwardConfirm: false
};

const EDITOR_STYLESHEET = `
	html, body {
		font: 14px/1.3 'Helvetica Neue', Roboto, arial, helvetica, verdana, sans-serif;
	}
`;

let cidCounter = Math.floor(Math.random()*9999);

function updateInlineAttachmentPartNumber(doc, { contentId, part }) {
	let img = doc && doc.querySelector(`[data-cid="${contentId}"]`);
	if (!img) { console.warn(`Attachment cid:${contentId} not found`); return; }
	img.setAttribute('src', img.src.replace(/part=(\d\.?)+/, `part=${part}`));
}

function generateNextCID() {
	return Date.now().toString(32) + (++cidCounter).toString(32) + '@zimbra';
}


@withAriaId('composer')
@withText({ textareaPlaceholder: 'compose.textarea.placeholder' })
@connect((state, ownProps) => ({
	activeAccountId: get(state, 'activeAccount.id'),
	showMediaMenu: get(state, 'mediaMenu.visible'),
	mediaBuffer: get(state, 'mediaMenu.buffer'),
	isRecentlyActive: recentlyActiveMediaMenu(state) === ownProps.a11yId
}), { toggleMediaMenu, selectTab, clearMediaBuffer: clearBuffer, setActiveEditor, unsetActiveEditor, setPreviewAttachment })
@wire('zimbra', null, zimbra => ({
	// @TODO
	attach: zimbra.messages.attach,
	sendMessage: zimbra.messages.send,
	linkEnhancer: zimbra.linkEnhancer
}))
@withMediaQuery(minWidth(screenMd), 'matchesScreenMd')
export default class Composer extends Component {
	state = {
		simple: false,
		show: false,
		mode: HTML_MODE,
		fromAccountId: null,
		...CLEAN
	};

	enhancedLinksData = {};

	/** Set up the editor based on incoming props
	 *	@param {Message} props.message
	 */
	applyIncomingMessage({ message }, isUpdatedDraftMessage = false) {
		if (!message) {
			throw new Error('Message not passed');
		}

		this.setState({
			bcc: array(message.bcc),
			cc: array(message.cc),
			showCc: (array(message.cc).length || array(message.bcc).length) > 0,
			draftId: message.draftId,
			inReplyTo: message.inReplyTo,
			origId: message.origId,
			rt: message.rt,
			subject: message.subject,
			to: array(message.to)
		});

		if (!isUpdatedDraftMessage) {
			let body = message.html || message.text || '';
			if (body && message.inlineAttachments) {
				// Replace CID references of inlineAttachments with URLs, and set the
				// CID as a data attribute.
				message.inlineAttachments.forEach(({ contentId, url }) => {
					body = body.replace(`src="cid:${contentId}"`, `src="${url}" data-cid="${contentId}"`);
				});
			}
			this.setState({ body });
		}

		if (!message.draftId) {
			this.setState({
				attachments: message.rt === 'w' && message.attachments.length ? message.attachments : CLEAN.attachments, // Add attachments for Forward only
				inlineAttachments: message.inlineAttachments && message.inlineAttachments.length ? message.inlineAttachments : CLEAN.inlineAttachments, // Always include inline attachments
				originalMessage: message,
				originalRecipients: this.getRecipients(message, ['to', 'cc', 'bcc', 'from'])
			});
		}
	}

	getDocument = () => this.editor && this.editor.getDocument();

	getFromAccount() {
		return find(this.props.accounts, ['id', this.state.fromAccountId]);
	}

	setDefaultFromAccountId = (props) => {
		if (this.state.fromAccountId) {
			return;
		}

		if (props.activeAccountId) {
			this.setState({ fromAccountId: props.activeAccountId });
			return;
		}

		const accounts = props.accounts;
		if (props.accounts && accounts.length > 0) {
			const id = get(find(accounts, 'isPrimaryAccount') || accounts[0], 'id');
			this.setState({ fromAccountId: id });
		}
	}

	editorRef = c => {
		// This ref function is used on two different components.
		// When one unmounts, it will invoke `this.editorRef(null)`.
		// Do not save the null references.
		if (!c) { return; }
		this.editor = c.getWrappedInstance && c.getWrappedInstance() || c;
	};

	getMessageToSend = () => {
		let { mode, originalMessage, confirmSend, ...message } = this.state;
		let { body } = message;
		const from = this.getFromAccount();

		delete message.originalRecipients;
		delete message.simple;
		delete message.show;
		delete message.showCc;
		delete message.showAttachmentForwardConfirm;
		delete message.loading;
		delete message.body;

		message.from = [{
			address: from.emailAddress,
			name: from.fromDisplay || from.emailAddress.split('@')[0]
		}];

		// Convert partial text addresses into address objects:
		['to', 'cc', 'bcc'].forEach( field => {
			message[field] = message[field].map( recipient => (typeof recipient==='string' ? { address: recipient } : recipient));
		});

		// text-only mode
		if (mode===TEXT_MODE) {
			message.text = body;
		}
		else {
			// replace inlined attachments with cid refs
			// @TODO use DOMParser instead of this.
			// body = body.replace(
			// 	/<img data-cid="(.*?)"\s*src=".*?"\s*(.*?)\s*\/?>/gi,
			// 	(s, cid, attrs) => `<img src="cid:${cid}" ${attrs} />`
			// );

			let dom = this.getDocument();
			let currentDocBody = dom.body.cloneNode(true);
			let doc = new DOMParser().parseFromString('<!DOCTYPE html><html><body></body></html>', 'text/html'),
				child;
			while ((child = currentDocBody.firstChild)) doc.body.appendChild(child);
			currentDocBody = doc.body;

			let walk = node => {
				// inline attachment CID references:
				if (node.nodeName==='IMG' && node.hasAttribute('data-cid')) {
					node.setAttribute('src', `cid:${node.getAttribute('data-cid')}`);
				}

				// remove nodes that shouldn't be in the resulting message HTML:
				for (let i=STRIP_NODES.length; i--; ) {
					if (node.hasAttribute(STRIP_NODES[i])) {
						removeNode(node);
						return;
					}
				}

				// remove attributes that shouldn't be in the resulting message HTML:
				for (let i=STRIP_ATTRS.length; i--; ) {
					if (node.hasAttribute(STRIP_ATTRS[i])) {
						node.removeAttribute(STRIP_ATTRS[i]);
					}
				}

				let c = node.lastChild;
				while (c) {
					let prev = c.previousSibling;
					if (c.nodeType===1) {
						walk(c);
					}
					c = prev;
				}
			};
			walk(currentDocBody);
			body = currentDocBody.innerHTML;

			message.html = body;
			message.text = htmlToText(body);
		}

		[ ...message.attachments, ...message.inlineAttachments ].forEach( attachment => {
			delete attachment.url;
		});

		return message;
	}

	getRecipients(message, fields) {
		return (fields || ['to', 'cc', 'bcc']).reduce( (acc, field) => {
			let v = message[field];
			if (v) {
				for (let i=0; i<v.length; i++) {
					acc.push( (v[i].email || v[i].address || v[i]).toLowerCase() );
				}
			}
			return acc;
		}, []).sort();
	}

	send = () => {
		const message = this.getMessageToSend();
		let { confirmSend, originalMessage, originalRecipients } = this.state;
		// Show confirmation prompt if adding a new recipient via reply when there are attachments:
		if (confirmSend!==true && originalMessage && originalMessage.attachments && originalMessage.attachments.length && message.rt === 'r') {
			let newRecipients = this.getRecipients(message);
			const from = this.getFromAccount();

			for (let i=0; i<newRecipients.length; i++) {
				let recip = newRecipients[i];
				if (recip!==from.emailAddress.toLowerCase() && originalRecipients.indexOf(recip)===-1) {
					return this.setState({ showAttachmentForwardConfirm: true });
				}
			}
		}

		this.setState({ loading: true });

		this.props.onSend(message)
			.then(() => {
				this.setState({ loading: false });
			})
			.catch( err => {
				// @TODO show toast for error
				console.warn(err);
				this.setState({
					loading: false,
					error: String(err && err.message || err).replace(/^.*(reported|Sender|soap):/g, '')
				});
			});

		// setTimeout( () => {
		// 	this.setState({ loading: false });
		// 	this.close();
		// }, 1000);

		// scapi.email.send(message)
		// 	.then( () => this.close() )
		// 	.catch( ({ message }) => alert(`Error: \n${message}`) );
	};

	clearPlaceholder = () => {
		let doc = this.getDocument();
		// Manually clear the placeholder
		if (doc.body.textContent === this.props.textareaPlaceholder) {
			doc.body.innerHTML = '';
		}
	}

	setBodyFromDocument = () => {
		const doc = this.getDocument();
		const uneditables = doc.querySelectorAll('[uneditable]');
		for (let node of uneditables) {
			node.setAttribute('contenteditable', 'false');
		}
		let body = doc.body.innerHTML;
		this._bodyFromDocument = body;
		this.setState({ body }, this.notifyChange);
	}

	insertAtCaret = (html, whitespacePadded) => {
		if (this.state.mode === TEXT_MODE) { return; }

		if (whitespacePadded && this.editor && this.editor.getEditorBase && getCharacterPrecedingCaret(this.editor.getEditorBase()).trim()) {
			// Insert an extra whitespace if there isn't one already
			html = '&nbsp;' + html;
		}

		this.clearPlaceholder();
		insertAtCaret(window, html, this.getDocument());
	}

	embedLinks = (links) => {
		if (!links || !links.length) { return; }
		let sep = '<p style="margin:0;"><br/></p>',
			html = sep + links.map(LinkCard).join(sep) + sep;

		this.insertAtCaret(html);
		this.setBodyFromDocument();
	};

	addEmoji = ({ emoji, onDelete }) => {

		let contentId = generateNextCID();
		let html = EmojiImg({
			contentId,
			...emoji
		});

		this.insertAtCaret(html);
		this.setBodyFromDocument();

		//add a mutation observer that will call the onDelete function if the emoji is later deleted
		if (onDelete) {
			let emojiNode = this.base.querySelector(`img[data-cid="${contentId}"][emoji]`);
			addNodeDeleteHandler(emojiNode, onDelete);
		}
	}

	embedImages = (images) => {
		if (typeof images !== 'undefined' && images.length) {
			// add contentIds to all images
			images = images.map( image => {
				image.contentId = generateNextCID();
				image.contentDisposition = 'inline';
				return image;
			});

			this.addAttachments(images);
		}
	}

	addLink = ({ html, url, uid, text }) => {
		this.insertAtCaret(html, true);
		this.enhanceLink({ url, uid, text });
	}

	enhanceLink = ({ url, uid, text }) => {
		// Save the body with link inserted

		this.props.linkEnhancer(url.trim())
			.then( (enhancedLink) => {

				// Return if there is insufficient data to create a link card.
				if (!enhancedLink.title && !enhancedLink.description) { return; }

				enhancedLink.url = url;
				enhancedLink.uid = uid;
				this.enhancedLinksData[url] = enhancedLink;
				if (!this.updateLinkText(enhancedLink, text)) { return; }
				this.moveCaretAfterElementParent(`enhanced-link-${uid}`);
				// the body in the state is stale at this point, get the latest html from the dom instead
				let html = `<p data-safe-id="enhanced-link-separator-top-${uid}" style="margin:0;"></p>` +
							EnhancedLinkCard(enhancedLink, { cardSize: CARD_SIZE.MEDIUM, cardLocation: CARD_LOCATION.BODY }) +
							`<p data-safe-id="enhanced-link-separator-${uid}" style="margin:0;"><br/></p>`;
				this.insertAtCaret(html);
				// Insert Html resets the background to initial
				this.repaintCard(uid);
				this.setBodyFromDocument();
				this.moveCaretAfterElement(`enhanced-link-separator-${uid}`);
			})
			.catch( err => {
				console.warn(err);
			});
	}

	repaintCard(uid) {
		let dom = this.getDocument();
		let linkCard = findElementByIdInEmail(dom, `enhanced-link-card-table-${uid}`);
		if (linkCard) {
			linkCard.style.background = '#fff';
		}
	}

	moveCaretAfterElement(elementId) {
		let dom = this.getDocument();
		let element = findElementByIdInEmail(dom, elementId);
		placeCaretAfterElement(window, element);
	}

	moveCaretAfterElementParent(elementId) {
		let dom = this.getDocument();
		let element = findElementParent(dom, elementId, ['a', 'p']);
		placeCaretAfterElement(window, element);
	}

	updateLinkText(link, originalText) {
		let dom = this.getDocument();
		let linkTag = findElementByIdInEmail(dom, `enhanced-link-${link.uid}`);
		if (linkTag) {
			if (!originalText) {
				linkTag.setAttribute('data-original-text', linkTag.innerText);
				linkTag.innerText = link.title;
			}
			return true;
		}

	}

	restoreLinkText(linkId) {
		let dom = this.getDocument();
		let linkTag = findElementByIdInEmail(dom, `enhanced-link-${linkId}`);
		if (linkTag) {
			let originalLinkText = linkTag.getAttribute('data-original-text');
			if (originalLinkText) linkTag.innerText = originalLinkText;
		}
	}

	chooseAttachments = () => {
		chooseFiles(this.addAttachments);
	}

	// If an attachment is already in progress, attachments are queued and
	// then processed after the other attachments are finished.
	addAttachments = (files = []) => {
		if (this.state.attachmentInProgress) {
			this.attachmentUploadQueue = (this.attachmentUploadQueue || []).concat(files);
			return;
		}

		this.setState({ attachmentInProgress: true });

		files = files.concat(this.attachmentUploadQueue || []);
		this.attachmentUploadQueue = [];

		return this.props.attach(files, this.getMessageToSend())
			.then((message) => {
				const { attachments = [], inlineAttachments = [], ...rest } = message;

				files.forEach((file) => {
					if (file.contentDisposition === 'inline') {
						let sep = '<br />';

						const inlineAttachment = find(inlineAttachments, { contentId: file.contentId });
						file.url = inlineAttachment.url;

						this.insertAtCaret(sep + Img(file) + sep);
					}
				});
				inlineAttachments.forEach((attachment) => updateInlineAttachmentPartNumber(this.getDocument(), attachment));

				this.setBodyFromDocument();
				this.setState({ attachments, inlineAttachments, ...rest });
				this.notifyChange();
			})
			.catch((err) => {
				// TODO: Change this to toasts
				this.setState({ error: (this.state.error ? (this.state.error + '\n') : '') + String(err && err.message || err) });
			})
			.then(() => {
				this.setState({ attachmentInProgress: false });

				// If there are attachments in the queue, call `addAttachments` again to process them.
				if (this.attachmentUploadQueue.length) {
					this.addAttachments();
				}
			});
	}

	removeAttachment = ({ attachment }) => {
		let { attachments, body } = this.state;
		if (attachment.contentId) {
			body = body.replace(new RegExp(`(?:<br[^>]*>\\s*)?<img[^>]*data-cid="${attachment.contentId}"[^>]*>`, 'gi'), '');

			this.setState({ body });
		}
		this.setState({
			attachments: attachments.filter(a => a !== attachment)
		});
	};

	closeAttachmentForwardConfirm = () => {
		this.setState({
			showAttachmentForwardConfirm: false,
			confirmSend: true
		}, this.send);
	}

	handleAttachmentForwardConfirm = confirmed => {
		if (confirmed) {
			let { originalMessage } = this.state;
			this.addAttachments(originalMessage.attachments)
				.then(this.closeAttachmentForwardConfirm);
		}
		else {
			this.closeAttachmentForwardConfirm();
		}
	};

	close = () => {
		this.props.onCancel && this.props.onCancel();
	};

	toggleCc = () => {
		this.setState({ showCc: !this.state.showCc });
	};

	unsimple = () => {
		this.setState({ simple: false });
	};

	toggleTextMode = () => {
		let { mode, body } = this.state;
		mode = mode===TEXT_MODE ? HTML_MODE : TEXT_MODE,
		body = mode===TEXT_MODE ? htmlToText(body) : getEmailHTMLDocument({ text: body });
		this.setState({ mode, body });
	}

	toggleMediaMenu = () => {
		if (this.props.toggleMediaMenu) {
			this.props.toggleMediaMenu();
		}
	}

	openTab = (tabIndex) => {
		if (this.props.selectTab) {
			this.props.selectTab(tabIndex);
		}
		if (!this.props.showMediaMenu) {
			this.toggleMediaMenu();
		}
	}

	removeEmbeddedLink(t) {
		let dataCardId = t.getAttribute('data-card-id');
		this.restoreLinkText(dataCardId);
		do {
			if (t.hasAttribute('embedded-card')) {
				removeNode(t);
				this.removeCardSeparators(dataCardId);
				this.checkFooterLinks();
				this.setBodyFromDocument();
				return;
			}
		} while ( (t=t.parentNode) && t!==this.base );
	}

	removeCardSeparators(linkId) {
		let dom = this.getDocument();
		let topSeparator = findElementByIdInEmail(dom, `enhanced-link-separator-top-${linkId}`);
		removeNode(topSeparator);
		let bottomSeparator = findElementByIdInEmail(dom, `enhanced-link-separator-${linkId}`);
		removeNode(bottomSeparator);
	}

	removeEmbeddedImage(t) {
		do {
			if (t.hasAttribute('embedded-image')) {
				removeNode(t);
				let contentId = t.getElementsByTagName('img')[0].getAttribute('data-cid');

				this.removeAttachment({
					attachment: find(this.state.attachments, (attachment) => attachment.contentId === contentId)
				});

				this.setBodyFromDocument();
				return;
			}
		} while ( (t=t.parentNode) && t!==this.base );
	}

	toggleShrinkEmbeddedImage(t) {
		do {
			if (t.hasAttribute('embedded-image')) {
				if (t.hasAttribute('collapsed')) {
					t.removeAttribute('collapsed');
				}
				else {
					t.setAttribute('collapsed', '');
				}
				this.setBodyFromDocument();
				return;
			}
		} while ( (t=t.parentNode) && t!==this.base );
	}

	handleBodyClick = e => {
		e.preventDefault();
		e.stopPropagation();
		let t = e.target;

		if (t.hasAttribute('button-card-size-small')) {
			this.resizeEnhancedCard(t, CARD_SIZE.SMALL);
		}

		if (t.hasAttribute('button-card-size-medium')) {
			this.resizeEnhancedCard(t, CARD_SIZE.MEDIUM);
		}

		if (t.hasAttribute('button-card-size-large')) {
			this.resizeEnhancedCard(t, CARD_SIZE.LARGE);
		}

		if (t.hasAttribute('button-move-card-to-footer')) {
			this.moveEnhancedCardToFooter(t);
		}

		if (t.hasAttribute('button-move-inline')) {
			this.restoreFooterCard(t);
		}

		if (t.hasAttribute('button-remove-card')) {
			this.removeEmbeddedLink(t);
		}

		if (t.hasAttribute('button-remove-image')) {
			this.removeEmbeddedImage(t);
		}
		if (t.hasAttribute('button-toggle-shrink-image')) {
			this.toggleShrinkEmbeddedImage(t);
		}
	};

	resizeEnhancedCard(button, newSize) {
		let dom = this.getDocument();
		let cardId = button.getAttribute('data-card-id');
		let currentCard = findElementByIdInEmail(dom, `enhanced-link-card-${cardId}`);
		let dataUrl = currentCard.getAttribute('data-url');

		let replacementCard = EnhancedLinkCard(this.enhancedLinksData[dataUrl], { cardSize: newSize });
		currentCard.outerHTML = replacementCard;

		this.setState({ body: dom.body.innerHTML });
	}

	restoreFooterCard(button) {
		let dom = this.getDocument();
		let cardId = button.getAttribute('data-card-id');
		let currentCard = findElementByIdInEmail(dom, `enhanced-link-card-${cardId}`);
		let dataUrl = currentCard.getAttribute('data-url');
		let restoreToSize = currentCard.getAttribute('data-restore-card-size');
		let replacementCard = EnhancedLinkCard(this.enhancedLinksData[dataUrl], { cardSize: restoreToSize, cardLocation: CARD_LOCATION.BODY });

		let originalPlaceholder = findElementByIdInEmail(dom, `enhanced-link-card-placeholder-${cardId}`);
		originalPlaceholder.outerHTML = replacementCard;

		removeNode(currentCard);

		this.checkFooterLinks(dom);

		this.setState({ body: dom.body.innerHTML });
	}

	checkFooterLinks(dom) {
		if (!dom) dom = this.getDocument();
		let linksFooter = findElementByIdInEmail(dom, 'footerLinks');

		if (linksFooter && !linksFooter.children.length) {
			let footerLinksWrapper = findElementByIdInEmail(dom, 'footerLinksWrapper');
			removeNode(footerLinksWrapper);
		}
	}

	moveEnhancedCardToFooter(button) {
		let dom = this.getDocument();
		let cardId = button.getAttribute('data-card-id');
		let currentCard = findElementByIdInEmail(dom, `enhanced-link-card-${cardId}`);
		let dataUrl = currentCard.getAttribute('data-url');
		let currentCardSize = currentCard.getAttribute('data-current-card-size');

		let replacementCard = EnhancedLinkCard(this.enhancedLinksData[dataUrl], { cardSize: CARD_SIZE.SMALL, cardLocation: CARD_LOCATION.FOOTER, restoreToSize: currentCardSize });

		currentCard.innerHTML = '';
		currentCard.setAttribute('id', `enhanced-link-card-placeholder-${cardId}`);
		currentCard.setAttribute('enhanced-link-card-placeholder', '');

		let linksFooter = findElementByIdInEmail(dom, 'footerLinks');

		if (linksFooter) {
			linksFooter.innerHTML += replacementCard;
			this.setState({ body: dom.body.innerHTML });
		}
		else {
			let body = dom.body.innerHTML;
			body += '<br/>' + FooterLinks(replacementCard);
			this.setState({ body });
		}
	}

	handleTextAreaFocusIn = () => {
		if (!this.props.isRecentlyActive) {
			this.setActiveEditor();
		}
	}

	setActiveEditor = () => this.props.setActiveEditor && this.props.setActiveEditor(this.props.a11yId);
	unsetActiveEditor = () => this.props.unsetActiveEditor && this.props.unsetActiveEditor(this.props.a11yId);

	consumeMediaBuffer = ({ mediaBuffer, clearMediaBuffer }) => {
		// Only allow a Composer component to consume the media buffer if it
		// contains the most recently focused text editor.
		if (!this.props.isRecentlyActive) { return; }

		const { action, data, contentType } = mediaBuffer;
		if (action === 'attach') {
			this.addAttachments(data);
		}
		else if (action === 'embed') {
			if (contentType === 'text/uri-list') {
				this.embedLinks(data);
			}
			else {
				this.embedImages(data);
			}
		}
		clearMediaBuffer && clearMediaBuffer();
	}

	notifyChange = () => {
		if (!this.props.onChange) {
			return;
		}
		const message = this.getMessageToSend();
		this.props.onChange(message);
	}

	handleInput = (e) => {
		let body = this.state.mode === TEXT_MODE ? e.target.value : e.value;
		this.setState({ body });
		this.notifyChange();
	}

	handleChangeTo = e => {
		this.setState({ to: e.value }, this.notifyChange);
	}

	handleChangeCc = e => {
		this.setState({ cc: e.value }, this.notifyChange);
	}

	handleChangeBcc = e => {
		this.setState({ bcc: e.value }, this.notifyChange);
	}

	handleChangeSubject = e => {
		this.setState({ subject: e.target.value }, this.notifyChange);
	}

	handleChangeFrom = e => {
		this.setState({ fromAccountId: e.target.value }, this.notifyChange);
	}

	componentWillMount() {
		if (this.props.showMediaMenu) {
			this.toggleMediaMenu();
		}
		this.setDefaultFromAccountId(this.props);
	}

	componentDidMount() {
		this.setActiveEditor();
		this.applyIncomingMessage(this.props);

		if (this.props.showMediaMenu) {
			this.mediaMenuLoaded = true;
		}

		// eslint-disable-next-line react/no-did-mount-set-state
		this.setState({ show: true }, () => {
			if (this.props.autofocus) {
				setTimeout( () => {
					this.base.scrollIntoView();
					let m = this.base.querySelector('input,textarea,iframe');
					if (m) m.focus();
					this.base.scrollIntoView();
					// this.editor.focus();
				}, 50);
			}
		});
	}

	componentWillReceiveProps(nextProps) {
		if (getId(nextProps.message)!==getId(this.props.message) || nextProps.mode!==this.props.mode) {
			this.applyIncomingMessage(nextProps, !this.props.message.draftId);
		}
		if (nextProps.mediaBuffer && nextProps.mediaBuffer.data) {
			this.consumeMediaBuffer(nextProps);
		}
		if (!this.props.showMediaMenu && nextProps.showMediaMenu) {
			this.mediaMenuLoaded = true;
			this.props.setPreviewAttachment();
		}
		this.setDefaultFromAccountId(nextProps);
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (!shallowEqual(nextProps, this.props)) return true;
		// shallowEqual(), but special-casing body to see exempt self-inflicted changes to it.
		for (let i in nextState) {
			if (nextState[i]!==this.state[i]) {
				if (i==='body' && nextState.body===this._bodyFromDocument) continue;
				return true;
			}
		}
		for (let i in this.state) if (!(i in nextState)) return true;
		return false;
	}

	componentWillUnmount() {
		this.unsetActiveEditor();

		if (this.props.showMediaMenu) {
			this.toggleMediaMenu();
		}
	}

	render({
		accounts,
		message,
		textareaPlaceholder,
		showMediaMenu,
		onDelete,
		inline,
		matchesScreenMd
	}, {
		show,
		loading,
		error,
		mode,
		simple,
		showCc,
		showAttachmentForwardConfirm,
		to,
		cc,
		bcc,
		subject,
		body,
		attachments,
		fromAccountId,
		attachmentInProgress
	}) {
		//Don't allow the user to hide showing the cc/bcc fields if there is any content in cc/bcc fields
		const showCcToggleControl = !((cc && cc.length) || (bcc && bcc.length));
		const enableFromSelect = accounts.length > 1;
		const fromOptions = accounts.map(a => ({
			value: a.id,
			label: a.fromDisplay
				? matchesScreenMd
					? <span>{a.fromDisplay} &lt;{a.emailAddress}&gt;</span>
					: a.fromDisplay
				: a.emailAddress
		}));
		const isSendInProgress = attachmentInProgress || loading;

		return (
			<div class={style.composer}>
				<div class={style.inner}>
					<div class={cx(style.left, showMediaMenu && style.mediaMenuOpen)}>
						{!inline && (
							<Icon
								class={cx(style.closeButton, style.hideSmDown)}
								name="close"
								size="sm"
								onClick={this.close}
							/>
						)}
						<div class={style.fields}>
							<div class={style.header}>
								<div class={style.item}>
									<div class={style.from}>
										From
										{enableFromSelect ?
											<Select
												value={fromAccountId}
												onChange={this.handleChangeFrom}
												class={style.fromValue}
												collapseLabel
												noBorder
											>
												{fromOptions.map(option =>
													<option value={option.value}>{option.label}</option>
												)}
											</Select>
											:
											<div class={style.fromValue}>{get(fromOptions, '0.label')}</div>
										}
									</div>
								</div>

								<div class={style.item}>
									<AddressField
										class={style.addressField}
										tokenInputClass={style.tokenInput}
										label="To"
										value={to}
										onChange={this.handleChangeTo}
									/>
									<Button class={style.toggleCc} styleType="text" onClick={this.toggleCc}>
										{ showCc ? showCcToggleControl && <Text id="composer.HIDE_CC" /> : <Text id="composer.SHOW_CC" /> }
									</Button>
								</div>

								{ showCc && (
									<div class={style.item}>
										<AddressField
											class={style.addressField}
											tokenInputClass={style.tokenInput}
											label="Cc"
											value={cc}
											onChange={this.handleChangeCc}
										/>
									</div>
								) }

								{ showCc && (
									<div class={style.item}>
										<AddressField
											class={style.addressField}
											tokenInputClass={style.tokenInput}
											label="Bcc"
											value={bcc}
											onChange={this.handleChangeBcc}
										/>
									</div>
								) }

								{ !simple && (
									<div class={cx(style.item, style.itemInput, style.subjectInput)}>
										<Localizer>
											<input
												class={style.subject}
												placeholder={<Text id="composer.SUBJECT" />}
												value={subject}
												onInput={this.handleChangeSubject}
											/>
										</Localizer>
										<div class={cx(style.hideMdUp, style.actionMenuAttachments)}>
											<ActionMenuComposeAttachments
												onChooseAttachment={this.chooseAttachments}
												onOpenMediaMenu={this.openTab}
												iconOnly
												monotone
												arrow={false}
												actionButtonClass={style.actionMenuAttachmentsButton}
												popoverClass={style.actionMenuAttachmentsPopover}
												iconClass={style.actionMenuAttachmentsIcon}
											/>
										</div>
									</div>
								) }
							</div>

							<div class={style.body}>
								{ mode===TEXT_MODE ? (
									<Textarea
										placeholder={textareaPlaceholder}
										value={body || ''}
										onInput={this.handleInput}
										ref={this.editorRef}
										attachments={attachments.filter(isAttachmentDisposition)}
										onChooseAttachment={this.chooseAttachments}
										onRemoveAttachment={this.removeAttachment}
										onToggleTextMode={this.toggleTextMode}
										onSend={this.send}
										onDelete={onDelete}
										isSendInProgress={isSendInProgress}
									/>
								) : (
									<RichTextArea
										class={style.editor}
										stylesheet={EDITOR_STYLESHEET}
										placeholder={textareaPlaceholder}
										value={show ? (body || '<p style="margin: 0;"><span><br></span></p>') : '&nbsp;<br><br>'}
										onClick={this.handleBodyClick}
										onFocusIn={this.handleTextAreaFocusIn}
										onInput={this.handleInput}
										attachments={attachments.filter(isAttachmentDisposition)}
										onAttachFiles={this.addAttachments}
										onChooseAttachment={this.chooseAttachments}
										onRemoveAttachment={this.removeAttachment}
										onEmbedFiles={this.embedImages}
										onEmbedLinks={this.embedLinks}
										onAddLink={this.addLink}
										onEmojiSelect={this.addEmoji}
										onToggleMediaMenu={this.toggleMediaMenu}
										onToggleTextMode={this.toggleTextMode}
										onOpenTab={this.openTab}
										onSend={this.send}
										onDelete={onDelete}
										isSendInProgress={isSendInProgress}
										messageLastSaved={message.date}
										matchesScreenMd={matchesScreenMd}
										ref={this.editorRef}
									/>
								) }
							</div>
						</div>
					</div>

					<div class={cx(style.right, showMediaMenu && style.mediaMenuOpen, inline && style.rightPane)}>
						{this.mediaMenuLoaded && (
							<h4>Please upgrade to use the Media Menu</h4>
						)}
					</div>
				</div>

				{ error && (
					<div class={style.footer}>
						<div class={style.error}>{error}</div>
					</div>
				) }

				{ showAttachmentForwardConfirm && (
					<ConfirmAttachmentForwardDialog onConfirm={this.handleAttachmentForwardConfirm} />
				) }
				{ !inline && (
					<ComposerToolbar
						onSend={this.send}
						onClose={this.close}
					/>
				)}
			</div>
		);
	}
}
