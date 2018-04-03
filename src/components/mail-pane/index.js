import { h, Component } from 'preact';
import { connect } from 'preact-redux';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { configure } from '../../config';
import { route } from 'preact-router';
import wire from 'wiretie';
import cx from 'classnames';
import mitt from 'mitt';
import flatMap from 'lodash-es/flatMap';
import uniq from 'lodash-es/uniq';
import get from 'lodash-es/get';
import findIndex from 'lodash-es/findIndex';
import find from 'lodash-es/find';
import last from 'lodash-es/last';
import castArray from 'lodash-es/castArray';
import first from 'lodash-es/first';
import queryString from 'query-string';
import { branch, renderNothing } from 'recompose';
import { Icon } from '@zimbra/blocks';
import { types as apiClientTypes } from '@zimbra/api-client';

import { FORWARD, REPLY, REPLY_ALL } from '../../constants/mail';
import { CARRIAGE_RETURN } from '../../../packages/@zimbra/blocks/src/constants/key-codes';
import { conversation as conversationType } from '../../constants/types';
import { minWidth, screenSm, screenMd } from '../../constants/breakpoints';

import { callWith } from '../../lib/util';
import newMessageDraft from '../../utils/new-message-draft';
import { withoutAccountAddresses } from '../../utils/account';

import {
	readMailItem,
	bulkDeleteMessages,
	clearSelected,
	toggleSelected,
	toggleAllSelected
} from '../../store/mail/actions';
import { getSelectedIds } from '../../store/mail/selectors';
import {
	openModalCompose,
	setMailboxMetadata
} from '../../store/email/actions';
import { notify } from '../../store/notifications/actions';
import { removeTab } from '../../store/navigation/actions';
import { getAttachmentPreviewVisibility } from '../../store/attachment-preview/selectors';

import MailList from '../mail-list';
import MailListHeader from '../mail-list-header';
import MailActions from '../mail-actions';
import MailLoadingFooter from '../mail-loading-footer';
import MailToolbar from '../mail-toolbar';
import BlockDialog from '../block-dialog';
import PreviewResizeControl from '../preview-resize-control';
import MessageViewer from '../message-viewer';
import ViewerPlaceholder from '../viewer-placeholder';
import ConversationViewer from '../conversation-viewer';

import accountInfo from '../../graphql-decorators/account-info';
import getMailFolders from '../../graphql-decorators/get-mail-folders';
import ActionMutation from '../../graphql/queries/action.graphql';

import s from './style.less';
import withCommandHandlers from '../../keyboard-shortcuts/with-command-handlers';
import withMediaQuery from '../../enhancers/with-media-query';
import MarkAsRead from '../../graphql-decorators/mark-as-read';

const {	ReadingPaneLocation, ActionOps, ActionType, ActionResultType } = apiClientTypes;

const ReadingPaneSashHorizontalDefault = 50;

const AddShortcuts = withCommandHandlers(props => [
	{
		context: 'mail',
		command: 'MARK_AS_READ',
		handler: () => props.handleMarkRead(true)
	},
	{
		context: 'mail',
		command: 'MARK_AS_UNREAD',
		handler: () => props.handleMarkRead(false)
	},
	{
		context: 'mail',
		command: 'DELETE_MESSAGES',
		handler: () => props.handleDeleteMailItem()
	},
	{ context: 'mail', command: 'COMPOSE_MESSAGE', handler: props.handleCompose },
	{
		context: 'mail',
		command: 'OPEN_INBOX',
		handler: () => route(`/${props.slug}/Inbox`)
	},
	{
		context: 'mail',
		command: 'OPEN_DRAFTS',
		handler: () => route(`/${props.slug}/Drafts`)
	},
	{
		context: 'mail',
		command: 'OPEN_JUNK',
		handler: () => route(`/${props.slug}/Junk`)
	},
	{
		context: 'mail',
		command: 'OPEN_SENT',
		handler: () => route(`/${props.slug}/Sent`)
	},
	{
		context: 'mail',
		command: 'OPEN_TRASH',
		handler: () => route(`/${props.slug}/Trash`)
	}
])(() => {});

const BULK_DELETE_PER_PAGE = 1000;

const toolbarEmitter = mitt();

