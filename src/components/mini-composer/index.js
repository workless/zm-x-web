import { h, Component } from 'preact';
import linkref from 'linkref';
import cx from 'classnames';
import debounce from '@zimbra/util/src/debounce';
import composerStyle from '../composer/style';
import styles from './style';
import SimpleToolbar from '../gui-rich-text-area/components/toolbar/simple-toolbar';
import * as documentCommands from '../../utils/rich-text-area';
import { MAX_RANGE_REUSES, WATCH_COMMAND_STATE_PROPERTIES } from '../../constants/rich-text-area';
import RichTextArea from '../gui-rich-text-area/rich-text-area';
import { getId } from '../../lib/util';

export default class MiniComposer extends Component {
	state = {
		body: ''
	};

	focus = () => {
		if (this.refs && this.refs.rte) {
			this.restoreRange();
		}
	};

	exec = (command, ...args) => {
		if (this.refs.rte) {
			let commandName = args[0];
			this.focus();

			let execResult = documentCommands[command](...args);
			if (WATCH_COMMAND_STATE_PROPERTIES.indexOf(commandName) !== -1) this.setCommandState();
			return execResult;
		}
	};

	handleInput = e => {
		this.setCommandState();
		this.props.onInput && this.props.onInput(e);
	};

	handleChange = e => {
		this.setCommandState();
		this.props.onChange && this.props.onChange(e);
	};

	findAncestorAnchorTag(tag) {
		if (tag.hasAttribute('href')) {
			return tag;
		}

		while (tag.parentNode) {
			tag = tag.parentNode;
			if (tag.tagName === 'A' && tag.hasAttribute('editor-inserted-link')) {
				return tag;
			}
		}
	}

	handleClick = e => {
		e.preventDefault();

		let anchorTagNode = this.findAncestorAnchorTag(e.target);

		if (anchorTagNode) {
			this.showLinkEditorDialog({
				url: anchorTagNode.getAttribute('href'),
				text: anchorTagNode.innerText,
				editedLink: anchorTagNode
			});
		}

		this.props.onClick && this.props.onClick(e);
	};

	saveRange = () => {
		let selection = window.getSelection();
		if (selection.getRangeAt && selection.rangeCount) {
			this.range = selection.getRangeAt(0);
			this.rangeUses = 0;
		}
	};

	restoreRange = () => {
		this.refs.rte.focus();
		// As a failsafe, only reuse the same saved range up to 3 times.
		if (this.range && this.rangeUses < MAX_RANGE_REUSES) {
			let selection = window.getSelection();
			selection.removeAllRanges();
			selection.addRange(this.range);
			this.rangeUses++;
		}
	};

	/** Set up the editor based on incoming props
	 *	@param {Message} props.message
	 */
	applyIncomingMessage({ message }, isUpdatedDraftMessage = false) {
		if (typeof message === 'undefined') {
			throw new Error('Message not passed');
		}

		if (!isUpdatedDraftMessage) {
			this.setState({
				body: message || ''
			});
		}

		if (!message.draftId) {
			this.setState({
				originalMessage: message
			});
		}
	}

	handleBlur = () => {
		this.saveRange();
	};

	setCommandState = debounce(() => {
		this.setState({
			commandState: documentCommands.getCommandState()
		});
	}, 100)

	componentDidMount() {
		this.applyIncomingMessage(this.props);
	}

	componentWillReceiveProps(nextProps) {
		if (getId(nextProps.message) !== getId(this.props.message)) {
			this.applyIncomingMessage(nextProps, !this.props.message.draftId);
		}
	}

	render = ({}, { body, commandState }) => (
		<div class={cx(composerStyle.composer, styles.composer)}>
			<div class={composerStyle.inner}>
				<div class={composerStyle.fields}>
					<div class={composerStyle.body}>
						<SimpleToolbar exec={this.exec} commandState={commandState} />
						<RichTextArea
							ref={linkref(this, 'rte')}
							class={composerStyle.editor}
							onBlur={this.handleBlur}
							onClick={this.handleClick}
							onInput={this.handleInput}
							onChange={this.handleChange}
							onBeforeDeactivate={this.saveRange}
							onActivate={this.restoreRange}
							value={body}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
