import { h } from 'preact';

import { ALL_VIEW } from '../../constants/views';

import { createAsyncAction } from '@zimbra/util/src/redux/async-action';
import { isAlreadyExistsError } from '../../utils/errors';
import { normalize } from 'normalizr';
import * as Schema from '../schema';
import { getFolder } from './selectors';
import { notify } from '../notifications/actions';
import { reloadFolder } from '../mail/actions';
import {
	RenameMessage,
	DeletedMessage,
	CreatedMessage,
	MovedMessage,
	MovedTopLevelMessage,
	FolderAlreadyExistsMessage
} from '../../components/notifications/messages';

export const notifyFolderMove = ({ destFolder, dispatch, options, subject, undoAction }) => {
	const verb = options.isUndo ? 'restored' : 'moved';
	let message = '';

	switch (destFolder.name) {
		case 'Trash':
			message = `${subject} deleted.`;
			break;
		default:
			message = `${subject} ${verb} to ${destFolder.name}.`;
	}

	dispatch(notify({
		message,
		duration: options.notificationDuration,
		// TODO: support undo for items coming from disparate folders, like
		// with search results.
		action: !options.isUndo && options.currentFolder && undoAction && {
			label: 'Undo',
			fn: () => {
				dispatch(undoAction({
					type: options.type,
					currentFolder: options.currentFolder,
					destFolderId: options.currentFolder.id,
					id: options.id,
					isUndo: true,
					// Forward success actions so extra actions are still run on
					// undo.
					fulfilledActions: options.fulfilledActions
				}));
			}
		}
	}));
};

export const loadFolders = createAsyncAction(
	'entities load.folders',
	({ options, zimbra }) => (
		zimbra.folders.list({
			...options,
			view: options.view === ALL_VIEW ? undefined : options.view
		})
			.then(data => normalize(data.folder, Schema.folderList))
	)
);

export const markFolderRead = createAsyncAction(
	'folders read.folder',
	({ options, zimbra, dispatch }) =>
		zimbra.folders.markRead(options.folder.id)
			.then(() => dispatch(reloadFolder({ folderName: options.folder.name })))
			.then(() => dispatch(notify({ message: `${options.folder.name} marked as read.` })))
);

export const emptyFolder = createAsyncAction(
	'folders empty.folder',
	({ options, zimbra, dispatch }) =>
		zimbra.folders.empty(options.folder.id)
			.then(() => {
				dispatch(loadFolders({ view: options.view, path: options.path }));
				return dispatch(reloadFolder({ folderName: options.folder.name }));
			})
			.then(() => {
				dispatch(notify({ message: `${options.folder.name} emptied.` }));
			})
);

export const renameFolder = createAsyncAction(
	'folders rename.folder',
	({ options, zimbra, dispatch }) => {
		const prevName = options.folder.name;

		return zimbra.folders.rename(options.folder.id, options.name)
			.then(() => {
				dispatch(loadFolders({ view: options.view, path: options.path }));
				dispatch(notify({
					message: <RenameMessage prevName={prevName} name={options.name} />
				}));
			}).catch(handleFolderRejection({ options, dispatch }));
	}
);

export const deleteFolder = createAsyncAction(
	'folders delete.folder',
	({ options, zimbra, dispatch }) => (
		zimbra.folders.delete(options.folder.id)
			.then(() => {
				dispatch(loadFolders({ view: options.view, path: options.path }))
					.then(() => {
						dispatch(notify({
							message: <DeletedMessage name={options.folder.name} />,
							action: options.isUndo && {
								label: 'Undo',
								fn: () => {
									// Move folder back to it's original position
									dispatch(moveFolder({
										id: options.folder.id,
										view: options.view
									}));
								}
							}
						}));
					});
			})
	)
);

export const createFolder = createAsyncAction(
	'folders create.folder',
	({ options, zimbra, dispatch }) =>
		zimbra.folders.create(options)
			.then((newFolder) => {
				dispatch(loadFolders({ view: options.view, path: options.path }))
					.then(() => {
						!options.fetchIfExists &&
							dispatch(notify({
								message: <CreatedMessage name={options.name} />
							}));
					});
				return newFolder;
			}).catch(handleFolderRejection({ options, dispatch }))
);

export const moveFolder = createAsyncAction(
	'folders move.folder',
	({ options, zimbra, dispatch, getState }) =>
		zimbra.folders.move(options)
			.then(() => {
				const folder = getFolder(getState(), options.id);
				const destFolder = getFolder(getState(), options.destFolderId);

				dispatch(loadFolders({ view: options.view, path: options.path }))
					.then(() => {
						dispatch(notify({
							message: destFolder ? (
								<MovedMessage
									name={folder.name}
									destName={destFolder.name}
								/>
							) : (
								<MovedTopLevelMessage
									name={folder.name}
								/>
							)
						}));
					});
			})
);

function handleFolderRejection({ options: { view, path, name }, dispatch }) {
	return (err) => {
		dispatch(loadFolders({ view, path }));
		if (isAlreadyExistsError(err)) {
			dispatch(notify({
				message: <FolderAlreadyExistsMessage view={view} name={name} />
			}));
		}
		return Promise.reject(err);
	};
}