function updateFlags(flags, variables) {
	if (variables.op === ActionOps.read) {
		return flags.replace('u', '');
	}
	if (variables.op === ActionOps.unread) {
		return `${flags}u`;
	}
	if (variables.op === ActionOps.unflag) {
		return flags.replace('f', '');
	}
	if (variables.op === ActionOps.flag) {
		return `${flags}f`;
	}
	return flags;
}

@configure('routes.slugs')
@accountInfo()
@getMailFolders()
@branch(
	({ accountLoading, foldersLoading }) => accountLoading || foldersLoading,
	renderNothing
)
@wire('zimbra', {}, zimbra => ({
	updateBlackList: zimbra.whiteBlackList.updateBlackList,
	search: zimbra.search,
	createContact: zimbra.contacts.create
}))
@connect(
	state => ({
		isAttachmentViewerOpen: getAttachmentPreviewVisibility(state),
		isMediaMenuOpen: get(state, 'mediaMenu.visible'),
		selectedIds: getSelectedIds(state)
	}),
	{
		clearSelected,
		toggleSelected,
		toggleAllSelected,
		readMailItem,
		bulkDeleteMessages,
		openModalCompose,
		notify,
		setMailboxMetadata,
		removeTab
	}
)
@graphql(ActionMutation, {
	props: ({ mutate }) => ({
		action: variables =>
			mutate({
				variables,
				optimisticResponse: true,
				update: (proxy, result) => {
					// Only write on the first optimistic call
					if (result.action) {
						return;
					}

					const typename = ActionResultType[variables.type];
					const fragment = gql`
						fragment item on ${typename} {
							flags
						}
					`;
					variables.ids.forEach(id => {
						const r = proxy.readFragment({
							id: `${typename}:${id}`,
							fragment
						});
						const data = {
							__typename: r.__typename,
							flags: updateFlags(r.flags, variables)
						};
						proxy.writeFragment({
							id: `${typename}:${id}`,
							fragment,
							data
						});
					});
				}
			})
	})
})
@withMediaQuery(minWidth(screenSm), 'matchesScreenSm')
@withMediaQuery(minWidth(screenMd), 'matchesScreenMd')
export default class MailPane extends Component {
	static defaultProps = {
		items: [],
		mailItem: null,
		folder: null,
		pending: false,
		more: false,
		headerClass: null,
		renderNoItems: () => {},
		beforeAction: () => {},
		afterBulkDelete: () => {},
		onScroll: () => {},
		onItemClick: () => {},
		onReload: () => {}
	};

	state = {
		blockDialogIsOpen: false,
		blockIsPending: false,
		readingPaneSashHorizontalDragStart: null,
		modifiedReadingPaneSashHorizontal: null,
		inlineSearchIsVisible: false,
		inlineSearchInputIsVisible: true,
		clicked: false
	};

	inputRef = c => {
		this.input = c;
	};

	clearBlockDialog = () => {
		this.setState({
			blockDialogIsOpen: false,
			blockIsPending: false
		});
	};

	deleteAllMailFrom = emails => {
		let totalDeleted = 0;
		this.setState({ blockIsPending: true });

		const searchAndDelete = (offset = 0) =>
			this.props
				.search({
					offset,
					query: `from:(${emails.join(' or ')})`,
					limit: BULK_DELETE_PER_PAGE,
					full: false
				})
				.then(res => {
					totalDeleted += res.messages.length;

					this.props.bulkDeleteMessages({
						id: res.messages.map(m => m.id)
					});

					return res.more
						? searchAndDelete(offset + BULK_DELETE_PER_PAGE)
						: res;
				});

		return searchAndDelete()
			.then(() => {
				this.afterBulkDelete();
				this.props.notify({
					message: `${totalDeleted} messages deleted from blocked email addresses.`
				});
			})
			.catch(() => {
				this.afterBulkDelete();
			});
	};

	blockableEmails = item => {
		if (!this.props.items) {
			return [];
		}

		const { account, items, selectedIds, mailItem } = this.props;
		let senders = [];

		if (item) {
			senders = item.senders || [];
		}
		else if (selectedIds.size > 0) {
			senders = flatMap(
				items.filter(i => selectedIds.has(i.id)),
				c => c.senders
			);
		}
		else if (mailItem) {
			senders = mailItem.senders || [];
		}

		return uniq(
			senders
				.filter(Boolean)
				.map(sender => sender.address)
				.filter(e => e !== account.name)
		);
	};

