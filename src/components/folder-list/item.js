import { h, Component } from 'preact';
import { connect } from 'preact-redux';
import { graphql } from 'react-apollo';
import { getCurrentUrl, route } from 'preact-router';
import { compose } from 'recompose';
import cx from 'classnames';
import linkstate from 'linkstate';
import { USER_FOLDER_IDS } from '../../constants';
import {
	isActiveFolder,
	isActiveOrChildFolder,
	routeToRenamedFolder
} from '../../utils/routing';
import { callWith } from '../../lib/util';
import { configure } from '../../config';
import withDialog from '../../enhancers/with-dialog';
import withMediaQuery from '../../enhancers/with-media-query';
import { minWidth, screenSmMax } from '../../constants/breakpoints';
import { Icon } from '@zimbra/blocks';
import MenuItem from '../menu-item';
import CollapsibleControl from '../collapsible-control';
import FolderInput from '../folder-input';
import NakedButton from '../naked-button';
import ContextMenu from '../context-menu';
import EmptyFolderDialog from '../empty-folder-dialog';
import DeleteFolderDialog from '../delete-folder-dialog';
import {
	isRenameAllowed,
	InboxContextMenu,
	SpecialFolderContextMenu,
	SpamContextMenu,
	TrashContextMenu
} from '../context-menus';
import { OnlyEmptyFoldersDeletedMessage } from '../notifications/messages';
import { notify } from '../../store/notifications/actions';

import ActionMutation from '../../graphql/queries/action.graphql';

import style from './style';

const DROP_ANIMATION_MAX = 500;
const CUSTOM_CONTEXT_MENUS = {
	'message.inbox': InboxContextMenu,
	'message.drafts': SpecialFolderContextMenu,
	'message.sent': SpecialFolderContextMenu,
	'message.archive': SpecialFolderContextMenu,
	'message.junk': SpamContextMenu,
	'message.trash': TrashContextMenu
};

class BaseFolderListItem extends Component {
	static defaultProps = {
		onItemClick: () => {},
		onToggleExpanded: () => {},
		foldersExpanded: {},
		depth: 1,
		menu: null,
		disableCollapse: false,
		deleteOnHover: false
	};

	state = {
		dropTarget: false,
		dropped: false,
		isRenaming: false,
		isCreatingSubFolder: false
	};

	customContextMenu = () => {
		const { customContextMenus = {}, folder, view } = this.props;
		const contextMenuKey = `${view}.${folder.name}`.toLowerCase();
		return (
			customContextMenus[contextMenuKey] || CUSTOM_CONTEXT_MENUS[contextMenuKey]
		);
	};

	handleDrop = e => {
		e.preventDefault();
		let { dropTargetType, onDrop, folder } = this.props;
		e.targetFolder = e.targetList = e.destination = folder;
		e.targetType = e.destinationType = dropTargetType || 'folder';
		if (onDrop != null) onDrop(e, folder);
		this.setState({ dropped: true });
		setTimeout(this.handleDragLeave, DROP_ANIMATION_MAX);
		return false;
	};

	handleDragOver = e => {
		e.preventDefault();
		let { onDrop, dropEffect } = this.props;
		e.dataTransfer.dropEffect = dropEffect;
		if (onDrop != null) {
			this.setState({ dropTarget: true, dropped: false });
		}
	};

	handleDragLeave = () => {
		if (this.props.onDrop != null) {
			this.setState({ dropTarget: false, dropped: false });
		}
	};

	handleMarkRead = () =>
		this.props.action({
			variables: {
				type: 'FolderAction',
				op: 'read',
				id: this.props.folder.id
			}
		});

	handleDelete = () => {
		const { folder } = this.props;

		if (folder.unread > 0) {
			this.props.notify({
				message: <OnlyEmptyFoldersDeletedMessage name={folder.name} />
			});
		}
		else {
			this.props.confirmDelete();
		}
	};

	handleRename = () => {
		this.setState({
			isRenaming: true,
			renamingInputValue: this.props.folder && this.props.folder.name
		});
	};

	handleCloseRename = () => {
		this.setState({ isRenaming: false, renamingInputValue: undefined });
	};

	handleRenameSubmit = name => {
		this.props
			.action({
				variables: {
					name,
					type: 'FolderAction',
					op: 'rename',
					id: this.props.folder.id
				}
			})
			.then(() => {
				const url = getCurrentUrl();
				if (isActiveOrChildFolder(this.props.folder, url)) {
					routeToRenamedFolder(this.props.folder, url, name);
				}
			});
		this.setState({ isRenaming: false });
	};

	handleCreateSubFolder = () => {
		this.setState({ isCreatingSubFolder: true });
	};

	handleCreateSubFolderClose = () => {
		this.setState({ isCreatingSubFolder: false });
	};

