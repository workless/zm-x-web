import { h, Component } from 'preact';
import PropTypes from 'prop-types';
import { connect } from 'preact-redux';
import cx from 'classnames';
import includes from 'lodash-es/includes';
import find from 'lodash-es/find';
import findIndex from 'lodash-es/findIndex';
import orderBy from 'lodash-es/orderBy';
import takeWhile from 'lodash-es/takeWhile';
import { conversation as conversationType } from '../../constants/types';
import Viewer from '../viewer';
import ViewerTitle from '../viewer-title';
import CondensedMessage from '../condensed-message';
import CondensedMessageOverflowIndicator from '../condensed-message-overflow-indicator';
import Draft from '../draft';
import { hasFlag, last } from '../../lib/util';
import { isAutoSendDraftMessage } from '../../utils/drafts';
import draftForMessage from '../../utils/draft-for-message';
import { FORWARD, REPLY, REPLY_ALL } from '../../constants/mail';
import { minWidth, screenXs, screenMd, screenSm } from '../../constants/breakpoints';
import { flagMailItem, readMailItem } from '../../store/mail/actions';
import { openModalCompose } from '../../store/email/actions';
import registerTab from '../../enhancers/register-tab';
import withMediaQuery from '../../enhancers/with-media-query';
import style from './style';

@registerTab(props => props.wide && ({
	type: 'conversation',
	id: props.conversation.id,
	title: props.conversation.subject
}))
@connect(null, { flagMailItem, readMailItem, openModalCompose })
@withMediaQuery(minWidth(screenXs), 'matchesScreenXs')
@withMediaQuery(minWidth(screenSm), 'matchesScreenSm')
@withMediaQuery(minWidth(screenMd), 'matchesScreenMd')
export default class ConversationViewer extends Component {
	static propTypes = {
		conversation: PropTypes.object.isRequired,
		onConversationRead: PropTypes.func.isRequired
	};

	state = {
		expandedMessages: [],
		draftMessages: [],
		expandedConversations: []
	};

	handleExpandedMessageHeaderClick = message => {
		this.toggleExpandedForMessage(message);
	};

	handleCondensedMessageClick = ({ message }) => {
		this.toggleExpandedForMessage(message);
	};

	handleExpandMessages = (messages) => {
		messages.forEach(message =>
			this.toggleExpandedForMessage(message)
		);
	}

	handleCondensedConversationClick = () => {
		this.setState({
			expandedConversations: [
				...this.state.expandedConversations,
				this.props.conversation.id
			]
		});
	}

	handleReply = message => this.createDraft(REPLY, message);

	handleReplyAll = message => this.createDraft(REPLY_ALL, message);

	handleForward = message => this.createDraft(FORWARD, message);

	createDraft = (type, message) => {
		const { conversation, matchesScreenSm } = this.props;
		const { draftMessages } = this.state;
		const existingDraft =
			find(draftMessages, { origId: message.id.toString() }) ||
			find(
				conversation.messages,
				m => hasFlag(m, 'draft') && m.origId === message.id
			);

		if (!existingDraft) {
			const draft =  draftForMessage(type, message);
			if (matchesScreenSm) {
				this.setState({
					draftMessages: [...draftMessages, draft]
				});
			}
			else {
				this.props.openModalCompose({
					mode: 'mailTo',
					message: draft
				});
			}
		}
	};

	toggleExpandedForMessage = message => {
		const { expandedMessages } = this.state;
		if (includes(expandedMessages, message.id)) {
			this.setState({
				expandedMessages: expandedMessages.filter(id => id !== message.id)
			});
			return;
		}

		this.setState({
			expandedMessages: [...expandedMessages, message.id]
		});
	};

	isFlagged = () =>
		this.props.conversation && hasFlag(this.props.conversation, 'flagged');

	isUnread = () =>
		this.props.conversation && hasFlag(this.props.conversation, 'unread');

	handleStarClick = () => {
		this.props.flagMailItem({
			id: this.props.conversation.id,
			type: conversationType,
			value: !this.isFlagged()
		});
	};

	handleReadStatusClicked = () => {
		this.props.readMailItem({
			id: this.props.conversation.id,
			type: conversationType,
			value: this.isUnread()
		});
	};

	removeDraft = messageDraft => {
		const { draftMessages } = this.state;
		this.setState({
			draftMessages: draftMessages.filter(
				draft => draft.origId.toString() !== messageDraft.origId.toString()
			)
		});
	};

	handleDeleteDraft = messageDraft => {
		if (messageDraft.id) {
			// server draft
			this.props.onDeleteDraft();
		}
		this.removeDraft(messageDraft);
	};

	handleSendDraft = messageDraft => {
		this.props.onSend();
		this.removeDraft(messageDraft);
	};

	setExpandedMessages({ conversation }) {
		if (!conversation) {
			return;
		}

		if (
			this.state.expandedMessages.length === 0 ||
			conversation.id !== this.props.conversation.id
		) {
			this.setState({
				expandedMessages: [last(conversation.messages).id]
			});
		}
	}

