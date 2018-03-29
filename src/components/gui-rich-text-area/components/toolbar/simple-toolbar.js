import { h } from 'preact';
import { ContainerSize } from '@zimbra/blocks';
import { Text } from 'preact-i18n';
import format from 'date-fns/format';
import PureComponent from '../../../../lib/pure-component';
import {
	TABS as MEDIA_MENU_TABS,
	WEB_LINKS
} from '../../../../store/media-menu/constants';

import get from 'lodash-es/get';
import cx from 'classnames';
import styles from './style';

import { MY_COMPUTER } from './attachment-menu-options';
import { INSERT_LINK, generateInsertLinkMenu } from './link-menu-options';

import { generateFontMenu } from './font-menu-options';
import { generateColorMenu } from './color-menu-options';

import linkref from 'linkref';
import { SplitPaneMenu } from './split-pane-menu';
import { SelectMenu } from './select-menu';
import { CommandButton } from './command-button';

export const COMMAND_TYPE = {
	MENU: 'menu',
	COLOR: 'color',
	NORMAL: 'normal',
	TOGGLE: 'toggle',
	LINK: 'link',
	ATTACHMENT: 'attachment'
};

let cmd = (icon, command, type, extra = {}) => ({
	name,
	icon,
	command,
	type,
	...extra
});

export default class SimpleToolbar extends PureComponent {
	commands = [
		generateFontMenu(cmd, this.props),
		cmd('bold', 'bold', COMMAND_TYPE.TOGGLE, {
			watch: true,
			title: 'titleBold'
		}),
		cmd('italic', 'italic', COMMAND_TYPE.TOGGLE, {
			watch: true,
			title: 'titleItalic'
		}),
		cmd('underline', 'underline', COMMAND_TYPE.TOGGLE, {
			watch: true,
			title: 'titleUnderline'
		}),
		generateColorMenu(cmd, this.props),
		cmd('list-ul', null, COMMAND_TYPE.MENU, {
			title: 'listsTitle',
			submenu: [
				{
					iconMenu: true,
					menuItems: [
						cmd(null, 'insertunorderedlist', COMMAND_TYPE.TOGGLE, {
							icon: 'list-ul'
						}),
						cmd(null, 'insertorderedlist', COMMAND_TYPE.TOGGLE, {
							icon: 'list-ol'
						})
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
						cmd(null, 'indent', COMMAND_TYPE.NORMAL, {
							icon: 'indent'
						}),
						cmd(null, 'outdent', COMMAND_TYPE.NORMAL, {
							icon: 'outdent'
						})
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
						cmd(null, 'justifyLeft', COMMAND_TYPE.NORMAL, {
							icon: 'align-left',
							value: true
						}),
						cmd(null, 'justifyCenter', COMMAND_TYPE.NORMAL, {
							icon: 'align-center',
							value: true
						}),
						cmd(null, 'justifyRight', COMMAND_TYPE.NORMAL, {
							icon: 'align-right',
							value: true
						})
					]
				}
			]
		}),
		generateInsertLinkMenu(cmd)
	];

	// The number of buttons in the "middle" element
	numCommands = this.commands.length + 3;

	handleAttachmentOptionSelection = value => {
		if (value === MY_COMPUTER) {
			this.props.onChooseAttachment && this.props.onChooseAttachment();
		}
		else {
			this.props.onOpenTab &&
				this.props.onOpenTab(MEDIA_MENU_TABS.indexOf(value));
		}
	};

	handleBeforeResize = () => {
		const middle = get(this.refs, 'middle'),
			children = middle && middle.childNodes;

		if (!children) {
			return;
		}

		// If children are not equal width, there can be flashing when expanding.
		const width = middle.offsetWidth,
			commands = [].slice.call(children),
			avgChildWidth =
				commands.reduce((acc, { offsetWidth }) => acc + (offsetWidth || 0), 0) /
				commands.length,
			canShowNumCommands = Math.floor(width / avgChildWidth),
			collapsed = canShowNumCommands < this.numCommands;

		this.state.collapsed !== collapsed && this.setState({ collapsed });
	};

	execCommand = ({ command, type, value }) => {
		let { exec } = this.props;
		if (type === COMMAND_TYPE.ATTACHMENT) {
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
	};

	componentDidMount() {
		this.timer = setInterval(() => this.setState({}), 1000);
	}

	componentWillUnmount() {
		clearInterval(this.timer);
	}

	renderCommand = ({
		command,
		icon,
		label,
		type,
		submenu,
		title,
		style,
		watch,
		...props
	}) =>
		submenu ? (
			submenu.length > 1 ? (
				<SplitPaneMenu
					onChange={this.execCommand}
					menuIcon={icon}
					submenu={submenu}
					title={title}
				/>
			) : (
				<SelectMenu
					onChange={this.execCommand}
					menuIcon={icon}
					submenu={submenu[0]}
					title={title}
				/>
			)
		) : (
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
		);

	render({
		overlay,
		isSendInProgress,
		messageLastSaved,
		onSend,
		onDelete,
		onToggleTextMode,
		...props
	}) {
		delete props.commandState;

		return (
			<div {...props} class={cx(styles.container, props.class)}>
				<ContainerSize
					width={false}
					height={false}
					onBeforeResize={this.handleBeforeResize}
				>
					<div class={cx(styles.toolbar, styles.simpleToolbar)}>
						<div class={styles.left}>
							<div class={styles.middle} ref={linkref(this, 'middle')}>
								{this.commands.map(this.renderCommand)}
								<TrashButton onClick={onDelete} />
							</div>
							<SavedAt date={messageLastSaved} />
						</div>
					</div>
				</ContainerSize>
				{overlay}
			</div>
		);
	}
}

function SavedAt({ date }) {
	return (
		date && (
			<span class={styles.saved}>
				<Text id="composer.SAVED" fields={{ time: format(date, 'h:mm A') }} />
			</span>
		)
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
