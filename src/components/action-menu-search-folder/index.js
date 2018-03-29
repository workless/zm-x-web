import { h, Component } from 'preact';

import { specialFolders, customFolders } from '../../utils/folders';
import ActionMenu from '../action-menu';
import { FolderSearch } from '../folder-search';

import s from './style.less';

const ActionMenuSearchFolder = ({
	folders: allFolders,
	onSearchFolderChanged,
	label
}) => {
	const folders = allFolders;
	const folderGroups = [specialFolders(folders), customFolders(folders)];

	return (
		<ActionMenu
			label={label}
			class={s.menu}
			actionButtonClass={s.navigateDown}
			popoverClass={s.popover}
		>
			<DropDown
				folders={folders}
				folderGroups={folderGroups}
				onChange={onSearchFolderChanged}
			/>
		</ActionMenu>
	);
};

class DropDown extends Component {

	handleSearch = (name) => {
		this.props.onChange(name);
		this.props.closeDropdown();
	};

	render({ folders, folderGroups }) {
		return (
			<FolderSearch
				folders={folders}
				folderGroups={folderGroups}
				onSearch={this.handleSearch}
			/>
		);
	}
}

export default ActionMenuSearchFolder;