	sortedMessagesAndDrafts = () => {
		const { conversation: { messages } } = this.props;

		return orderBy(
			[...messages, ...this.state.draftMessages],
			[
				m => {
					const parentMessage = m.origId
						? find(messages, ({ id }) => id.toString() === m.origId.toString())
						: null;
					return parentMessage ? parentMessage.date : m.date;
				},
				m => {
					// Makes room for inline drafts in the sequence of ids
					const indexMultiplier = 2;
					const parentMessageIndex = m.origId
						? findIndex(
							messages,
							({ id }) => id.toString() === m.origId.toString()
						) *
								indexMultiplier +
							1
						: findIndex(
							messages,
							({ id }) => id.toString() === m.id.toString()
						) * indexMultiplier;
					return parentMessageIndex;
				}
			]
		);
	};

	getLastNonDraftMessage = () =>
		last(this.sortedMessagesAndDrafts().filter(m => !hasFlag(m, 'draft')));

	handleToolbarReply = () =>
		this.createDraft(REPLY, this.getLastNonDraftMessage());

	handleToolbarReplyAll = () =>
		this.createDraft(REPLY_ALL, this.getLastNonDraftMessage());

	handleToolbarForward = () =>
		this.createDraft(FORWARD, this.getLastNonDraftMessage());

	handleEventBindings(fn) {
		fn(REPLY, this.handleToolbarReply);
		fn(REPLY_ALL, this.handleToolbarReplyAll);
		fn(FORWARD, this.handleToolbarForward);
	}

	componentWillMount() {
		this.setExpandedMessages(this.props);
	}

	componentDidMount() {
		this.handleEventBindings(this.props.events.on);
	}

	componentWillReceiveProps(nextProps) {
		this.setExpandedMessages(nextProps);
		if (nextProps.conversation.id !== this.props.conversation.id) {
			this.setState({ draftMessages: [] });
		}
	}

	componentWillUnmount() {
		this.handleEventBindings(this.props.events.off);
	}

	renderMessageList(messages) {
		const { matchesScreenMd, matchesScreenXs } = this.props;
		const { expandedMessages } = this.state;
		return messages.map(
			message =>
				hasFlag(message, 'draft') && !isAutoSendDraftMessage(message) ? (
					<Draft
						autofocus={!message.id /* focus draft if it's client side */}
						messageDraft={message}
						onDelete={this.handleDeleteDraft}
						onSend={this.handleSendDraft}
						inline
					/>
				) : includes(expandedMessages, message.id) ? (
					<Viewer
						{...this.props}
						message={message}
						messageFull={message}
						onHeaderClick={this.handleExpandedMessageHeaderClick}
						onReply={this.handleReply}
						onReplyAll={this.handleReplyAll}
						onForward={this.handleForward}
						inline
						focus
						isConversation
					/>
				) : (
					<CondensedMessage
						message={message}
						onClick={this.handleCondensedMessageClick}
						matchesScreenMd={matchesScreenMd}
						matchesScreenXs={matchesScreenXs}
					/>
				)
		);
	}

	renderTruncatedMessageList(messages) {
		const { matchesScreenMd, matchesScreenXs } = this.props;
		const { expandedMessages } = this.state;
		const condensedMessages = takeWhile(
			messages,
			(message) => !includes(expandedMessages, message.id)
		);
		const messageList = [
			// render the initial condensed message
			condensedMessages.length && (
				<CondensedMessage
					message={condensedMessages[0]}
					onClick={this.handleCondensedMessageClick}
					matchesScreenMd={matchesScreenMd}
					matchesScreenXs={matchesScreenXs}
				/>
			),
			// render overflow count, button
			condensedMessages.length > 2 && (
				<CondensedMessageOverflowIndicator
					count={condensedMessages.slice(1).length}
					onClick={this.handleCondensedConversationClick}
				/>
			),
			// render the rest of the conversation normally
			...this.renderMessageList(messages.slice(condensedMessages.length))
		];
		return messageList.filter(Boolean);
	}

	render({ conversation, matchesScreenMd, matchesScreenSm }, { expandedConversations }) {
		return (
			<section class={cx(style.section, style.awide ? style.wide : style.narrow)}>
				<ViewerTitle
					subject={conversation.subject}
					count={conversation.numMessages}
					isFlagged={this.isFlagged()}
					isUnread={this.isUnread()}
					onStar={this.handleStarClick}
					onMarkRead={this.handleReadStatusClicked}
					matchesScreenMd={matchesScreenMd}
					matchesScreenSm={matchesScreenSm}
				/>
				{includes(expandedConversations, conversation.id)
					? this.renderMessageList(this.sortedMessagesAndDrafts())
					: this.renderTruncatedMessageList(this.sortedMessagesAndDrafts())}
			</section>
		);
	}
}
