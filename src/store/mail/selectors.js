import flatten from 'lodash-es/flatten';
import get from 'lodash-es/get';
import compact from 'lodash-es/compact';
import last from 'lodash-es/last';
import { denormalize } from 'normalizr';
import { getFolder } from '../folders/selectors';
import { movableFolders } from '../../utils/folders';
import * as Schema from '../schema';

export function getCollection(state, type, folderName) {
	const paginationState = get(state.mail, [`${type}s`, folderName]);

	return paginationState
		? {
			...paginationState,
			data:
					denormalize(
						flatten(paginationState.pages),
						[Schema[type]],
						state.entities
					) || []
		}
		: {};
}

export function getSelectedIds(state) {
	return state.mail.selectedIds;
}

export function getMailFolder(state, folderName) {
	return state.mail.conversations[folderName];
}

export function currentPage(state, folderName) {
	return get(getMailFolder(state, folderName), 'currentPage', 1);
}

export function getConversationFolder(state, conversation) {
	if (!conversation.messages || conversation.messages.length === 0) {
		return null;
	}

	const folders = compact(
		conversation.messages.map(m => getFolder(state, m.folderId))
	);
	return last(movableFolders(folders)) || last(folders);
}
