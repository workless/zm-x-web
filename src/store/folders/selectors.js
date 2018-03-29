import find from 'lodash-es/find';
import last from 'lodash-es/last';
import { denormalize } from 'normalizr';
import * as Schema from '../schema';

export function getFolder(state, id) {
	return denormalize(id, Schema.folder, state.entities);
}

export function getFolderByName(state, fullName) {
	const name = last(fullName.split('/'));
	const folders = state.entities.folders;
	const folder = find(folders, f => String(f.name).toLowerCase() === name.toLowerCase());
	return folder ? denormalize(folder.id, Schema.folder, state.entities) : null;
}

export function getFolders(state, viewType) {
	const view = state.folders.views[viewType];
	return view ? denormalize(view.ids, [Schema.folder], state.entities) : null;
}