import { h, Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import { isTopLevelFolder } from '../../utils/folders';

import ActionMenuGroup from '../action-menu-group';
import ActionMenuItem from '../action-menu-item';
import ContextMenuMoveFolder from '../context-menu-move-folder';
import ColorPicker from '../color-picker';

import s from './style.less';

const MarkReadOption = ({ onMarkFolderRead, folder }) => (
	<ActionMenuItem
		onClick={onMarkFolderRead}
		disabled={!folder.unread || folder.unread === 0}
	>
		<Text id="mail.contextMenu.MARK_READ" />
	</ActionMenuItem>
);

const EmptyOption = ({ onEmptyFolder, textId }) => (
	<ActionMenuItem onClick={onEmptyFolder}>
		<Text id={textId} />
	</ActionMenuItem>
);

export const InboxContextMenu = props => (
	<ActionMenuGroup>
		<MarkReadOption {...props} />
		{/*
			@TODO Zimbra SOAP does not support moving all email in a given folder
			which is required for this menu option

			<ActionMenuItem onClick={onArchive}>
				Archive all emails
			</ActionMenuItem>
		*/}
	</ActionMenuGroup>
);

export const SpamContextMenu = props => (
	<ActionMenuGroup>
		<MarkReadOption {...props} />
		<EmptyOption {...props} textId="mail.contextMenu.EMPTY_JUNK" />
	</ActionMenuGroup>
);

export const TrashContextMenu = props => (
	<ActionMenuGroup>
		<MarkReadOption {...props} />
		<EmptyOption {...props} textId="mail.contextMenu.EMPTY_TRASH" />
	</ActionMenuGroup>
);

export const SpecialFolderContextMenu = props => (
	<ActionMenuGroup>
		<MarkReadOption {...props} />
	</ActionMenuGroup>
);

export const FolderGroupContextMenu = ({ onCreateFolder, onFindFolder }) => (
	<ActionMenuGroup>
		<ActionMenuItem onClick={onCreateFolder}>
			<Text id="mail.contextMenu.CREATE_FOLDER" />
		</ActionMenuItem>
		<ActionMenuItem onClick={onFindFolder}>
			<Text id="mail.contextMenu.FIND_FOLDER" />
		</ActionMenuItem>
	</ActionMenuGroup>
);

export const mailContextMenu = (
	onMarkRead,
	onMarkUnread,
	onStar,
	onClearStar,
	onBlock,
	onMarkSpam,
	onArchive,
	onDelete,
	onAddSenderContacts,
) => (
	<div>
		<ActionMenuGroup>
			<ActionMenuItem onClick={onMarkRead}>
				<Text id="mail.contextMenu.MARK_AS_READ" />
			</ActionMenuItem>
			<ActionMenuItem onClick={onMarkUnread}>
				<Text id="mail.contextMenu.MARK_AS_UNREAD" />
			</ActionMenuItem>
			<ActionMenuItem onClick={onStar}>
				<Text id="mail.contextMenu.STAR" />
			</ActionMenuItem>
			<ActionMenuItem onClick={onClearStar}>
				<Text id="mail.contextMenu.CLEAR_STAR" />
			</ActionMenuItem>
			<ActionMenuItem onClick={onBlock}>
				<Text id="mail.contextMenu.BLOCK" />
			</ActionMenuItem>
		</ActionMenuGroup>
		<ActionMenuGroup>
			<ActionMenuItem onClick={onMarkSpam}>
				<Text id="mail.contextMenu.MARK_AS_SPAM" />
			</ActionMenuItem>
			<ActionMenuItem onClick={onArchive}>
				<Text id="mail.contextMenu.ARCHIVE" />
			</ActionMenuItem>
			<ActionMenuItem onClick={onDelete}>
				<Text id="mail.contextMenu.DELETE_MESSAGE" />
			</ActionMenuItem>
		</ActionMenuGroup>
		<ActionMenuGroup>
			<ActionMenuItem onClick={onAddSenderContacts}>
				<Text id="mail.contextMenu.ADD_SENDER_CONTACTS" />
			</ActionMenuItem>
		</ActionMenuGroup>
	</div>
);

export class DefaultFolderContextMenu extends Component {
	state = {
		showMoveFolderPicker: false
	};

	toggleShowMoveFolderPicker = e => {
		e.stopPropagation();
		this.setState({ showMoveFolderPicker: !this.state.showMoveFolderPicker });
	};

	handleMoveToTopLevel = () => {
		this.props.onMoveFolder();
	};

	render(props, { showMoveFolderPicker }) {
		return (
			<div
				class={cx(s.defaultContainer, showMoveFolderPicker && s.showingPicker)}
			>
				{showMoveFolderPicker ? (
					<div>
						<ActionMenuGroup class={s.moveFolderGroup}>
							<ContextMenuMoveFolder
								activeFolder={props.folder}
								folders={props.folders}
								onMove={props.onMoveFolder}
								onCancelMove={this.toggleShowMoveFolderPicker}
							/>
						</ActionMenuGroup>
						<ActionMenuGroup>
							<ActionMenuItem
								onClick={this.handleMoveToTopLevel}
								disabled={isTopLevelFolder(props.folder)}
							>
								<Text id="mail.contextMenu.PLACE_TOP_LEVEL" />
							</ActionMenuItem>
						</ActionMenuGroup>
					</div>
				) : (
					<div>
						<ActionMenuGroup>
							<MarkReadOption {...props} />
						</ActionMenuGroup>
						<ActionMenuGroup>
							<ActionMenuItem onClick={props.onRenameFolder}>
								<Text id="mail.contextMenu.RENAME_FOLDER" />
							</ActionMenuItem>
							<ActionMenuItem onClick={this.toggleShowMoveFolderPicker}>
								<Text id="mail.contextMenu.MOVE_FOLDER" />
							</ActionMenuItem>
							<ActionMenuItem
								onClick={props.onDeleteFolder}
								disabled={props.folder.folder}
							>
								<Text id="mail.contextMenu.DELETE_FOLDER" />
							</ActionMenuItem>
							<ActionMenuItem onClick={props.onCreateSubFolder}>
								<Text id="mail.contextMenu.CREATE_SUBFOLDER" />
							</ActionMenuItem>
						</ActionMenuGroup>
					</div>
				)}
			</div>
		);
	}
}

export const CalendarContextMenu = ({
	colorValue,
	// onEditCalendar,
	onShare,
	onImport,
	onExport,
	onChangeColor,
	disabled
}) => (
	<div>
		<ActionMenuGroup>
			{/*<ActionMenuItem onClick={onEditCalendar} disabled={disabled}>
				<Text id="calendar.contextMenu.editCalendar" />
			</ActionMenuItem>*/}
			<ActionMenuItem onClick={onShare} disabled={disabled} narrow>
				<Text id="calendar.contextMenu.share" />
			</ActionMenuItem>
			<ActionMenuItem onClick={onImport} narrow>
				<Text id="calendar.sidebar.actions.IMPORT_CALENDAR" />
			</ActionMenuItem>
			<ActionMenuItem onClick={onExport} narrow>
				<Text id="calendar.sidebar.actions.EXPORT_CALENDAR" />
			</ActionMenuItem>
		</ActionMenuGroup>
		<ActionMenuGroup>
			<ColorPicker
				class={s.colorPicker}
				value={colorValue}
				onChange={onChangeColor}
			/>
		</ActionMenuGroup>
	</div>
);

export const OtherCalendarContextMenu = ({
	colorValue,
	onUnlink,
	onChangeColor
}) => (
	<div>
		<ActionMenuGroup>
			{/*<ActionMenuItem onClick={onEditCalendar} disabled={disabled}>
				<Text id="calendar.contextMenu.editCalendar" />
			</ActionMenuItem>*/}
			<ActionMenuItem onClick={onUnlink}>
				<Text id="calendar.contextMenu.unlink" />
			</ActionMenuItem>
			<ActionMenuGroup>
				<ColorPicker
					class={s.colorPicker}
					value={colorValue}
					onChange={onChangeColor}
				/>
			</ActionMenuGroup>
		</ActionMenuGroup>
	</div>
);

export const OtherCalendarsSectionContextMenu = ({
	onAddFriendsCalendarClicked
}) => (
	<div>
		<ActionMenuGroup>
			<ActionMenuItem onClick={onAddFriendsCalendarClicked}>
				<Text id="calendar.contextMenu.linkShared" />
			</ActionMenuItem>
		</ActionMenuGroup>
	</div>
);

export function isRenameAllowed(Menu) {
	return ~[DefaultFolderContextMenu].indexOf(Menu);
}
