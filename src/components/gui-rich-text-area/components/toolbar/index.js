import { h } from 'preact';
import { MediaMenuButton } from '../../../media-menu';
import { Button, Spinner, ContainerSize } from '@zimbra/blocks';
import { Text } from 'preact-i18n';
import format from 'date-fns/format';
import PureComponent from '../../../../lib/pure-component';
import { TEXT_MODE } from '../../../../constants/composer';
import { TABS as MEDIA_MENU_TABS, WEB_LINKS } from '../../../../store/media-menu/constants';

import get from 'lodash-es/get';
import cx from 'classnames';
import styles from './style';

import { MY_COMPUTER, generateAttachmentMenu } from './attachment-menu-options';
import { INSERT_LINK, generateInsertLinkMenu } from './link-menu-options';

import { generateFontMenu } from './font-menu-options';
import { generateColorMenu } from './color-menu-options';

import linkref from 'linkref';
import CollapsedSubmenu from './collapsed-submenu';
import { SplitPaneMenu } from './split-pane-menu';
import { SelectMenu } from './select-menu';
import { CommandButton } from './command-button';
import { EmojiMenu } from './emoji';

export const COMMAND_TYPE = {
	MENU: 'menu',
	COLOR: 'color',
	NORMAL: 'normal',
	TOGGLE: 'toggle',
	LINK: 'link',
	ATTACHMENT: 'attachment'
};

let cmd = (icon, command, type, extra={}) => ({ name, icon, command, type, ...extra });

export default class Toolbar extends PureComponent {
	static defaultProps = {
		collapseRange: [ 1, 9 ]
	}

	commands = [
		generateAttachmentMenu(cmd, this.props),
		generateFontMenu(cmd, this.props),
		cmd('bold', 'bold', COMMAND_TYPE.TOGGLE, { watch: true, title: 'titleBold' }),
		cmd('italic', 'italic', COMMAND_TYPE.TOGGLE, { watch: true, title: 'titleItalic' }),
		cmd('underline', 'underline', COMMAND_TYPE.TOGGLE, { watch: true, title: 'titleUnderline' }),
		generateColorMenu(cmd, this.props),
		cmd('list-ul', null, COMMAND_TYPE.MENU, {
			title: 'listsTitle',
			submenu: [
				{
					iconMenu: true,
					menuItems: [
						cmd(
							null,
							'insertunorderedlist',
							COMMAND_TYPE.TOGGLE,
							{
								icon: 'list-ul'
							}
						),
						cmd(
							null,
							'insertorderedlist',
							COMMAND_TYPE.TOGGLE,
							{
								icon: 'list-ol'
							}
						)
					]
				}
			]
		}),
		cmd('indent ', null, COMMAND_TYPE.MENU, {
			title: 'indentationTitle',
			submenu: [
				{
					iconMenu: true,
					menuItems: [
						cmd(null, 'indent', COMMAND_TYPE.NORMAL,
							{
								icon: 'indent'
							}
						),
						cmd(null, 'outdent', COMMAND_TYPE.NORMAL,
							{
								icon: 'outdent'
							}
						)
					]
				}
			]
		}),
		cmd('align-left ', null, 'menu', {
			title: 'alignmentTitle',
			submenu: [
				{
					iconMenu: true,
					menuItems: [
						cmd(null, 'justifyLeft', COMMAND_TYPE.NORMAL,
							{
								icon: 'align-left',
								value: true
							}
						),
						cmd(null, 'justifyCenter', COMMAND_TYPE.NORMAL,
							{
								icon: 'align-center',
								value: true
							}
						),
						cmd(null, 'justifyRight', COMMAND_TYPE.NORMAL,
							{
								icon: 'align-right',
								value: true
							}
						)
					]
				}
			]
		}),
		generateInsertLinkMenu(cmd)
	]

	// The number of buttons in the "middle" element
	numCommands = this.commands.length + 3

	handleAttachmentOptionSelection = (value) => {
		if (value === MY_COMPUTER) {
			this.props.onChooseAttachment &&
				this.props.onChooseAttachment();
		}
		else {
			this.props.onOpenTab && this.props.onOpenTab(MEDIA_MENU_TABS.indexOf(value));
		}
	}

	handleBeforeResize = () => {
		const middle = get(this.refs, 'middle'),
			children = middle && middle.childNodes;

		if (!children) { return; }

		// If children are not equal width, there can be flashing when expanding.
		const width = middle.offsetWidth,
			commands = [].slice.call(children),
			avgChildWidth = commands.reduce((acc, { offsetWidth }) => acc + (offsetWidth || 0), 0) / commands.length,
			canShowNumCommands = Math.floor(width / avgChildWidth),
			collapsed = canShowNumCommands < this.numCommands;

		this.state.collapsed !== collapsed && this.setState({ collapsed });
	}


