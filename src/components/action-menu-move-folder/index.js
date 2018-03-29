import { h, Component } from 'preact';
import { compose, branch, renderNothing } from 'recompose';


import {
	movableFolders,
	specialFolders,
	customFolders
} from '../../utils/folders';

import getMailFolders from '../../graphql-decorators/get-mail-folders';

import ActionMenu from '../action-menu';
import FolderSelect from '../folder-select';

const _ActionMenuMoveFolder = ({
	folders: allFolders,
	disabled,
	onMove,
	iconOnly,
	arrow,
	monotone,
	actionButtonClass,
	popoverClass
}) => {
	const folders = movableFolders(allFolders);
	const folderGroups = [customFolders(folders), specialFolders(folders)];

	return (
		<ActionMenu
			icon="folder-move"
			label="Move"
			disabled={disabled}
			arrow={arrow}
			iconOnly={iconOnly}
			monotone={monotone}
			actionButtonClass={actionButtonClass}
			popoverClass={popoverClass}
		>
			<DropDown folders={folders} folderGroups={folderGroups} onMove={onMove} />
		</ActionMenu>
	);
};

const ActionMenuMoveFolder = compose(
	getMailFolders(),
	branch(({ folders }) => !folders, renderNothing)
)(_ActionMenuMoveFolder);

class DropDown extends Component {
	handleMove = id => {
		this.props.onMove(id);
		//closeDropdown is passed in by <ActionMenu/>
		this.props.closeDropdown();
	};

	render({ folders, folderGroups }) {
		return (
			<FolderSelect
				folders={folders}
				folderGroups={folderGroups}
				onMove={this.handleMove}
			/>
		);
	}
}

export default ActionMenuMoveFolder;
