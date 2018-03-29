import { h } from 'preact';
import cx from 'classnames';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import { callWith } from '../../lib/util';
import { isUnread, isFlagged } from '../../utils/mail-item';
import { inFolder } from '../../utils/folders';
import { minWidth } from '../../constants/breakpoints';

import ActionButton from '../action-button';
import ActionMenuMoveFolder from '../action-menu-move-folder';
import ActionMenuMailOverflow from '../action-menu-mail-overflow';
import withMediaQuery from '../../enhancers/with-media-query';

import s from './style.less';

const MailActions = ({
	isAttachmentViewerOpen,
	isMediaMenuOpen,
	currentFolder,
	disabled,
	disableBlock,
	folders,
	multiple,
	singleMailItem,
	singleMailItemType,
	onArchive,
	onBlock,
	onDelete,
	onFlag,
	onSpam,
	onMarkRead,
	onMove,
	onReply,
	onReplyAll,
	onForward,
	hideReplyActions,
	hideMessageNavigation,
	handleNext,
	handlePrevious,
	handleClose,
	matchesMediaQuery,
	...rest
}) => {
	const showReplyActions = !hideReplyActions;
	const showMessageNavigation = !hideMessageNavigation;
	const inSpam = inFolder(currentFolder, 'junk');
	const inSent = inFolder(currentFolder, 'sent');
	const inArchive = inFolder(currentFolder, 'archive');
	const read = singleMailItem && !isUnread(singleMailItem);
	const flagged = singleMailItem && isFlagged(singleMailItem);

	return (
		<div class={cx(s.viewerToolbar, rest.class)} disabled={disabled}>
			{showReplyActions &&
				onReply && (
				<ActionButton
					icon="mail-reply"
					onClick={onReply}
					disabled={disabled || multiple}
				/>
			)}
			{showReplyActions &&
				onReplyAll && (
				<ActionButton
					icon="mail-reply-all"
					onClick={onReplyAll}
					disabled={disabled || multiple}
				/>
			)}
			{showReplyActions &&
				onForward && (
				<ActionButton
					icon="mail-forward"
					onClick={onForward}
					disabled={disabled || multiple}
				/>
			)}
			<ActionButton
				icon={inArchive ? 'inbox' : 'archive'}
				iconOnly={isAttachmentViewerOpen || !matchesMediaQuery}
				onClick={callWith(onArchive, !inArchive)}
				disabled={disabled}
			>
				{inArchive ? 'Restore to Inbox' : 'Archive'}
			</ActionButton>
			<ActionMenuMoveFolder
				folders={folders}
				onMove={onMove}
				disabled={disabled}
				iconOnly={isAttachmentViewerOpen || !matchesMediaQuery}
				arrow={matchesMediaQuery}
			/>
			<ActionButton
				icon="trash"
				iconOnly={isAttachmentViewerOpen || !matchesMediaQuery}
				onClick={onDelete}
				disabled={disabled || inFolder(currentFolder, 'trash')}
			>
				Delete
			</ActionButton>
			{!inSent && (
				<ActionButton
					icon="shield"
					iconOnly={isAttachmentViewerOpen || !matchesMediaQuery}
					disabled={disabled}
					onClick={callWith(onSpam, !inSpam)}
				>
					{inSpam ? 'Not Spam' : 'Spam'}
				</ActionButton>
			)}
			<ActionMenuMailOverflow
				popoverClass={s.overflowPopoverContainer}
				onMarkRead={onMarkRead}
				onFlag={onFlag}
				onBlock={onBlock}
				disableBlock={disableBlock}
				multiple={multiple}
				disabled={disabled}
				read={read}
				flagged={flagged}
				arrow={matchesMediaQuery}
				iconOnly={isAttachmentViewerOpen || !matchesMediaQuery}
			/>
			{ (showMessageNavigation || isAttachmentViewerOpen) && (
				<div class={s.messageNavigation}>
					<ActionButton
						class={s.button}
						icon="arrow-up"
						onClick={handlePrevious}
					/>
					<ActionButton
						class={s.button}
						icon="arrow-down"
						onClick={handleNext}
					/>
					<ActionButton class={s.button} icon="close" onClick={handleClose} />
				</div>
			)}
		</div>
	);
};

MailActions.defaultProps = {
	disabled: false,
	hideReplyActions: false,
	hideMessageNavigation: false
};

MailActions.propTypes = {
	disabled: PropTypes.bool,
	onArchive: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired
};


export default compose(
	// action button labels start running into eachother, hide them
	withMediaQuery(minWidth(1200))
)(MailActions);
