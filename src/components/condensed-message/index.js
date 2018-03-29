import { h, Component } from 'preact';
import { connect } from 'preact-redux';
import find from 'lodash/find';
import { Icon } from '@zimbra/blocks';
import EmailTime from '../email-time';
import StarIcon from '../star-icon';
import UnreadControl from '../unread-control';
import cx from 'classnames';
import wire from 'wiretie';
import { message as messageType } from '../../constants/types';
import { flagMailItem, readMailItem } from '../../store/mail/actions';
import { getId, pluck, hasFlag } from '../../lib/util';
import { configure } from '../../config';
import style from './style';

function getFrom(message) {
	const from = find(message.emailAddresses, ['type', 'f']);
	return from && (from.name || from.address);
}

function isSelected(message, selectedMessage) {
	return (
		selectedMessage &&
		(getId(selectedMessage) === getId(message) ||
			(message.messages && !!pluck(message.messages, 'id', selectedMessage.id)))
	);
}

@configure('inboxInlineConversations')
@wire('zimbra', ({ inboxInlineConversations, message, selectedMessage }) => {
	let map = {
		conversationFull: null
	};
	if (
		inboxInlineConversations !== false &&
		selectedMessage &&
		message &&
		isSelected(message, selectedMessage) &&
		message.messages &&
		message.messages.length > 1
	) {
		if (!message.messages[0].excerpt && !message.messages[0].subject) {
			map.conversationFull = ['conversations.read', message.id];
		}
	}
	return map;
})
@connect(null, { flagMailItem, readMailItem })
export default class CondensedMessage extends Component {
	handleClick = () => {
		let { onClick, message } = this.props;
		onClick({ message });
	};

	messagesRef = c => {
		this.messages = c;
	};

	handleStarClick = e => {
		e.stopPropagation();
		this.props.flagMailItem({
			id: this.props.message.id,
			value: !this.isFlagged(),
			type: messageType
		});
	};

	handleReadStatusClicked = (e, unread) => {
		e.stopPropagation();
		this.props.readMailItem({
			value: !unread,
			id: this.props.message.id,
			type: messageType
		});
	};

	isFlagged = () => hasFlag(this.props.message, 'flagged');

	isUnread = () => hasFlag(this.props.message, 'unread');

	// unselected -> selected triggers open animation
	componentDidUpdate(prevProps) {
		let m = this.props.message;
		if (m && m.messages && m.messages.length > 1) {
			let selected = isSelected(m, this.props.selectedMessage),
				prev = isSelected(prevProps.message, prevProps.selectedMessage);
			if (selected !== prev) {
				this.base.style.height =
					selected && this.messages
						? this.messages.offsetTop + this.messages.offsetHeight + 'px'
						: '';
			}
		}
	}

	componentWillUnmount() {
		this.base.style.height = '';
	}

	render({
		message,
		inboxInlineConversations,
		onClick,
		conversation,
		conversationFull,
		selectedMessage,
		showExcerpt,
		matchesScreenMd,
		matchesScreenXs
	}) {
		let messages =
				(conversationFull && conversationFull.messages) || message.messages,
			count = messages ? messages.length : 0,
			isConversation = count > 1,
			selected = isSelected(message, selectedMessage),
			from = getFrom(message) || ' ';

		const isUnread = hasFlag(message, 'unread');

		return (
			<div
				class={cx(
					style.message,
					conversation && style.conversationMessage,
					isConversation && style.conversation,
					isUnread && style.unread,
					isConversation && !messages && style.loading,
					selected &&
						getId(message) !== getId(selectedMessage) &&
						style.conversationSelected,
					getId(message) === getId(selectedMessage) && style.selected,
					hasFlag(message, 'urgent') && style.urgent,
					hasFlag(message, 'sentByMe') && style.sentByMe
				)}
				onClick={this.handleClick}
			>
				<StarIcon
					class={style.star}
					onClick={this.handleStarClick}
					starred={this.isFlagged()}
					size={matchesScreenMd ? 'sm' : 'md'}
				/>
				<UnreadControl
					class={cx(style.readStatus, style.hideXsDown)}
					onChange={this.handleReadStatusClicked}
					value={isUnread}
					visible
				/>
				<div class={style.info}>
					<div class={style.sender}>{from}</div>
					<div class={style.excerpt}>
						{(showExcerpt !== false && message.excerpt) || ' '}
					</div>
				</div>
				{isConversation &&
					selected &&
					inboxInlineConversations && (
					<div class={style.messages} ref={this.messagesRef}>
						{messages.map(child => (
							<CondensedMessage
								onClick={onClick}
								message={child}
								conversation={message}
								selectedMessage={selectedMessage}
								matchesScreenMd={matchesScreenMd}
							/>
						))}
					</div>
				)}
				<div class={style.indicators}>
					{hasFlag(message, 'attachment') && (
						<Icon
							name="paperclip"
							class={style.indicator}
							size={matchesScreenXs ? 'md' : 'sm'}
						/>
					)}
				</div>
				<EmailTime time={message.date} class={style.time} />
			</div>
		);
	}
}
