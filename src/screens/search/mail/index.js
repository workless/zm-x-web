import { h, Component } from 'preact';
import { route } from 'preact-router';
import { Text } from 'preact-i18n';
import { connect } from 'preact-redux';
import { defaultProps } from 'recompose';
import partition from 'lodash-es/partition';
import flatMap from 'lodash-es/flatMap';
import isEmpty from 'lodash-es/isEmpty';
import get from 'lodash-es/get';
import { configure } from '../../../config';

import { DEFAULT_SORT, DEFAULT_LIMIT } from '../../../constants/search';
import { groupMailBy } from '../../../constants/user-prefs';

import { getUserPref } from '../../../store/email/selectors';
import { getSearchQuery, getSearchEmail, getSearchFolder } from '../../../store/url/selectors';
import { setPreviewAttachment } from '../../../store/attachment-preview/actions';

import accountInfo from '../../../graphql-decorators/account-info';
import search from '../../../graphql-decorators/search';
import getMailFolders from '../../../graphql-decorators/get-mail-folders';
import { getMailboxMetadata } from '../../../graphql-decorators/mailbox-metadata';
import { types as apiClientTypes } from '@zimbra/api-client';

import registerTab from '../../../enhancers/register-tab';
import { updateQuery } from '../../../utils/query-params';
import saveAs from '../../../lib/save-as';
import Fill from '../../../components/fill';
import SearchToolbar from '../../../components/search-toolbar';
import MailSidebar from '../../../components/mail-sidebar';
import MailListFooter from '../../../components/mail-list-footer';
import MailPane from '../../../components/mail-pane';
import ContactFrequencyCard from '../../../components/contact-frequency-card';
import RelatedContactsCard from '../../../components/related-contacts-card';
import { isImageDeep } from '../../../utils/attachments';
import { getConversationFolder, findFolder } from '../../../utils/folders';
import AttachmentsPane from '../../../components/attachments-pane';

import style from './style.less';

const { MailFolderView } = apiClientTypes;

function getAttachments(messages) {
	if (!Array.isArray(messages)) return [];
	return flatMap(messages, message =>
		(message.attachments || []).map(attachment => ({
			attachment,
			message
		}))
	);
}

@configure('routes.slugs')
@defaultProps({
	limit: DEFAULT_LIMIT,
	sortBy: DEFAULT_SORT
})
@connect(
	state => ({
		query: getSearchQuery(state),
		email: getSearchEmail(state),
		folder: getSearchFolder(state),
		groupBy: getUserPref(state, groupMailBy.name) || groupMailBy.default,
		view: state.url.view
	}),
	{ preview: setPreviewAttachment }
)
@getMailboxMetadata()
@getMailFolders()
@accountInfo()
@search({
	skip: ({ account, query, email }) => !account || (!query && !email),
	options: ({ account, sort, query: q, email, folder, limit }) => {
		let query = [q, email].filter(Boolean).join(' ');
		query = folder !== 'All' && !isEmpty(folder) ? query + ` in:"${folder}"` : query;

		return {
			variables: {
				types: account.prefs.zimbraPrefGroupMailBy || MailFolderView.conversation,
				limit,
				recip: 2,
				sortBy: sort,
				query,
				needExp: 1,
				fullConversation: true
			}
		};
	}
})
@search({
	name: 'attachmentsSearch',
	skip: ({ account, query, email }) => !account || (!query && !email),
	options: ({ sort, query: q, email, folder, limit }) => {
		let query = [q, email].filter(Boolean).join(' ');
		query = folder !== 'All' && !isEmpty(folder) ? query + ` in:"${folder}"` : query;

		return {
			variables: {
				types: 'message',
				sortBy: sort,
				query: `${query} has:attachment`,
				fetch: 'all',
				limit
			}
		};
	}
})
@registerTab(({ query }) => ({
	type: 'search',
	id: 'search',
	title: `Search Results - "${query}"`
}))
export default class MailSearch extends Component {
	state = {
		selectedPane: 'Messages'
	};

	navigateToItem = e => route(`/${e.type}/${e.item.id}`);

	handleSort = sortBy => {
		route(updateQuery({ sort: sortBy }), true);
	};

	downloadAttachment = ({ url, filename }) => e => {
		e.stopPropagation();
		saveAs(url, filename);
	};

	emailAttachment = conversationId => e => {
		e.stopPropagation();
		route(`/conversation/${conversationId}`);
	};

	togglePreviewer = ({ attachment, attachments }) =>
		this.props.preview && this.props.preview(attachment, attachments);

	setSelectedPane = selectedPane => {
		this.setState({ ...this.state, selectedPane });
		this.refetch();
	}

	refetch = () => {
		this.props.refetchSearch();
		this.props.refetchAttachmentsSearch();
	}

	handleClearSelection = () => {
		this.clearSelection();
	};

	registerClearSelection = clearSelection => {
		this.clearSelection = clearSelection;
	};

	renderNoItems() {
		return (
			<MailListFooter>
				<Text id="search.results" plural={0} />
			</MailListFooter>
		);
	}

	render({
		search: results,
		folders,
		searchLoading,
		refetchSearch,
		sort,
		groupBy,
		limit,
		types,
		query,
		email,
		attachmentsSearch
	}, {
		selectedPane
	}) {
		let items = [];
		if (results && results.conversations) {
			items = results.conversations.map(c => ({
				...c,
				folder: getConversationFolder(folders, c)
			}));
		}
		else if (results && results.messages) {
			items = results.messages.map(m => ({
				...m,
				folder: findFolder(folders, m.folderId)
			}));
		}
		const attachmentItems = getAttachments(get(attachmentsSearch, 'messages', []));

		const [pictureItems, documentItems] = partition(
			attachmentItems,
			isImageDeep
		);

		return (
			<Fill>
				<MailSidebar
					onClearSelection={this.handleClearSelection}
					refresh={this.refetch}
				/>

				<Fill>
					<SearchToolbar
						items={items}
						more={results && results.more}
						limit={limit}
						view={types}
						query={query}
						handleSetPane={this.setSelectedPane}
					/>

					<div class={style.bodyContainer}>
						{selectedPane === 'Messages' ? (
							<div class={style.innerContainer}>
								<MailPane
									listType={groupBy}
									items={items}
									pending={searchLoading}
									more={results && results.more}
									sortBy={sort}
									headerClass={style.searchMailHeader}
									renderNoItems={this.renderNoItems}
									afterAction={refetchSearch}
									afterBulkDelete={refetchSearch}
									onItemClick={this.navigateToItem}
									onSort={this.handleSort}
									registerClearSelection={this.registerClearSelection}
									wide
									disablePreview
									disableMessageNavigation
									showFolderName
								/>

								{email && (
									<div class={style.emailSearchSidebar}>
										<ContactFrequencyCard email={email} />
										<RelatedContactsCard email={email} />
									</div>
								)}
							</div>
						) : (
							<AttachmentsPane
								items={
									selectedPane === 'Photos' ? pictureItems : documentItems || []
								}
								type="conversation"
								sortBy="date"
								groupByDate
								onDownload={this.downloadAttachment}
								onEmail={this.emailAttachment}
								onTogglePreviewer={this.togglePreviewer}
								renderNoItems={this.renderNoItems}
								isPicturesPane={selectedPane === 'Photos'}
							/>
						)}
					</div>
				</Fill>
			</Fill>
		);
	}
}
