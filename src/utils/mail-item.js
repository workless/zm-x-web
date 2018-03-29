import uniqBy from 'lodash/uniqBy';
import compact from 'lodash/compact';
import { types as apiClientTypes } from '@zimbra/api-client';
import { hasFlag } from '../lib/util';
import { isAutoSendDraftMessage } from '../utils/drafts';
import { displayAddress } from './contacts';
import { isAccount, withoutAccountAddresses } from './account';
import { USER_FOLDER_IDS } from '../constants';

const { MailFolderView } = apiClientTypes;

function isDraftMessage(msg) {
	return hasFlag(msg, 'draft') && !isAutoSendDraftMessage(msg);
}

function isDraftConversation(conv) {
	return (
		conv && conv.messages && conv.messages.length >= 1 && conv.messages.some(isDraftMessage)
	);
}

export function isDraft(mailItem, type) {
	return type === MailFolderView.conversation
		? isDraftConversation(mailItem)
		: isDraftMessage(mailItem);
}

export function isUnread(mailItem) {
	return hasFlag(mailItem, 'unread');
}

export function isFlagged(mailItem) {
	return hasFlag(mailItem, 'flagged');
}
export function isUrgent(mailItem) {
	return hasFlag(mailItem, 'urgent');
}
export function isSentByMe(mailItem) {
	return hasFlag(mailItem, 'sentByMe');
}
export function isAttachment(mailItem) {
	return hasFlag(mailItem, 'attachment');
}

export function isMessageTrashed(mailItem) {
	return mailItem && String(mailItem.folderId) === String(USER_FOLDER_IDS.TRASH);
}

export function displaySenders(mailItem, account) {
	if (!mailItem.emailAddresses) {
		return [];
	}

	let emailAddresses = uniqBy(mailItem.emailAddresses, 'address');

	if (emailAddresses.length === 1) {
		return compact(emailAddresses.map(s => displayAddress(s)));
	}

	let emailAddresses2 = mailItem.emailAddresses.filter(s => s.type === 'f');

	if (emailAddresses2.length === 1) {
		return compact(emailAddresses2.map(s => displayAddress(s)));
	}

	return compact(
		emailAddresses.map(s => (isAccount(account, s) ? 'me' : s.shortName || s.name))
	);
}

export function fromSenders(mailItem, account) {
	return mailItem.emailAddresses
		? mailItem.emailAddresses
			.filter(s => s.type === 'f')
			.filter(withoutAccountAddresses(account))
		: [];
}
