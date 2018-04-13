import { h } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import prettyBytes from 'pretty-bytes';

import { Icon } from '@zimbra/blocks';
import UnreadControl from '../unread-control';
import MailInlineActionControl from '../mail-inline-action-control';
import EmailTime from '../email-time';

import s from './style';

function stopPropagation(e) {
	e.stopPropagation();
}

const WideListItem = ({
	item,
	count,
	isAttachment,
	isDraft,
	isFlagged,
	isSelected,
	isUnread,
	isUrgent,
	showSize,
	onCheckbox,
	onInlineDelete,
	onToggleFlagged,
	onToggleUnread,
	onInlineSearch,
	emailAddresses,
	showFolderName,
	showSnippet,
	disableInlineSearch
}) => {


	let messageOrConvSize = showSize && <span class={s.size}>{prettyBytes(+item.sortField)}</span>;

	return (
		<div class={s.wideListItem}>
			<input
				aria-label="Select Email"
				type="checkbox"
				checked={isSelected}
				onClick={onCheckbox}
				onDblClick={stopPropagation}
				class={s.wideCheckbox}
			/>
			<UnreadControl
				class={s.unreadControl}
				onChange={onToggleUnread}
				value={isUnread}
			/>
			<div class={s.wideListItemSenderCol}>
				<div class={s.wideListItemSender}>
					{emailAddresses.join(', ')}
					{isDraft && (
						<span>
							{emailAddresses.length > 0 ? ', ' : ''}
							<span class={s.draft}>
								<Text id="mail.DRAFT" />
							</span>
						</span>
					)}
				</div>
				<div>
					{!disableInlineSearch && (
						<MailInlineActionControl
							name="search"
							className={s.inlineControl}
							onChange={onInlineSearch}
						/>
					)}
					<MailInlineActionControl
						name="trash"
						className={s.inlineControl}
						onChange={onInlineDelete}
					/>
					<MailInlineActionControl
						name="star"
						className={s.inlineControl}
						activeClassName={s.starred}
						value={isFlagged}
						onChange={onToggleFlagged}
					/>
				</div>
			</div>
			<div class={s.wideListItemSubject}>
				<h4 class={cx(s.subject, s.wideSubject)} title={item.subject}>
					{item.subject || <Text id="mail.noSubject" />}
					{count && count > 1 ? <span> ({count})</span> : null}
				</h4>
			</div>
			<div class={cx(s.excerpt, s.wideExcerpt)}>
				{(showSnippet && item.excerpt) || ' '}
			</div>

			{showFolderName && item.folder && <div>{item.folder.name}</div>}

			<div class={s.wideListItemTimeCol}>
				{isUrgent && <span class={s.urgent}>🚩</span>}
				{isAttachment && <Icon class={s.attachment} name="paperclip" />}
				{messageOrConvSize}
				<EmailTime time={item.date} />
			</div>
		</div>
	);
};

export default WideListItem;
