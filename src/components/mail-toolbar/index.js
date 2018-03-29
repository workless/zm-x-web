import { h } from 'preact';

import Toolbar from '../toolbar';
import ToolbarSidebarButton from '../toolbar/sidebar-button';
import ToolbarSVGActionButton from '../toolbar/svg-action-button';
import ToolbarActionButton from '../toolbar/action-button';
import ToolbarTitle from '../toolbar/title';
import ActionMenuMoveFolder from '../action-menu-move-folder';
import ActionMenuMailOverflow from '../action-menu-mail-overflow';

import { callWith } from '../../lib/util';
import { inFolder } from '../../utils/folders';
import { getPrimaryAccountAddress } from '../../utils/account';
import { isUnread, isFlagged } from '../../utils/mail-item';

import s from './style.less';

export default function MailToolbar({
	account,
	folders,
	singleMailItem,
	disabled,
	disableBlock,
	hideContextActions,
	hideBackButton,
	isAttachmentViewerOpen,
	onMove,
	onDelete,
	onFlag,
	onMarkRead,
	onBlock,
	onCompose,
	multiple,
	onArchive,
	currentFolder
}) {
	const read = singleMailItem && !isUnread(singleMailItem);
	const flagged = singleMailItem && isFlagged(singleMailItem);
	const inArchive = inFolder(currentFolder, 'archive');
	const showTitle = hideBackButton || hideContextActions;
	return (
		<Toolbar>
			{showTitle
				? (
					<ToolbarSidebarButton
						className={s.actionButton}
					/>
				)
			  : (
					<ToolbarSVGActionButton
						href="/"
						iconClass={s.arrowBackIcon}
					/>
				)}
			{showTitle && (
				<ToolbarTitle
					text="mail.title"
					subtitle={getPrimaryAccountAddress(account)}
				/>
			)}
			{ hideContextActions
				? (
					<div class={s.actionButtons}>
						<ToolbarActionButton
							icon="search"
						/>
						<ToolbarActionButton
							onClick={onCompose}
							icon="pencil"
							className={s.composeButton}
						/>
					</div>
				)
				: (
					<div class={s.actionButtons}>
						<ToolbarActionButton
							icon="trash"
							onClick={onDelete}
						/>
						<ToolbarActionButton
							icon={inArchive ? 'inbox' : 'archive'}
							onClick={callWith(onArchive, !inArchive)}
						/>
						<ActionMenuMoveFolder
							actionButtonClass={s.actionButton}
							popoverClass={s.popoverContainer}
							folders={folders}
							onMove={onMove}
							monotone
							iconOnly
							arrow={false}
						/>
						<ActionMenuMailOverflow
							actionButtonClass={s.actionButton}
							popoverClass={s.popoverContainer}
							onMarkRead={onMarkRead}
							onFlag={onFlag}
							onBlock={onBlock}
							disableBlock={disableBlock}
							multiple={multiple}
							isAttachmentViewerOpen={isAttachmentViewerOpen}
							disabled={disabled}
							read={read}
							flagged={flagged}
							monotone
							iconOnly
							arrow={false}
						/>
					</div>
				)}
		</Toolbar>
	);
}