	performAction = (options = {}, isListAction = false) => {
		const { mailItem, items, listType, selectedIds } = this.props;
		const ids = castArray(
			options.id ||
				options.ids ||
				(selectedIds.size > 0 ? Array.from(selectedIds) : mailItem.id)
		);
		const actionOptions = {
			...options,
			id: undefined,
			ids,
			type: ActionType[listType]
		};
		const prevIndexes = ids
			.map(i => findIndex(items, ['id', i]))
			.sort((a, b) => a - b);
		const firstIndex = prevIndexes[0];
		const lastIndex = last(prevIndexes);
		const itemContext = {
			isListAction,
			prevId: get(items, `${Math.max(firstIndex - 1, 0)}.id`),
			nextId: get(items, `${Math.min(lastIndex + 1, items.length - 1)}.id`)
		};

		const promise = this.props.action(actionOptions);

		this.props.beforeAction(actionOptions, itemContext);

		promise.then(() => {
			this.props.afterAction(actionOptions, itemContext);
		});

		this.props.clearSelected();
	};

	handleNext = () => {
		const { mailItem, items, selectMessage, folder, type } = this.props;
		const currentIndex = findIndex(items, ['id', mailItem.id]);
		const lastIndex = items.length - 1;
		const nextId = get(items, `${Math.min(currentIndex + 1, lastIndex)}.id`);
		if (currentIndex === lastIndex) {
			return this.props.notify({
				message: `You have reached the last message in ${folder.name}.`
			});
		}
		this.props.removeTab({ type, id: mailItem.id });
		return selectMessage(nextId);
	};

	handlePrevious = () => {
		const { mailItem, items, selectMessage, folder, type } = this.props;
		const currentIndex = findIndex(items, ['id', mailItem.id]);
		const prevId = get(items, `${Math.max(currentIndex - 1, 0)}.id`);
		if (currentIndex === 0) {
			return this.props.notify({
				message: `You have reached the first message in ${folder.name}.`
			});
		}
		this.props.removeTab({ type, id: mailItem.id });
		return selectMessage(prevId);
	};

	handleMarkRead = (value, id) =>
		this.performAction({
			id,
			op: value ? ActionOps.read : ActionOps.unread
		});

	handleArchiveMailItem = (isArchive, id) => {
		const dest = isArchive ? 'Archive' : 'Inbox';
		const regex = new RegExp(`^${dest}$`, 'i');
		const folder = find(this.props.folders, f => regex.test(f.name));

		if (!folder) {
			throw new Error('Archive folder does not exist');
		}

		this.performAction(
			{
				id,
				op: ActionOps.move,
				folderId: folder.id,
				constraints: '-ds' // not in Drafts or Sent
			},
			true
		);
	};

	handleSpamMailItem = (value, id) =>
		this.performAction(
			{
				id,
				op: value ? ActionOps.spam : ActionOps.unspam
			},
			true
		);

	handleFlag = (value, id) =>
		this.performAction({
			id,
			op: value ? ActionOps.flag : ActionOps.unflag
		});

	handleMoveMailItem = destFolderId => {
		if (destFolderId !== get(this.props, 'folder.id')) {
			this.performAction(
				{
					op: ActionOps.move,
					folderId: destFolderId,
					constraints: '-ds' // not in Drafts or Sent
				},
				true
			);
		}
	};

	handleDeleteMailItem = id =>
		this.performAction(
			{
				id,
				op: ActionOps.trash
			},
			true
		);

	handleAddSenderToContacts = sender => this.props.createContact(sender);

	handleCheckboxSelect = (id, e) => this.props.toggleSelected({ id, e });

	handleToggleSelectAll = () =>
		this.props.toggleAllSelected({ items: this.props.items });

	handleToggleBlockDialog = () => {
		this.setState({
			blockableEmails: null,
			blockDialogIsOpen: !this.state.blockDialogIsOpen
		});
	};

	handleRightClickBlock = item => {
		this.setState({
			blockableEmails: this.blockableEmails(item),
			blockDialogIsOpen: !this.state.blockDialogIsOpen
		});
	};

