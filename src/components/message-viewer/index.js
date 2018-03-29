import { h, Component } from 'preact';
import { connect } from 'preact-redux';
import { route } from 'preact-router';
import cx from 'classnames';

import { FORWARD, REPLY, REPLY_ALL } from '../../constants/mail';
import { message as messageType } from '../../constants/types';

import {
	isFlagged as isFlaggedUtil,
	isUnread as isUnreadUtil,
	isDraft as isDraftUtil
} from '../../utils/mail-item';
import draftForMessage from '../../utils/draft-for-message';
import registerTab from '../../enhancers/register-tab';

import { createReplyDraft } from '../../store/mail/actions';

import Draft from '../draft';
import Viewer from '../viewer';
import ViewerTitle from '../viewer-title';

import s from './style.less';

@registerTab(props => props.wide && ({
	type: 'message',
	id: props.message.id,
	title: props.message.subject
}))
@connect(null, {
	createReplyDraft
})
export default class MessageViewer extends Component {
	createDraft = type => {
		const draft = draftForMessage(type, this.props.message);
		this.props
			.createReplyDraft({ messageDraft: draft })
			.then(res => {
				route(`/message/${res.id}`);
			})
			.catch(e => {
				throw e;
			});
	};

	handleReply = () => this.createDraft(REPLY);
	handleReplyAll = () => this.createDraft(REPLY_ALL);
	handleForward = () => this.createDraft(FORWARD);

	handleEventBindings(fn) {
		fn(REPLY, this.handleReply);
		fn(REPLY_ALL, this.handleReplyAll);
		fn(FORWARD, this.handleForward);
	}

	handleRead = (e, unread) => {
		e.stopPropagation();
		this.props.onMarkRead && this.props.onMarkRead(!unread, this.props.message.id);
	};

	handleFlag = e => {
		e.stopPropagation();
		this.props.onFlag && this.props.onFlag(!this.isFlagged, this.props.message.id);
	};

	componentDidMount() {
		this.handleEventBindings(this.props.events.on);
	}

	componentWillUnmount() {
		this.handleEventBindings(this.props.events.off);
	}

	render(props) {
		const { message } = props;
		this.isFlagged = isFlaggedUtil(message);
		const isUnread = isUnreadUtil(message);
		const isDraft = isDraftUtil(message, messageType);


		return (
			<div class={cx(s.container, props.wide ? s.wide : s.narrow)}>
				<ViewerTitle
					subject={message.subject}
					isFlagged={this.isFlagged}
					isUnread={isUnread}
					onStar={this.handleFlag}
					onMarkRead={this.handleRead}
				/>
				{isDraft ? (
					<Draft
						messageDraft={message}
						onDelete={props.onDeleteDraft}
						onSend={props.onSend}
						autofocus
					/>
				) : (
					<Viewer
						{...props}
						onReply={this.handleReply}
						onReplyAll={this.handleReplyAll}
						onForward={this.handleForward}
						disableReadIcon
						disableStarIcon
					/>
				)}
			</div>
		);
	}
}
