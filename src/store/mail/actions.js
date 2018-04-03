import { createAsyncAction } from '@zimbra/util/src/redux/async-action';
import { createAction } from 'redux-actions';
import { normalize } from 'normalizr';
import findIndex from 'lodash-es/findIndex';
import intersection from 'lodash-es/intersection';
import {
	conversation as conversationType,
	message as messageType
} from '../../constants/types';
import { DEFAULT_UNDO_DURATION } from '../../constants/undo-timeout';
import * as Schema from '../schema';
import { notify } from '../notifications/actions';
import { removeTabs } from '../navigation/actions';
import { getMailFolder } from './selectors';
import { notifyFolderMove } from '../folders/actions';
import { getFolderByName, getFolder } from '../folders/selectors';
import { getId } from '../../lib/util';
import array from '@zimbra/util/src/array';

const MAIL_ITEM_NAMES = {
	[conversationType]: { plural: 'conversations', title: 'Conversation' },
	[messageType]: { plural: 'messages', title: 'Message' }
};

function subject(options) {
	return Array.isArray(options.id) && options.id.length > 1
		? `${options.id.length} ${MAIL_ITEM_NAMES[options.type].plural}`
		: MAIL_ITEM_NAMES[options.type].title;
}

function zimbraNamespace(zimbra, type) {
	return zimbra[`${type}s`];
}

const notifyConversationMove = (payload) => (
	notifyFolderMove({
		...payload,
		subject: subject(payload.options),
		undoAction: moveMailItem
	})
);

function getPageIndex(state, { id, currentFolder }) {
	if (!currentFolder) {
		return 0;
	}
	const folder = getMailFolder(state, currentFolder.name);
	if (!folder) {
		return 0;
	}

	const index = findIndex(
		folder.pages,
		page => intersection(page, Array.isArray(id) ? id : [id]).length > 0
	);

	return index !== -1 ? index : 0;
}

function removeAllTabsFromOptions({ id, type }) {
	return removeTabs(array(id).map(currentId => ({ id: currentId, type })));
}

export const loadMailCollection = createAsyncAction(
	'mail load.collection',
	({ options, zimbra }) => {
		const { folderName, type, types, ...listOptions } = options;
		return zimbra.folders
			.read({
				recip: 2,
				...listOptions,
				folder: folderName,
				types: type || types
			})
			.then(data => ({
				meta: {
					folderName: options.folderName,
					limit: options.limit,
					sortBy: data.sortBy,
					offset: data.offset,
					more: data.more
				},
				data: normalize(data, Schema.searchResults)
			}));
	}
);

export const reloadFolder = ({ folderName, type }) => (dispatch, getState) => {
	const folder = getMailFolder(getState(), folderName);
	if (!folder) {
		return Promise.resolve();
	}

	return dispatch(
		loadMailCollection({
			folderName,
			types: type,
			limit: folder.limit,
			sortBy: folder.sortBy,
			offset: 0
		})
	);
};

export const reloadCurrentFolderPage = options => (dispatch, getState) => {
	if (!options.currentFolder) {
		return Promise.resolve();
	}
	const state = getState();
	const pageIndex = getPageIndex(state, options);
	const folderKey = options.currentFolder.absFolderPath.replace('/', '');
	const folder = getMailFolder(state, folderKey);
	if (!folder) {
		return Promise.resolve();
	}

	return dispatch(
		loadMailCollection({
			folderName: folderKey,
			types: options.type,
			limit: folder.limit,
			sortBy: folder.sortBy,
			offset: pageIndex * folder.limit
		})
	);
};

function normalizeConversation(c) {
	return normalize(
		{
			...c,
			full: true,
			messages: c.messages.map(m => ({
				...m,
				full: true,
				autoSendTime: m.autoSendTime || null
			}))
		},
		Schema.conversation
	);
}

function normalizeMessage(m) {
	return normalize({
		...m,
		full: true,
		autoSendTime: m.autoSendTime || null
	}, Schema.message);
}

export const loadMailItem = createAsyncAction(
	'mail load.item',
	({ options, zimbra }) =>
		zimbraNamespace(zimbra, options.type)
			.read(getId(options.id))
			.then(
				i =>
					options.type === 'conversation'
						? normalizeConversation(i)
						: normalizeMessage(i)
			)
);

export const toggleSelected = createAction('mail toggle.selected');

export const toggleAllSelected = createAction('mail toggle.allSelected');

export const clearSelected = createAction('mail clearSelected');

export const readMailItem = createAsyncAction(
	'mail read.item',
	({ options, zimbra }) =>
		zimbraNamespace(zimbra, options.type).markRead(options.id, options.value)
);

export const flagMailItem = createAsyncAction(
	'mail flag.item',
	({ options, zimbra }) =>
		zimbraNamespace(zimbra, options.type).flag(options.id, options.value)
);