	handleAddToBlackList = ({ emails, blockAll, deleteAll }) => {
		if (emails.length === 0) {
			this.setState({ blockDialogIsOpen: false });
			return;
		}

		const promises = [];
		this.setState({ blockIsPending: true });

		if (deleteAll) {
			promises.push(this.deleteAllMailFrom(emails));
		}

		if (blockAll) {
			promises.push(
				this.props.updateBlackList(
					emails.map(email => ({
						email,
						op: '+'
					}))
				)
			);
		}

		Promise.all(promises)
			.then(this.clearBlockDialog)
			.catch(() => {
				this.clearBlockDialog();
			});
	};

	handlePreviewResizeStart = () => {
		this.setState({
			readingPaneSashHorizontalDragStart:
				this.state.modifiedReadingPaneSashHorizontal ||
				this.props.readingPaneSashHorizontal ||
				ReadingPaneSashHorizontalDefault
		});
	};

	handlePreviewResize = offset => {
		this.setState({
			modifiedReadingPaneSashHorizontal:
				this.state.readingPaneSashHorizontalDragStart +
				offset / this.base.offsetHeight * 100
		});
	};

	handlePreviewResizeEnd = () => {
		this.props.setMailboxMetadata({
			zimbraPrefReadingPaneSashHorizontal: Math.round(
				this.state.modifiedReadingPaneSashHorizontal
			)
		});
	};

	handleCompose = () =>
		this.props.openModalCompose({ message: newMessageDraft() });

	handleSearchForContact = mailItem => {
		const sender = first(
			mailItem.emailAddresses.filter(withoutAccountAddresses(this.props.account))
		);

		if (sender) {
			route(
				`/search/${this.props.slugs.email}?e=${encodeURIComponent(
					sender.address
				)}`
			);
		}
	};

	setClicked = () => {
		this.setState({ ...this.state, clicked: !this.state.clicked });
	};

	handleSubmit = e => {
		let text = this.input.value;
		if (e.keyCode === CARRIAGE_RETURN) {
			route(
				`/search/email?${queryString.stringify({
					q: text || undefined,
					type: 'conversation',
					folder: 'All'
				})}`
			);
		}
	};

	toggleInlineSearchVisibility = isVisible =>
		this.setState({ inlineSearchInputIsVisible: isVisible });

	expandButton = () => {
		this.input.focus();
		this.setState({ inlineSearchIsVisible: !this.state.inlineSearchIsVisible });
	};

	componentDidMount() {
		this.props.clearSelected();
		this.props.registerClearSelection(this.props.clearSelected);
	}

	componentWillReceiveProps(nextProps) {
		const { mailItem, folder } = nextProps;
		const { mailItem: prevMailItem, folder: prevFolder } = this.props;

		if (
			get(mailItem, 'id') !== get(prevMailItem, 'id') ||
			get(folder, 'name') !== get(prevFolder, 'name')
		) {
			this.props.clearSelected();
		}
	}

	renderMailActions = (toolbarProps = {}) => {
		const {
			folder,
			mailItem,
			mailItemId,
			type,
			onCloseMessage,
			isAttachmentViewerOpen,
			isMediaMenuOpen,
			selectedIds
		} = this.props;
		const blockableEmails = this.blockableEmails();
		return (
			<MailActions
				isAttachmentViewerOpen={isAttachmentViewerOpen}
				isMediaMenuOpen={isMediaMenuOpen}
				multiple={selectedIds.size > 0}
				singleMailItem={mailItem}
				singleMailItemType={type}
				currentFolder={folder}
				disabled={!mailItem && selectedIds.size === 0}
				disableBlock={blockableEmails.length === 0}
				onArchive={this.handleArchiveMailItem}
				onBlock={this.handleToggleBlockDialog}
				onDelete={callWith(this.handleDeleteMailItem, mailItemId)}
				onSpam={this.handleSpamMailItem}
				onMarkRead={this.handleMarkRead}
				onFlag={this.handleFlag}
				onMove={this.handleMoveMailItem}
				onReply={callWith(toolbarEmitter.emit, REPLY)}
				onReplyAll={callWith(toolbarEmitter.emit, REPLY_ALL)}
				onForward={callWith(toolbarEmitter.emit, FORWARD)}
				handleNext={this.handleNext}
				handlePrevious={this.handlePrevious}
				handleClose={onCloseMessage}
				{...toolbarProps}
			/>
		);
	};

