import { h } from 'preact';
import { Text } from 'preact-i18n';
import { graphql } from 'react-apollo';
import PureComponent from '../../lib/pure-component';
import {
	specialFolders as computeSpecialFolders,
	customFolders as computeCustomFolders,
	filteredFolders
} from '../../utils/folders';
import linkstate from 'linkstate';
import { pluck } from '../../lib/util';
import { Icon } from '@zimbra/blocks';
import FolderListItem from './item';
import FolderGroup from './group';
import NewFolder from './new-folder';
import FolderInput from '../folder-input';
import { connect } from 'preact-redux';
import cx from 'classnames';
import { defaultProps, withProps, branch, renderNothing } from 'recompose';
import { configure } from '../../config';
import style from './style';
import { MAIL_VIEW } from '../../constants/views';
import { closeCompose } from '../../store/email/actions';
import withMediaQuery from '../../enhancers/with-media-query';
import { minWidth, screenSmMax } from '../../constants/breakpoints';

import accountInfo from '../../graphql-decorators/account-info';
import getRootFolders from '../../graphql-decorators/get-root-folders';
import {
	getMailboxMetadata,
	setMailboxMetadata
} from '../../graphql-decorators/mailbox-metadata';
import CreateFolderMutation from '../../graphql/queries/folders/create-folder.graphql';
import {
	normalizeFoldersExpanded,
	serializeFoldersExpanded
} from '../../utils/prefs';

@configure('specialFolders')
@defaultProps({ view: MAIL_VIEW })
@accountInfo()
@getMailboxMetadata()
@getRootFolders({
	skip: ({ folders }) => !!folders,
	options: ({ view, path }) => ({ variables: {
		view,
		folder: path ? { path } : undefined
	} })
})
@branch(
	({ folders }) => !folders,
	renderNothing
)
@setMailboxMetadata()
@connect(null, { closeCompose })
@graphql(CreateFolderMutation, {
	props: ({ mutate }) => ({ createFolder: mutate })
})
@withProps(({ folders, indexFolderName }) => ({
	indexFolder: folders && pluck(folders, 'name', indexFolderName)
}))
@withMediaQuery(minWidth(screenSmMax))
export default class FolderList extends PureComponent {
	static defaultProps = {
		onActiveFolderClick: () => {}
	};

	state = {
		isRefreshing: false,
		isAddingNewFolder: false,
		isFindingFolder: false,
		searchQuery: ''
	};

	handleAfterAction = () => {
		this.props.refetchFolders();
	};

	folderMap = (params = {}) => folder =>
		this.folderLink({
			folder,
			foldersExpanded: this.props.foldersExpanded,
			menu: this.props.defaultContextMenu,
			...params
		});

	folderLink = ({
		folder,
		menu,
		foldersExpanded = {},
		disableCollapse = false,
		grouped = false
	}) => {
		const {
			urlSlug,
			badgeProp,
			nameProp,
			onDrop,
			dropEffect,
			view,
			folders,
			urlSuffixProp,
			indexFolder,
			path,
			folderNameProp,
			customContextMenus,
			isRenameAllowed
		} = this.props;

		return (
			<FolderListItem
				afterAction={this.handleAfterAction}
				createFolder={this.createFolder}
				indexFolder={indexFolder}
				folder={folder}
				folders={folders}
				menu={menu}
				view={view}
				path={path}
				depth={1}
				urlSlug={urlSlug}
				urlSuffixProp={urlSuffixProp}
				badgeProp={badgeProp}
				nameProp={nameProp}
				onDrop={onDrop}
				onItemClick={this.reload}
				dropEffect={dropEffect}
				showRefreshIcon={folder.name === 'Inbox'}
				isRefreshing={this.state.isRefreshing}
				foldersExpanded={foldersExpanded}
				onToggleExpanded={this.setFolderExpanded}
				disableCollapse={disableCollapse}
				customContextMenus={customContextMenus}
				isRenameAllowed={isRenameAllowed}
				grouped={grouped}
				folderNameProp={folderNameProp}
			/>
		);
	};

	reload = (e, { isActive, folder }) => {
		if (isActive) {
			this.setState({ isRefreshing: true });
			this.props
				.refresh(folder)
				.catch(() => {
					//TODO: Handle errors
				})
				.then(() => {
					this.setState({ isRefreshing: false });
				});
		}
	};

	setFolderTreeOpen = val => {
		if (this.props.folderTreeOpen !== val) {
			this.props.setMailboxMetadata({
				zimbraPrefCustomFolderTreeOpen: val
			});
		}
	};