	handleCreateSubFolderSubmit = name => {
		this.props.createFolder({
			name,
			view: this.props.view,
			parentFolderId: this.props.folder.id
		});
		this.setState({ isCreatingSubFolder: false });
		this.props.onToggleExpanded(this.props.folder.id, true);
	};

	handleMoveFolder = destFolderId => {
		this.props
			.action({
				variables: {
					type: 'FolderAction',
					op: 'move',
					id: this.props.folder.id,
					folderId: destFolderId || USER_FOLDER_IDS.ROOT
				}
			})
			.then(() => {
				this.props.afterAction();
			});
		this.props.onToggleExpanded(destFolderId, true);
	};

	handleDblClick = Menu => {
		if (
			this.props.isRenameAllowed
				? this.props.isRenameAllowed(Menu)
				: isRenameAllowed(Menu)
		) {
			this.handleRename();
		}
	};

	handleFolderDeleteClick = () => this.props.confirmDelete();

	ensureFolderObject = folder =>
		typeof folder === 'string' ? { id: folder, name: folder } : folder;

	handleClick = e => {
		let folder = this.ensureFolderObject(this.props.folder);
		this.props.onItemClick &&
			this.props.onItemClick(e, { isActive: this.isActive, folder });
	};

	handleExpandClick = ({ id, expanded }) =>
		this.props.onToggleExpanded(id, !expanded);

	render(
		{
			indexFolder = {},
			depth,
			folder,
			folders,
			urlSlug,
			slugs,
			urlPrefix,
			urlSuffixProp,
			badgeProp,
			nameProp,
			onDrop,
			showRefreshIcon,
			isRefreshing,
			foldersExpanded,
			confirmEmpty,
			menu,
			disableCollapse,
			grouped,
			folderNameProp,
			deleteOnHover,
			matchesMediaQuery
		},
		{ dropTarget, dropped, isRenaming, renamingInputValue, isCreatingSubFolder }
	) {
		folder = this.ensureFolderObject(folder);

		if (nameProp) folder.name = folder[nameProp];

		const expanded = folder.id
			? foldersExpanded[folder.id.toString()] === true
			: false;
		let urlSuffix =
			(urlSuffixProp && folder[urlSuffixProp]) ||
			encodeURIComponent(
				(folder.absFolderPath &&
					folder.absFolderPath.replace(/(^\/|\/$)/, '')) ||
					folder.name ||
					folder.id
			);

		let item;

		if (typeof folder.view === 'function') {
			item = h(folder.view, { folder, depth });
		}
		else {
			const {
				handleMoveFolder,
				handleMarkRead,
				handleRename,
				handleDelete,
				handleCreateSubFolder
			} = this;
			const Menu = this.customContextMenu() || menu;
			const url = `/${urlSlug}/${urlPrefix || ''}${urlSuffix}`;
			const subFolders = folder.folders || folder.folder;

			// If this folder is the `indexFolder`, and we are at the index route,
			// then use a blank regex to force this folder to be active.  assume / is the same as /email
			const urlRegex =
				folder.id === indexFolder.id &&
				new RegExp(
					`/${urlSlug === slugs.email ? `(?:${urlSlug})?` : urlSlug || ''}/?$`
				).test(window.location.href)
					? /(?:)/
					: new RegExp(`/${urlSlug}/${urlPrefix || ''}${urlSuffix}($|/)`);

			// Do not match parent folders
			this.isActive = urlRegex.test(window.location.href);

			let badge =
				typeof badgeProp === 'function'
					? badgeProp(folder)
					: badgeProp !== false && folder[badgeProp || 'unread'];

			let folderName =
				typeof folderNameProp === 'function'
					? folderNameProp(folder)
					: folder[folderNameProp || 'name'];

			item = isRenaming ? (
				<FolderInput
					class={cx(style[`item--depth${depth}`], grouped && style.grouped)}
					value={renamingInputValue}
					onInput={linkstate(this, 'renamingInputValue')}
					onClose={this.handleCloseRename}
					onSubmit={this.handleRenameSubmit}
				/>
			) : (
				<ContextMenu
					disabled={!Menu}
					menu={
						<ClosableMenu
							menu={Menu}
							folder={folder}
							folders={folders}
							onMarkFolderRead={handleMarkRead}
							onEmptyFolder={confirmEmpty}
							onRenameFolder={handleRename}
							onMoveFolder={handleMoveFolder}
							onDeleteFolder={handleDelete}
							onCreateSubFolder={handleCreateSubFolder}
						/>
					}
				>
					<div
						class={cx(
							style.item,
							style[`item--depth${depth}`],
							grouped && style.grouped,
							badge && style.hasBadge,
							!disableCollapse && subFolders && style.collapsible,
							dropTarget && style.dropTarget,
							dropped && style.dropped
						)}
					>

						<MenuItem
							href={url}
							match={urlRegex}
							customClass={style.itemLink}
							activeClass={style.active}
							iconClass={style.icon}
							innerClass={style.itemInner}
							title={folder.name}
							onDragOver={onDrop && this.handleDragOver}
							onDragEnter={onDrop && this.handleDragOver}
							onDragLeave={onDrop && this.handleDragLeave}
							onDrop={onDrop && this.handleDrop}
							onClick={this.handleClick}
							onDblClick={callWith(this.handleDblClick, Menu)}
						>
							{!disableCollapse &&
								subFolders && (
								<CollapsibleControl
									collapsed={!expanded}
									onClick={callWith(this.handleExpandClick, {
										id: folder.id,
										expanded
									})}
									class={cx(
										style.folderCollapsibleControl,
										style[`folderCollapsibleControl--depth${depth}`],
										grouped && style.grouped
									)}
								/>
							)}
							<div class={style.itemTitle}>{folderName}</div>
							{this.isActive &&
								showRefreshIcon && (
								<NakedButton
									class={cx(style.refresh, isRefreshing && style.refreshing)}
								>
									<Icon name="refresh" size="xs" />
								</NakedButton>
							)}
							{matchesMediaQuery
								? !!badge && <div className={style.badge}>{badge}</div>
								: !!badge && <div className={style.badge}>{badge}</div>}
						</MenuItem>

						{deleteOnHover && (
							<NakedButton
								class={style.folderItemAction}
								onClick={callWith(this.handleFolderDeleteClick, folder)}
							>
								<Icon name="close" size="sm" />
							</NakedButton>
						)}
					</div>

					{isCreatingSubFolder && (
						<FolderInput
							class={cx(style[`item--depth${depth}`], grouped && style.grouped)}
							onClose={this.handleCreateSubFolderClose}
							onSubmit={this.handleCreateSubFolderSubmit}
						/>
					)}
				</ContextMenu>
			);

			if (subFolders) {
				item = (
					<div>
						{item}
						{expanded &&
							subFolders.map(subFolder => (
								<FolderListItem
									{...this.props}
									depth={(depth || 1) + 1}
									folder={subFolder}
								/>
							))}
					</div>
				);
			}
		}

		return item;
	}
}

