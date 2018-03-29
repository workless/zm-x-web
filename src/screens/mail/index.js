import { h, Component } from 'preact';
import { route } from 'preact-router';
import { connect } from 'preact-redux';
import { graphql } from 'react-apollo';
import { configure } from '../../config';
import {
	defaultProps,
	branch,
	renderNothing,
	withStateHandlers,
	withProps
} from 'recompose';
import { types as apiClientTypes } from '@zimbra/api-client';
import { closeCompose } from '../../store/email/actions';
import { findFolderByName } from '../../utils/folders';

import Fill from '../../components/fill';
import MailSidebar from '../../components/mail-sidebar';
import MailPane from '../../components/mail-pane';
import MailListFooter from '../../components/mail-list-footer';
import Draft from '../../components/draft';

import s from './style';
import withCommandHandlers from '../../keyboard-shortcuts/with-command-handlers';

import accountInfo from '../../graphql-decorators/account-info';
import getMailFolders from '../../graphql-decorators/get-mail-folders';
import search from '../../graphql-decorators/search';
import { getMailboxMetadata } from '../../graphql-decorators/mailbox-metadata';
import ConversationQuery from '../../graphql/queries/conversation.graphql';
import MessageQuery from '../../graphql/queries/message.graphql';

const {	MailFolderView,	SortBy,	PrefMailSelectAfterDelete } = apiClientTypes;

const AddShortcuts = withCommandHandlers(props => [
	{
		context: 'mail',
		command: 'FETCH_MAIL',
		handler: props.handleActiveFolderClick
	}
])(() => {});

@configure({ urlSlug: 'routes.slugs.email' })
@defaultProps({ folderName: 'Inbox' })
@connect(
	state => {
		let compose = state.email && state.email.compose;
		let { message } = compose || {};
		if (compose && !message) {
			message = compose;
		}

		return {
			compose,
			message
		};
	},
	{
		closeCompose
	}
)
// Prime the cache with the mailbox metadata and folder list
@getMailboxMetadata()
@getMailFolders()
@accountInfo(({ data: { accountInfo: account } }) => ({
	viewType: account.prefs.zimbraPrefGroupMailBy
}))
@withStateHandlers(
	{
		sortBy: SortBy.dateDesc
	},
	{
		setSortBy: () => sortBy => ({ sortBy })
	}
)
@branch(({ foldersLoading }) => foldersLoading, renderNothing)
@search({
	skip: ({ account }) => !account,
	options: ({ viewType, sortBy, folderName }) => ({
		fetchPolicy: 'cache-and-network',
		variables: {
			types: viewType || MailFolderView.conversation,
			limit: 50,
			recip: 2,
			sortBy,
			query: `in:"${folderName}"`
		}
	})
})
@graphql(MessageQuery, {
	name: 'messageQuery',
	skip: ({ id, viewType }) => !id || viewType !== MailFolderView.message,
	options: ({ id }) => ({ variables: { id } })
})
@graphql(ConversationQuery, {
	name: 'conversationQuery',
	skip: ({ id, type }) => !id || type !== MailFolderView.conversation,
	options: ({ id }) => ({
		variables: {
			id,
			fetch: 'all',
			html: true,
			needExp: true,
			max: 250000,
			neuter: false
		}
	})
})
@branch(
	({ search: results }) => !results,
	renderNothing
)
@withProps(({ account: { prefs } }) => ({
	markAsReadAfterSeconds: prefs.zimbraPrefMarkMsgRead,
	showSnippets: prefs.zimbraPrefShowFragments
}))
export default class Mail extends Component {
	handleListScroll = () => {
		if (this.props.search.more && !this.props.searchLoading) {
			this.props.searchLoadNext();
		}
	};

	urlForMessage = (id, type = this.props.viewType, full = false) =>
		`/${this.props.urlSlug}/${encodeURIComponent(
			this.props.folderName
		)}/${type}/${encodeURIComponent(id)}${full ? '?full=true' : ''}`;

	routeToParentFolder = () => {
		route(
			`/${this.props.urlSlug}/${encodeURIComponent(this.props.folderName)}`
		);
	};

	routeToMailItem = (id, type) =>
		route(this.urlForMessage(id, type, this.props.full), true);

	handleCloseMessage = () =>
		route(
			`/${this.props.urlSlug}/${encodeURIComponent(this.props.folderName)}`
		);

