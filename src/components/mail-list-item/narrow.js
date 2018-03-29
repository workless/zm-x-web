import { h } from 'preact';
import { Text } from 'preact-i18n';

import { Icon } from '@zimbra/blocks';
import EmailTime from '../email-time';
import UnreadControl from '../unread-control';
import MailInlineActionControl from '../mail-inline-action-control';

import s from './style';

function stopPropagation(e) {
	e.stopPropagation();
}

const NarrowListItem = ({
	item,
	count,
	isAttachment,
	isDraft,
	isFlagged,
	isSelected,
	isUnread,
	isUrgent,
	onCheckbox,
	onInlineDelete,
	onInlineSearch,
	onToggleFlagged,
	onToggleUnread,
	emailAddresses,
	showSnippet,
	disableInlineSearch
}) => (
	<div class={s.narrowListItem}>
		<div class={s.messageActions}>
			<UnreadControl
				class={s.unreadControl}
				onChange={onToggleUnread}
				value={isUnread}
			/>
			<div>
				<input
					aria-label="Select Email"
					type="checkbox"
					checked={isSelected}
					onClick={onCheckbox}
					onDblClick={stopPropagation}
				/>
			</div>
		</div>
		<div class={s.messageContent}>
			<div class={s.row}>
				<div class={s.sender}>
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
				<div class={s.messageTime}>
					{isUrgent && <span class={s.urgent}>🚩</span>}
					{isAttachment && (
						<Icon class={s.attachment} size="sm" name="paperclip" />
					)}
					<EmailTime time={item.date} />
				</div>
			</div>
			<div class={s.row}>
				<h4 class={s.subject} title={item.subject}>
					{item.subject || <Text id="mail.noSubject" />}
				</h4>
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
			{showSnippet && (
				<div class={s.row}>
					<div class={s.excerpt}>{item.excerpt || ' '}</div>
					{count && count > 1 ? (
						<div class={s.messageCount}>
							<span class={s.label}>{count}</span>
						</div>
					) : null}
				</div>
			)}
		</div>
	</div>
);

export default NarrowListItem;