//decorate Menu wiwht
class ClosableMenu extends Component {
	handleMoveFolder = id => {
		this.props.onMoveFolder && this.props.onMoveFolder(id);
		this.props.onClose && this.props.onClose();
	};

	render({
		menu: Menu,
		folder,
		folders,
		onMarkFolderRead,
		onEmptyFolder,
		onRenameFolder,
		onDeleteFolder,
		onCreateSubFolder
	}) {
		return (
			<Menu
				folder={folder}
				folders={folders}
				onMarkFolderRead={onMarkFolderRead}
				onEmptyFolder={onEmptyFolder}
				onRenameFolder={onRenameFolder}
				onMoveFolder={this.handleMoveFolder}
				onDeleteFolder={onDeleteFolder}
				onCreateSubFolder={onCreateSubFolder}
			/>
		);
	}
}

class ConfirmDeleteDialog extends Component {
	// If this is in the trash or is a search folder,
	// prompt the user to permanently delete it.
	shouldPermanentlyDelete = () => (
		this.props.folder.query ||
			this.props.folder.parentFolderId === USER_FOLDER_IDS.TRASH.toString()
	);

	handleConfirm = () => {
		let { action, closeDialog, folder } = this.props;
		const permanently = this.shouldPermanentlyDelete();
		action({
			variables: {
				type: 'FolderAction',
				id: folder.id,
				op: permanently ? 'delete' : 'move',
				folderId: permanently ? undefined : USER_FOLDER_IDS.TRASH.toString()
			}
		}).then(() => {
			this.props.afterAction();
		});
		closeDialog && closeDialog();

		if (isActiveFolder(folder, getCurrentUrl())) {
			route('/');
		}
	};

	render(props) {
		return (
			<DeleteFolderDialog
				{...props}
				onConfirm={this.handleConfirm}
				permanent={this.shouldPermanentlyDelete()}
			/>
		);
	}
}

class ConfirmEmptyDialog extends Component {
	handleConfirm = () => {
		let { action, closeDialog, folder } = this.props;
		action({
			variables: {
				type: 'FolderAction',
				id: folder.id,
				op: 'empty'
			}
		}).then(() => {
			this.props.afterAction();
		});
		closeDialog && closeDialog();
	};

	render(props) {
		return <EmptyFolderDialog {...props} onConfirm={this.handleConfirm} />;
	}
}

// Compose HOCs with `compose` so that `FolderListItem` has the correct
// prop context for nested folders.
const FolderListItem = compose(
	graphql(ActionMutation, {
		props: ({ mutate }) => ({ action: mutate })
	}),
	connect(null, { notify }),
	configure('routes.slugs'),
	withDialog('confirmDelete', <ConfirmDeleteDialog />),
	withDialog('confirmEmpty', <ConfirmEmptyDialog />),
	withMediaQuery(minWidth(screenSmMax))
)(BaseFolderListItem);

export default FolderListItem;