	handleBeforeAction = (options, { nextId, prevId, isListAction }) => {
		if (!isListAction) {
			return;
		}

		const { id, account, folderName, type } = this.props;
		const mailSelectAfterDelete = account.prefs.zimbraPrefMailSelectAfterDelete;

		if (
			mailSelectAfterDelete === PrefMailSelectAfterDelete.next &&
			nextId &&
			id
		) {
			return this.routeToMailItem(nextId, type);
		}
		if (
			mailSelectAfterDelete === PrefMailSelectAfterDelete.previous &&
			prevId &&
			id
		) {
			return this.routeToMailItem(prevId, type);
		}
		if (id) {
			return route(`/${this.props.urlSlug}/${encodeURIComponent(folderName)}`);
		}
	};

	handleAfterAction = (options, { isListAction }) => {
		if (isListAction) {
			this.props.refetchSearch();
		}
	};

	handleClickItem = e => {
		const url = e.item ? this.urlForMessage(e.item.id, e.type) : '/';
		route(url, !!this.props.id);
	};

	handleDblClickItem = e => {
		const url = e.item ? this.urlForMessage(e.item.id, e.type, true) : '/';
		route(url, true);
	};

	handleSend = () => {
		this.handleReload();

		if (this.props.viewType === MailFolderView.message) {
			this.routeToParentFolder();
		}
	};

	handleDraftSend = () => {
		this.props.onSend && this.props.onSend();
		this.props.closeCompose && this.props.closeCompose();
	};

	handleDeleteDraft = () => {
		if (this.props.viewType === MailFolderView.message) {
			this.routeToParentFolder();
		}
		else {
			this.handleReload();
		}
	};

	handleReload = () => {
		this.props.closeCompose && this.props.closeCompose();
		return this.props.refetchSearch();
	};

	handleSort = sortBy => this.props.setSortBy(sortBy);

	handleClearSelection = () => {
		this.clearSelection();
	};

	registerClearSelection = clearSelection => {
		this.clearSelection = clearSelection;
	};

	componentWillUnmount() {
		this.isUmounted = true;
		clearTimeout(this.markAsReadTimer);
		this.props.closeCompose();
	}

	renderNoItems = () => (
		<MailListFooter>
			<span>
				Your <strong>{this.props.folderName}</strong> folder is empty
			</span>
		</MailListFooter>
	);

	render({
		account,
		conversationQuery,
		disableList,
		disableMessageNavigation,
		folders,
		folderName,
		full,
		id,
		type,
		compose,
		message,
		messageQuery,
		search: results,
		searchLoading,
		viewType
	}) {
		const mailItem =
			(conversationQuery && conversationQuery.conversation) ||
			(messageQuery && messageQuery.message);
		const folder = findFolderByName(folders, folderName);

		return (
			<Fill>
				<AddShortcuts handleActiveFolderClick={this.handleActiveFolderClick} />
				<MailSidebar
					folder={folder}
					refresh={this.handleReload}
					onClearSelection={this.handleClearSelection}
				/>

				{compose ? (
					<Draft
						messageDraft={message}
						onSend={this.handleDraftSend}
						onCancel={this.props.closeCompose}
					/>
				) : (
					<MailPane
						type={type}
						listType={viewType}
						items={results.conversations || results.messages}
						pending={searchLoading}
						sortBy={results.sortBy}
						more={results.more}
						mailItem={mailItem && mailItem.id === id && mailItem}
						mailItemId={id}
						folder={folder}
						beforeAction={this.handleBeforeAction}
						afterAction={this.handleAfterAction}
						afterBulkDelete={this.refetchSearch}
						onScroll={this.handleListScroll}
						onItemClick={this.handleClickItem}
						onItemDblClick={this.handleDblClickItem}
						onReload={this.handleReload}
						onSend={this.handleSend}
						onDeleteDraft={this.handleDeleteDraft}
						onSort={this.handleSort}
						headerClass={s.mailHeader}
						renderNoItems={this.renderNoItems}
						disableList={disableList || full === 'true'}
						disableMessageNavigation={disableMessageNavigation}
						showSnippets={account.prefs.zimbraPrefShowFragments}
						selectMessage={this.routeToMailItem}
						onCloseMessage={this.handleCloseMessage}
						registerClearSelection={this.registerClearSelection}
					/>
				)}
			</Fill>
		);
	}
}
