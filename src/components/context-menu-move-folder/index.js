import { h, Component } from 'preact';
import PropTypes from 'prop-types';

import {
	movableFolders,
	customFolders,
	isChildFolder,
	SPECIAL_FOLDERS_WITHOUT_TRASH
} from '../../utils/folders';

import FolderSelect from '../folder-select';

import s from './style.less';

function isFolderDisabled(folder, activeFolder) {
	return (
		folder.id === activeFolder.id ||
		folder.id === activeFolder.parentFolderId ||
		isChildFolder(activeFolder, folder.id)
	);
}

function withDisabledState(folders, activeFolder) {
	return folders.map(f => ({
		...f,
		disabled: isFolderDisabled(f, activeFolder),
		folder: withDisabledState(f.folder || [], activeFolder)
	}));
}

export default class ContextMenuMoveFolder extends Component {
	static propTypes = {
		folders: PropTypes.array,
		onMove: PropTypes.func,
		onCancelMove: PropTypes.func
	};

	handleClick(e) {
		e.stopPropagation();
	}

	render({ folders: allFolders, activeFolder, onMove, onCancelMove }) {
		const folders = withDisabledState(movableFolders(allFolders), activeFolder);
		const folderGroups = [
			customFolders(folders, SPECIAL_FOLDERS_WITHOUT_TRASH)
		];

		return (
			<div onClick={this.handleClick}>
				<FolderSelect
					folders={folders}
					folderGroups={folderGroups}
					folderGroupClass={s.folderGroup}
					maxGroupHeight={200}
					onMove={onMove}
					onBack={onCancelMove}
				/>
			</div>
		);
	}
}