export const spamMailItem = createAsyncAction(
	'mail spam.item',
	({ options, zimbra, dispatch }) =>
		zimbraNamespace(zimbra, options.type)
			.spam(options.id, options.value)
			.then(data => {
				!options.isUndo &&
					options.currentFolder &&
					dispatch(
						notify({
							message: `${subject(options)} ${options.value
								? 'marked as Spam. Thank you for helping us improve spam filtering.'
								: 'marked as Not Spam.'}`,
							action: {
								label: 'Undo',
								fn: () => {
									dispatch(
										spamMailItem({
											...options,
											isUndo: true,
											value: !options.value
										})
									);
								}
							}
						})
					);

				dispatch(removeAllTabsFromOptions(options));
				dispatch(reloadCurrentFolderPage(options));
				return data;
			})
);

export const moveMailItem = createAsyncAction(
	'mail move.item',
	({ options, zimbra, dispatch, getState }) =>
		zimbraNamespace(zimbra, options.type)
			.move(options.id, options.destFolderId)
			.then(data => {
				const destFolder = getFolder(getState(), options.destFolderId);
				notifyConversationMove({ dispatch, destFolder, options });
				dispatch(removeAllTabsFromOptions(options));
				dispatch(reloadCurrentFolderPage(options));
				return data;
			})
);

export const archiveMailItem = createAsyncAction(
	'mail archive.item',
	({ options, zimbra, dispatch, getState }) => {
		const archiveFolder = getFolderByName(getState(), 'Archive');

		if (!archiveFolder) {
			throw new Error("The Archive folder doesn't exist");
		}

		return zimbraNamespace(zimbra, options.type)
			.move(options.id, archiveFolder.id)
			.then((data) => {
				notifyConversationMove({ dispatch, destFolder: archiveFolder, options });
				dispatch(removeAllTabsFromOptions(options));
				dispatch(reloadCurrentFolderPage(options));
				return data;
			});
	}
);

export const unarchiveMailItem = createAsyncAction(
	'mail unarchive.item',
	({ options, zimbra, dispatch, getState }) => {
		const inboxFolder = getFolderByName(getState(), 'Inbox');

		if (!inboxFolder) {
			throw new Error("The Archive folder doesn't exist");
		}

		return zimbraNamespace(zimbra, options.type)
			.move(options.id, inboxFolder.id)
			.then(data => {
				notifyConversationMove({ dispatch, destFolder: inboxFolder, options });
				dispatch(removeAllTabsFromOptions(options));
				dispatch(reloadCurrentFolderPage(options));
				return data;
			});
	}
);

export const createReplyDraft = createAsyncAction(
	'mail create.replyDraft',
	({ options, zimbra }) => zimbra.drafts.create(options.messageDraft)
);

export const updateDraft = createAsyncAction(
	'mail update.draft',
	({ options, zimbra }) => zimbra.drafts.update(options.messageDraft)
);

export const undoSendMessage = createAsyncAction(
	'mail undo-send.draft',
	({ options, dispatch }) =>
		dispatch(updateDraft({
			messageDraft: {
				...options.messageDraft,
				autoSendTime: null
			}
		}))
			.then((undoneDraft) => {
				options.onUndoSend && options.onUndoSend(undoneDraft);
				return dispatch(notify({
					message: 'Sending has been undone.'
				}));
			})
);

export const sendMessageWithUndo = createAsyncAction(
	'mail send.draft',
	({ options, dispatch }) => {
		const sendAction = options.messageDraft.id
			? updateDraft
			: createReplyDraft;
		return dispatch(sendAction({
			messageDraft: {
				...options.messageDraft,
				autoSendTime: new Date().getTime() + DEFAULT_UNDO_DURATION * 1000
			}
		}))
			.then((draftSaved) => {
				dispatch(notify({
					message: 'Message sent.',
					duration: 10,
					action: {
						label: 'Undo',
						fn: () =>
							dispatch(undoSendMessage({
								onUndoSend: options.onUndoSend,
								messageDraft: {
									...options.messageDraft,
									...draftSaved
								}
							}))
					}
				}));
				return draftSaved;
			});
	}
);

export const deleteDraft = createAsyncAction(
	'mail delete.draft',
	({ dispatch, options, zimbra }) =>
		zimbra.drafts.delete(options.messageDraftId).then(result => {
			dispatch(notify({ message: 'Draft permanently deleted' }));
			return result;
		})
);

export const bulkDeleteMessages = createAsyncAction(
	'mail delete.message',
	({ options, zimbra, dispatch }) =>
		zimbra.messages.trash(options.id, options.value).then(data => {
			dispatch(reloadCurrentFolderPage(options));
			return data;
		})
);
