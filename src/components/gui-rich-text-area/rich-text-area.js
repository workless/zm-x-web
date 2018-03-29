import { h, Component } from 'preact';
import { moveSelectionOutOfNonEditableArea } from '../../lib/html-email';
import sanitize, { doSanitize } from '../../lib/html-viewer/sanitize';
import { ensureCssReset } from '../../lib/html-viewer';

//regex list of tags, that if present in the body will hide the placeholder text if no other text is in the body
const HIDE_PLACEHOLDER_REGEX = /<(?:img|li)/i;

function moveChildren(oldParent, newParent, skip) {
	let child = oldParent.firstChild;
	while (child) {
		let next = child.nextSibling;
		if (child!==skip) {
			newParent.appendChild(child);
		}
		child = next;
	}
}

export default class RichTextArea extends Component {
	getBase = () => this.base;

	focus = () => {
		this.base.focus();

		let selection = getSelection(),
			range = selection.rangeCount && selection.getRangeAt(0),
			parent = range ? range.commonAncestorContainer : selection.anchorNode;
		if (parent==null || (parent!==this.base && !this.base.contains(parent))) {
			selection.removeAllRanges();
			range = document.createRange();
			range.setStartAfter(this.base.lastChild);
			range.collapse(true);
			selection.addRange(range);
			this.base.focus();
		}
	};

	blur = () => {
		this.base.blur();
	};

	handleSelectionChange = () => {
		moveSelectionOutOfNonEditableArea(this.base);
	}

	handleFocus = (e) => {
		moveSelectionOutOfNonEditableArea(this.base);
		this.handleEvent(e);
	}

	handleEvent = e => {
		let type = 'on' + e.type.toLowerCase();
		this.eventValue = this.base.innerHTML;
		this.eventValueTime = Date.now();
		this.updatePlaceholder();
		e.value = this.eventValue;
		for (let i in this.props) {
			if (this.props.hasOwnProperty(i) && i.toLowerCase()===type) {
				this.props[i](e);
			}
		}
	};

	updatePlaceholder() {
		clearTimeout(this.updatePlaceholderTimer);
		this.updatePlaceholderTimer = setTimeout(this.updatePlaceholderSync, 100);
	}

	updatePlaceholderSync = () => {
		if (!this.base.textContent && !HIDE_PLACEHOLDER_REGEX.test(this.base.innerHTML)) {
			this.base.setAttribute('data-empty', '');
		}
		else if (this.base.hasAttribute('data-empty')) {
			this.base.removeAttribute('data-empty');
		}
	};

	handlePaste = e => {
		if (this.props.onPaste) this.props.onPaste(e);
		this.scheduleCleanup();
	};

	scheduleCleanup() {
		if (this.cleanupTimer!=null) return;
		this.cleanupTimer = setTimeout(this.cleanupSync);
	}

	cleanupSync = () => {
		// Insert an element at the cursor so we can find it after sanitizing.
		let selection = window.getSelection();
		let range = selection.rangeCount && selection.getRangeAt(0);
		let sentinel = document.createElement('span');
		sentinel.setAttribute('data-contains-cursor', 'true');
		if (range) range.insertNode(sentinel);

		clearTimeout(this.cleanupTimer);
		this.cleanupTimer = null;

		// Copy children into a <body> element for sanitization
		let body = document.createElement('body');
		// insert a dummy text node so DOMPurify doesn't remove the first real element
		let dummy = document.createTextNode('');
		body.appendChild(dummy);

		moveChildren(this.base, body);

		let doc = doSanitize(body, [], true);

		let lastChild = doc.body.lastChild;

		moveChildren(doc.body, this.base, dummy);

		// Restore the selection by traversing its path in the new DOM:
		this.base.focus();
		selection = window.getSelection();
		selection.removeAllRanges();
		range = document.createRange();
		let removeSentinel = true;

		// if the sentinel got replaced during sanitization, find its replacement:
		if (sentinel==null || !this.base.contains(sentinel)) {
			sentinel = this.base.querySelector('[data-contains-cursor]');
		}

		if (sentinel==null) {
			removeSentinel = false;
			sentinel = this.base.lastChild || lastChild;
		}

		if (sentinel!=null) {
			range.setStartAfter(sentinel);
			range.collapse(true);
			selection.addRange(range);
			if (removeSentinel) sentinel.parentNode.removeChild(sentinel);
		}
	};

	// Creates a safe wrapper around a document command
	createCommandProxy = type => (...args) => {
		try {
			return document[type](...args);
		}
		catch (err) {}
	};

	execCommand = this.createCommandProxy('execCommand');
	queryCommandState = this.createCommandProxy('queryCommandState');
	queryCommandValue = this.createCommandProxy('queryCommandValue');

	getDocument() {
		let { base } = this;
		if (base.body==null) {
			base.body = base;
			base.getElementById = id => base.querySelector('#'+id);
		}
		return base;
	}

	getResolvedValue({ value, stylesheet }) {
		let html = value==null ? '' : String(value);
		if (!html.match(/<html>/)) {
			html = `<!DOCTYPE html><html><head></head><body>${html}</body></html>`;
		}
		if (stylesheet) {
			// Try to inject the stylesheet at the end of the docment head. If there isn't one, append it:
			if (html === (html = html.replace('</head>', `</head><style>${stylesheet}</style>`))) {
				html += `<style>${stylesheet}</style>`;
			}
		}
		let sanitized = html.length===0 ? '' : sanitize(html);
		return sanitized;
	}

	setContent(html) {
		this.base.innerHTML = this.eventValue = html;
	}

	componentDidMount() {
		if (this.props.value || this.props.stylesheet) {
			this.setContent(this.getResolvedValue(this.props));
		}

		document.addEventListener('selectionchange', this.handleSelectionChange);
	}

	shouldComponentUpdate(nextProps) {
		if (nextProps.value!==this.props.value || nextProps.stylesheet!==this.props.stylesheet) {
			if (nextProps.value!==this.eventValue) {
				this.setContent(this.getResolvedValue(nextProps));
				this.updatePlaceholder();
			}
		}
		return false;
	}

	componentWillUnmount() {
		let child;
		while ((child = this.base.lastChild)) {
			this.base.removeChild(child);
		}

		document.removeEventListener('selectionchange', this.handleSelectionChange);
	}

	render({ children, value, stylesheet, ...props }) {
		let resetId = ensureCssReset();

		return (
			<rich-text-area
				{...props}
				contentEditable
				data-css-reset={resetId}
				onFocus={this.handleFocus}
				onInput={this.handleEvent}
				onKeyDown={this.handleEvent}
				onKeyUp={this.handleEvent}
				onChange={this.handleEvent}
				onPaste={this.handlePaste}
			/>
		);
	}
}