	execCommand = ({ command, type, value }) => {
		let { exec } = this.props;
		if 	(type === COMMAND_TYPE.ATTACHMENT) {
			this.handleAttachmentOptionSelection(value);
		}
		else if (type === COMMAND_TYPE.LINK) {
			if (value === INSERT_LINK) {
				return this.props.showLinkEditorDialog();
			}
			else if (value === WEB_LINKS) {
				this.handleAttachmentOptionSelection(value);
			}
		}
		else if (type === COMMAND_TYPE.TOGGLE) {
			value = !exec('queryCommandState', command);
		}
		else if (!value && type === COMMAND_TYPE.NORMAL) {
			value = true;
		}
		exec('execCommand', command, false, value);
	}

	componentDidMount() {
		this.timer = setInterval( () => this.setState({}), 1000);
	}

	componentWillUnmount() {
		clearInterval(this.timer);
	}

	renderCommand = ({ command, icon, label, type, submenu, title, style, watch, ...props }) => (
		submenu ?
			submenu.length > 1 ?
				<SplitPaneMenu
					onChange={this.execCommand}
					menuIcon={icon}
					submenu={submenu}
					title={title}
				/>
				:
				<SelectMenu
					onChange={this.execCommand}
					menuIcon={icon}
					submenu={submenu[0]}
					title={title}
				/>
			:
			<CommandButton
				command={command}
				commandType={type}
				icon={icon}
				class={props.class}
				title={title}
				label={label}
				commandState={this.props.commandState}
				execCommand={this.execCommand}
			/>
	)

	render({
		overlay,
		mode,
		isSendInProgress,
		messageLastSaved,
		onSend,
		onDelete,
		onToggleTextMode,
		onToggleMediaMenu,
		onEmojiSelect,
		collapseRange = [],
		...props
	}, { collapsed }) {
		delete props.commandState;
		const isPlainText = mode === TEXT_MODE;

		return (
			<div {...props} class={cx(styles.container, props.class)}>
				<ContainerSize width={false} height={false} onBeforeResize={this.handleBeforeResize}>
					<div class={styles.toolbar}>
						<div class={styles.left}>
							<SendButton onClick={onSend} disabled={isSendInProgress} />
							<div class={styles.middle} ref={linkref(this, 'middle')}>
								{ isPlainText ? (
									this.renderCommand(this.commands[0])
								) : collapsed ? ([
									...this.commands.slice(0, collapseRange[0]).map(this.renderCommand),
									<CollapsedSubmenu
										commands={this.commands.slice(collapseRange[0], collapseRange[1])}
										renderCommand={this.renderCommand}
									/>,
									...this.commands.slice(collapseRange[1]).map(this.renderCommand)
								]) : (
									this.commands.map(this.renderCommand)
								)}
								{ !isPlainText && <EmojiMenu onEmojiSelect={onEmojiSelect} />}
								<ToggleTextModeButton isPlainText={isPlainText} onClick={onToggleTextMode} />
								<TrashButton onClick={onDelete} />
							</div>
							<SavedAt date={messageLastSaved} />
						</div>
						{ !isPlainText && (
							<div class={styles.right}>
								<MediaMenuButton onClick={onToggleMediaMenu} />
							</div>
						)}
					</div>
				</ContainerSize>
				{overlay}
			</div>
		);
	}
}

function SavedAt({ date }) {
	return date && (
		<span class={styles.saved}>
			<Text id="composer.SAVED" fields={{ time: format(date, 'h:mm A') }} />
		</span>
	);
}

function ToggleTextModeButton({ isPlainText, ...props }) {
	return (
		<CommandButton
			{...props}
			title={`togglePlaintext.${String(Boolean(isPlainText))}`}
			icon={`angle-double-${isPlainText ? 'right': 'left'}`}
		/>
	);
}

function TrashButton(props) {
	return (
		<CommandButton
			{...props}
			title="deleteDraft"
			class={cx(styles.delete, props.class)}
			icon="trash"
		/>
	);
}

function SendButton({ disabled, ...props }) {
	return (
		<Button {...props} class={cx(styles.send, props.class)} disabled={disabled}>
			<Text id="buttons.send" />
			<span>
				{ disabled && <Spinner dark /> }
			</span>
		</Button>
	);
}
