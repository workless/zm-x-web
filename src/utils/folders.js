import flatMapDeep from 'lodash-es/flatMapDeep';
import find from 'lodash-es/find';
import compact from 'lodash-es/compact';
import last from 'lodash-es/last';
import escapeStringRegexp from 'escape-string-regexp';

import { USER_ROOT_FOLDER_ID } from '../constants';

// special folders is used for both position and order
const SPECIAL_FOLDERS = ['inbox', 'drafts', 'sent', 'archive', 'junk', 'trash'];
const IGNORE_FOLDERS = ['USER_ROOT'];
const UNMOVABLE_FOLDERS = ['sent', 'drafts'];
export const SPECIAL_FOLDERS_WITHOUT_TRASH = ['inbox', 'drafts', 'sent', 'archive', 'junk'];

function baseFilter(folders) {
	return folders.filter(f => !IGNORE_FOLDERS.includes(f.name.toString().toLowerCase()));
}

export function specialFolders(folders, specialFolderList = SPECIAL_FOLDERS) {
	return !(folders && folders.length) ? [] :
		specialFolderList.reduce((result, specialName)  => {
			for (let i=folders.length; i--;) {
				let folder = folders[i];
				if (folder.name.toString().toLowerCase() === specialName) {
					result.push(folder);
					break;
				}
			}
			return result;
		}, []);
}

export function customFolders(folders, specialFolderList = SPECIAL_FOLDERS) {
	if (!folders) return [];
	return baseFilter(folders).filter(({ name }) => !specialFolderList.includes(name.toString().toLowerCase()));
}

export function movableFolders(folders) {
	if (!folders) return [];
	return baseFilter(folders).filter(({ name }) => !UNMOVABLE_FOLDERS.includes(name.toString().toLowerCase()));
}

export function isChildFolder(rootFolder, folderId) {
	const queue = rootFolder.folder ? [...rootFolder.folder] : [];

	while (queue.length > 0) {
		const child = queue.shift();
		if (child.id === folderId) {
			return true;
		}
		else if (child.folder && child.folder.length > 0) {
			queue.push(...child.folder);
		}
	}

	return false;
}

/**
 * Find a folder recursively in a tree of Zimbra folders.
 */
export function findFolder(rootFolder, folderId) {
	const queue = rootFolder.folders ? [...rootFolder.folders] : [...rootFolder];

	while (queue.length > 0) {
		const child = queue.shift();
		if (child.id.toString() === folderId.toString()) {
			return child;
		}
		else if (child.folders && child.folders.length > 0) {
			queue.push(...child.folders);
		}
	}

	return false;
}

export function isTopLevelFolder(folder) {
	return folder.parentFolderId &&
		folder.parentFolderId.toString() === USER_ROOT_FOLDER_ID;
}

export function renamedFolderAbsPath(prevAbsPath, newName) {
	let parentFolders = prevAbsPath.split('/');
	parentFolders.shift(); // Leading slash
	parentFolders.pop(); // Current folder name
	return [...parentFolders, newName].join('/');
}

export function flattenFolders(folders) {
	return flatMapDeep(folders, (f => ([
		f,
		...(f.folders ? flattenFolders(f.folders) : [])
	])));
}

export function filteredFolders(folders, query) {
	if (!folders || query === '') { return []; }

	const regex = new RegExp(escapeStringRegexp(query), 'ig');

	return flattenFolders(folders).filter(f => (
		f.name.toString().match(regex)
	));
}

const FLAGS = {
	checked: '#'
};

export function hasFlag(folder, flag) {
	const flags = folder.flags || folder.flag;
	return flags ? flags.indexOf(FLAGS[flag] || flag) > -1 : false;
}

export function inFolder(currentFolder, name) {
	return currentFolder && currentFolder.name.toLowerCase() === name;
}

export function findFolderByName(folders, name) {
	return find(folders, f => f.absFolderPath.replace('/', '') === name);
}

export function getConversationFolder(folders, conversation) {
	if (!folders || !conversation.messages || conversation.messages.length === 0) {
		return null;
	}

	const messageFolders = compact(
		conversation.messages.map(m => findFolder(folders, m.folderId))
	);

	return last(movableFolders(messageFolders)) || last(messageFolders);
}