	setFolderExpanded = (id, val) => {
		const { zimbraPrefFoldersExpanded } = this.props.mailboxMetadata;
		this.props.setMailboxMetadata({
			zimbraPrefFoldersExpanded: serializeFoldersExpanded({
				...normalizeFoldersExpanded(zimbraPrefFoldersExpanded),
				[id]: val
			})
		});
	};

	handleOpenNewTopLevelFolder = () => {
		this.setState({
			isAddingNewFolder: true,
			isFindingFolder: false
		});
		this.setFolderTreeOpen(true);
	};

	handleFolderSearchOpen = () => {
		this.setState({
			isFindingFolder: true,
			isAddingNewFolder: false
		});
		this.setFolderTreeOpen(true);
	};

	handleFolderPlusClick = e => {
		e.stopPropagation();
		this.handleOpenNewTopLevelFolder();
	};

	handleFolderSearchClick = e => {
		e.stopPropagation();
		this.handleFolderSearchOpen();
	};

	handleCreateTopLevelFolder = name => {
		this.setState({ isAddingNewFolder: false });
		return this.createFolder({
			name,
			view: this.props.view
		});
	};

	createFolder = options =>
		this.props.createFolder({
			variables: options
		}).then(() => {
			this.props.refetchFolders();
		})

	handleCloseCreateTopLevelFolder = () => {
		this.setState({ isAddingNewFolder: false });
	};

	handleFolderSearchClose = () => {
		this.setState({
			isFindingFolder: false,
			searchQuery: ''
		});
	};

	handleToggleFolders = () => {
		this.setFolderTreeOpen(!this.props.folderTreeOpen);
	};

	render(
		{
			account,
			folders,
			divided,
			label,
			badgeProp,
			urlSlug,
			onDrop,
			dropEffect,
			collapsibleCustomGroup,
			folderTreeOpen,
			foldersExpanded,
			defaultContextMenu,
			specialFolderList,
			hiddenFolderList = [],
			matchesMediaQuery,
			...props
		},
		{
			isAddingNewFolder,
			isFindingFolder,
			searchQuery
		}
	) {
		if (!folders || folders.length === 0) {
			return null;
		}

		// Remove hidden folders
		folders = computeCustomFolders(folders, hiddenFolderList);

		const specialFolders = computeSpecialFolders(folders, specialFolderList);
		const customFolders = computeCustomFolders(folders, specialFolderList);

		return (
			<div {...props} class={cx(style.folderList, props.class)}>
				{specialFolders.map(this.folderMap())}

				{divided &&
					specialFolders.length > 0 &&
					folders.length > 0 && (
					<div class={style.divider}>
						<Text id={'folderlist.folders'}>Folders</Text>
					</div>
				)}

				{collapsibleCustomGroup ? (
					<FolderGroup
						onToggle={this.handleToggleFolders}
						onCreateFolder={this.handleOpenNewTopLevelFolder}
						onFindFolder={this.handleFolderSearchOpen}
						collapsed={!folderTreeOpen}
						name={
							<div class={style.customFolderToggle}>
								<div class={style.customFolderToggleName}>
									<Text id={'folderlist.folders'}>Folders</Text>
								</div>
								{matchesMediaQuery && (
									<div
										class={style.folderGroupAction}
										onClick={this.handleFolderSearchClick}
									>
										<Icon name="search" size="sm" />
									</div>
								)}
								<div
									class={style.folderGroupAction}
									onClick={this.handleFolderPlusClick}
								>
									<Icon name="plus" size="sm" />
								</div>
							</div>
						}
					>
						{isAddingNewFolder && (
							<NewFolder
								class={style.topLevelInput}
								onSubmit={this.handleCreateTopLevelFolder}
								onClose={this.handleCloseCreateTopLevelFolder}
							/>
						)}

						{isFindingFolder && (
							<FolderInput
								value={searchQuery}
								onClose={this.handleFolderSearchClose}
								onInput={linkstate(this, 'searchQuery')}
								class={style.topLevelInput}
								closeOnBlur={false}
								placeholderTextId="mail.folders.FIND_PLACEHOLDER"
								icon="search"
							/>
						)}

						{searchQuery
							? filteredFolders(customFolders, searchQuery).map(
								this.folderMap({ disableCollapse: true })
							)
							: customFolders.map(this.folderMap({ grouped: true }))}
					</FolderGroup>
				) : (
					customFolders.map(this.folderMap())
				)}
			</div>
		);
	}
}
