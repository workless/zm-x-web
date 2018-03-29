import { h, Component } from 'preact';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { setDataTransferJSON } from '@zimbra/util/src/data-transfer-manager';
import * as mailItemUtils from '../../utils/mail-item';
import get from 'lodash-es/get';

import NarrowListItem from './narrow';
import WideListItem from './wide';
import ContextMenu from '../context-menu';
import { mailContextMenu } from '../context-menus';

import style from './style';

export default class MailListItem extends Component {
	static propTypes = {
		onMarkRead: PropTypes.func.isRequired,
		onFlag: PropTypes.func.isRequired,
		onDelete: PropTypes.func.isRequired,
		selectedIds: PropTypes.set
	};

	handleClick = () => {
		const { onClick, item, type } = this.props;
		onClick({ item, type });
	};

	handleDblClick = () => {
		const { onDblClick, item, type } = this.props;
		if (onDblClick) {
			onDblClick({ item, type });
		}
	};

	handleDragStart = e => {
		const { item, selectedIds, type } = this.props;

		setDataTransferJSON(e, {
			data: {
				type,
				ids: selectedIds.size > 0 ? Array.from(selectedIds) : item.id
			},
			itemCount: selectedIds.size > 0 ? selectedIds.size : 1
		});
	};

	messagesRef = c => {
		this.messages = c;
	};

	handleToggleUnread = (e, unread) => {
		e.stopPropagation();
		e.preventDefault();
		this.props.onMarkRead(!unread, this.props.item.id);
	};

	handleToggleFlagged = (e, value) => {
		e.stopPropagation();
		e.preventDefault();
		this.props.onFlag(value, this.props.item.id);
	};

	handleCheckbox = e => {
		e.stopPropagation();
		this.props.onCheckboxSelect(this.props.item.id, e);
	};

	handleClickDelete = e => {
		e.stopPropagation();
		this.props.onDelete(this.props.item.id);
	};

	handleClickSearch = e => {
		e.stopPropagation();
		this.props.onSearch(this.props.item);
	};

	handleMarkUnread = (e, unread) => {
		e.stopPropagation();
		e.preventDefault();
		this.props.onMarkRead(unread, this.props.item.id);
	};

	handleStar = e => {
		e.stopPropagation();
		e.preventDefault();
		this.props.onFlag('flag', this.props.item.id);
	};

	handleBlock = () => {
		this.props.onBlock(this.props.item);
	};

	handleSpam = e => {
		e.stopPropagation();
		this.props.onMarkSpam(this.props.item, this.props.item.id);
	};

	handleArchive = e => {
		e.stopPropagation();
		this.props.onArchive(true, this.props.item.id);
	};

	handleAddSenderToContacts = () => {
		const { item, account } = this.props;
		mailItemUtils.fromSenders(item, account).map(s => {
			const lastName = get(s, 'name', ' ').split(' ')[1];

			return this.props.onAddToContacts({
				lastName,
				firstName: s.shortName,
				email: s.address
			});
		});
	};

	handleMailListItems = () => {
		const {
			type,
			onClick,
			item,
			parentConversation,
			selectedMessage,
			showSnippet,
			isViewing,
			isSelected,
			wide,
			account,
			density,
			...rest
		} = this.props;

		const count = item.numMessages;
		const isUnread = mailItemUtils.isUnread(item);
		const isFlagged = mailItemUtils.isFlagged(item);
		const isUrgent = mailItemUtils.isUrgent(item);
		const isSentByMe = mailItemUtils.isSentByMe(item);
		const isDraft = mailItemUtils.isDraft(item, type);
		const isAttachment = mailItemUtils.isAttachment(item);
		const displayAddresses = mailItemUtils.displaySenders(item, account);
		const fromSenders = mailItemUtils.fromSenders(item, account);

		const ListItem = wide ? WideListItem : NarrowListItem;

		return (
			<div
				{...rest}
				class={cx(
					style[density],
					style.message,
					style.conversation,
					wide ? style.wide : style.narrow,
					parentConversation && style.conversationMessage,
					isUnread && style.unread,
					(isViewing || isSelected) && style.conversationSelected,
					(isViewing || isSelected) && style.selected,
					isUrgent && style.urgent,
					isSentByMe && style.sentByMe,
					!showSnippet && style.noSnippet
				)}
				onClick={this.handleClick}
				onDblClick={this.handleDblClick}
				onDragStart={this.handleDragStart}
				draggable
			>
				<ListItem
					{...this.props}
					count={count}
					emailAddresses={displayAddresses}
					isUnread={isUnread}
					isFlagged={isFlagged}
					isUrgent={isUrgent}
					isSentByMe={isSentByMe}
					isDraft={isDraft}
					isAttachment={isAttachment}
					onCheckbox={this.handleCheckbox}
					onToggleUnread={this.handleToggleUnread}
					onInlineDelete={this.handleClickDelete}
					onInlineSearch={this.handleClickSearch}
					onToggleFlagged={this.handleToggleFlagged}
					disableInlineSearch={fromSenders && fromSenders.length !== 1}
					showSnippet={showSnippet}
				/>
			</div>
		);
	};

	render() {
		const menu = mailContextMenu(
			this.handleToggleUnread,
			this.handleMarkUnread,
			this.handleStar,
			this.handleToggleFlagged,
			this.handleBlock,
			this.handleSpam,
			this.handleArchive,
			this.handleClickDelete,
			this.handleAddSenderToContacts
		);
		return <ContextMenu menu={menu} render={this.handleMailListItems} />;
	}
}