	render(
		{
			type,
			listType,
			account,
			items,
			folder,
			pending,
			more,
			sortBy,
			headerClass,
			mailItem,
			mailItemId,
			onSend,
			onSort,
			onDeleteDraft,
			onItemClick,
			onItemDblClick,
			disableList,
			disablePreview: disablePreviewProp,
			disableMessageNavigation,
			wide: wideProp,
			showFolderName,
			showSnippets,
			isAttachmentViewerOpen,
			isMediaMenuOpen,
			selectedIds,
			slugs,
			matchesScreenSm,
			matchesScreenMd,
			...rest
		},
		{
			blockIsPending,
			blockDialogIsOpen,
			modifiedReadingPaneSashHorizontal,
			inlineSearchIsVisible,
			inlineSearchInputIsVisible,
			clicked
		}
	) {
		const readingPaneLocation = account.prefs.zimbraPrefReadingPaneLocation;
		const readingPaneSashHorizontal =
			account.prefs.zimbraPrefReadingPaneSashHorizontal;
		const blockableEmails = this.blockableEmails();
		const disablePreview =
			disablePreviewProp || readingPaneLocation === ReadingPaneLocation.off;
		const previewEnabled = !disablePreview;
		const rightPreviewEnabled =
			previewEnabled &&
			// right preview is enabled on landscape tablet
			((readingPaneLocation === ReadingPaneLocation.right && matchesScreenSm) ||
				// override bottom preview to display as right preview on landscape tablet
				(readingPaneLocation === ReadingPaneLocation.bottom &&
					!matchesScreenMd &&
					matchesScreenSm));
		const bottomPreviewEnabled =
			previewEnabled &&
			matchesScreenMd &&
			readingPaneLocation === ReadingPaneLocation.bottom;
		const wide = wideProp || (!rightPreviewEnabled && matchesScreenSm);
		const listHeight =
			modifiedReadingPaneSashHorizontal ||
			parseInt(readingPaneSashHorizontal, 10) ||
			ReadingPaneSashHorizontalDefault;
		const showList =
			!disableList && ((previewEnabled && matchesScreenSm) || !mailItemId);

		return (
			<div
				class={cx(
					s.mailPane,
					rest.class,
					isAttachmentViewerOpen && s.attachmentViewerOpen,
					isMediaMenuOpen && s.mediaMenuOpen,
				)}
			>
				<AddShortcuts
					slug={slugs.email}
					handleMarkRead={this.handleMarkRead}
					handleDeleteMailItem={this.handleDeleteMailItem}
					handleCompose={this.handleCompose}
				/>
				{showList && (
					<div
						class={cx(
							s.mailListPane,
							rightPreviewEnabled && s.narrow,
							bottomPreviewEnabled && s.withBottomPreview,
							isAttachmentViewerOpen && s.collapse
						)}
						style={bottomPreviewEnabled ? { height: `${listHeight}%` } : {}}
					>
						{!inlineSearchInputIsVisible && (
							<div
								class={cx(
									bottomPreviewEnabled && s.buttonsAlign,
									s.hideMdDown,
									s.scrollParent
								)}
							>
								<button
									title="Back to top"
									class={s.scrollToTop}
									onClick={this.setClicked}
								>
									<Icon size="md" name="arrow-up" />
								</button>
								<div
									class={cx(
										s.searchContainer,
										inlineSearchIsVisible && s.inlineSearchIsVisible
									)}
								>
									<button
										class={s.searchButton}
										type="submit"
										onClick={this.expandButton}
									>
										<Icon size="md" name="search" />
									</button>
									<input
										class={s.input}
										type="search"
										placeholder="Search"
										ref={this.inputRef}
										onKeydown={this.handleSubmit}
									/>
								</div>
							</div>
						)}

						<MailListHeader
							class={cx(wide && headerClass)}
							currentFolder={folder}
							selected={selectedIds}
							allSelected={
								!pending &&
								items &&
								items.length > 0 &&
								selectedIds.size === items.length
							}
							onToggleSelectAll={this.handleToggleSelectAll}
							onSort={onSort}
							sortBy={sortBy}
							wide={wide}
						>
							{wide &&
								this.renderMailActions({
									wide,
									hideReplyActions: disablePreview,
									hideMessageNavigation:
										previewEnabled || showList || disableMessageNavigation
								})}
						</MailListHeader>

						{items && items.length > 0 ? (
							<MailList
								type={listType}
								account={account}
								items={{
									more,
									pending,
									data: items
								}}
								folderName={get(folder, 'name')}
								handleItemCheckboxSelect={this.handleCheckboxSelect}
								handleItemClick={onItemClick}
								handleItemDblClick={onItemDblClick}
								onDelete={this.handleDeleteMailItem}
								onScroll={this.props.onScroll}
								onMarkRead={this.handleMarkRead}
								onSpam={this.handleSpamMailItem}
								onArchive={this.handleArchiveMailItem}
								onBlock={this.handleRightClickBlock}
								onAddToContacts={this.handleAddSenderToContacts}
								clicked={clicked}
								setClicked={this.setClicked}
								toggleInlineSearchVisibility={this.toggleInlineSearchVisibility}
								onFlag={this.handleFlag}
								onSearch={this.handleSearchForContact}
								selectedIds={selectedIds}
								viewingId={mailItemId}
								sortBy={sortBy}
								wide={wide}
								showFolderName={showFolderName}
								showSnippets={showSnippets}
							/>
						) : pending ? (
							<MailLoadingFooter />
						) : (
							this.props.renderNoItems(this.props)
						)}
					</div>
				)}

				{bottomPreviewEnabled && (
					<PreviewResizeControl
						onDragStart={this.handlePreviewResizeStart}
						onDrag={this.handlePreviewResize}
						onDragEnd={this.handlePreviewResizeEnd}
						class={s.horizontalResizeControl}
					/>
				)}

				{(mailItemId || (previewEnabled && matchesScreenSm)) && (
					<div
						class={cx(
							s.readPane,
							bottomPreviewEnabled && s.readPaneWide,
							isAttachmentViewerOpen && s.rightPaneOpen
						)}
						style={
							bottomPreviewEnabled && !isAttachmentViewerOpen
								? { height: `${100 - listHeight}%` }
								: {}
						}
					>
						{(!bottomPreviewEnabled || isAttachmentViewerOpen) &&
							matchesScreenSm &&
							this.renderMailActions({
								hideMessageNavigation:
									(previewEnabled && showList) ||
									showList ||
									disableMessageNavigation
							})}

						{selectedIds.size > 0 || !mailItem ? (
							<ViewerPlaceholder numSelected={selectedIds.size} />
						) : (
							<MarkAsRead type={type} item={mailItem}>
								{type === conversationType ? (
									<ConversationViewer
										events={toolbarEmitter}
										conversation={mailItem}
										onCompose={this.handleCompose}
										onDeleteDraft={onDeleteDraft}
										onSend={onSend}
										wide={!showList}
										matchesScreenSm={matchesScreenSm}
										matchesScreenMd={matchesScreenMd}
									/>
								) : (
									<MessageViewer
										events={toolbarEmitter}
										message={mailItem}
										messageFull={mailItem}
										onFlag={this.handleFlag}
										onMarkRead={this.handleMarkRead}
										onDeleteDraft={onDeleteDraft}
										onSend={onSend}
										wide={!showList}
									/>
								)}
							</MarkAsRead>
						)}
					</div>
				)}

				{blockDialogIsOpen && (
					<BlockDialog
						emails={this.state.blockableEmails || blockableEmails}
						pending={blockIsPending}
						onConfirm={this.handleAddToBlackList}
						onClose={this.handleToggleBlockDialog}
					/>
				)}
				<MailToolbar
					hideContextActions={
						matchesScreenSm || (!mailItem && selectedIds.size === 0)
					}
					hideBackButton={!mailItemId}
					isAttachmentViewerOpen={isAttachmentViewerOpen}
					currentFolder={folder}
					singleMailItem={mailItem}
					disabled={!mailItem && selectedIds.size === 0}
					disableBlock={blockableEmails.length === 0}
					multiple={selectedIds.size > 0}
					onCompose={this.handleCompose}
					onArchive={this.handleArchiveMailItem}
					onBlock={this.handleToggleBlockDialog}
					onDelete={this.handleDeleteMailItem}
					onMarkRead={this.handleMarkRead}
					onFlag={this.handleFlag}
					onMove={this.handleMoveMailItem}
					account={account}
				/>
			</div>
		);
	}
}
