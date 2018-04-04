import { createAsyncAction } from '@zimbra/util/src/redux/async-action';
import { createAction } from 'redux-actions';
import { normalize } from 'normalizr';
import findIndex from 'lodash-es/findIndex';
import intersection from 'lodash-es/intersection';
import { DEFAULT_UNDO_DURATION } from '../../constants/undo-timeout';
import * as Schema from '../schema';
import { notify } from '../notifications/actions';
import { getMailFolder } from './selectors';

function zimbraNamespace(zimbra, type) {
	return zimbra[`${type}s`];
}

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
