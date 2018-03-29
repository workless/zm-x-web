/* eslint-disable brace-style */
import { h, Component } from 'preact';
import { route } from 'preact-router';
import { connect } from 'preact-redux';
import { configure } from '../../config';
import { defaultProps } from 'recompose';
import wire from 'wiretie';
import debounce from 'lodash-es/debounce';
import omit from 'lodash-es/omit';
import cx from 'classnames';

import Composer from '../composer';

import * as mailActions from '../../store/mail/actions';
import { openModalCompose } from '../../store/email/actions';
import withMediaQuery from '../../enhancers/with-media-query';
import { minWidth, screenXsMax } from '../../constants/breakpoints';
import accountInfo from '../../graphql-decorators/account-info/normalized-identities';

import { notify } from '../../store/notifications/actions';
import { getMailboxMetadata } from '../../store/email/selectors';
import s from './style.less';

const draftSaveDebounceSeconds = 2;

@accountInfo({ fetchPolicy: 'cache-first' })
@configure({ urlSlug: 'routes.slugs.email' })
@defaultProps({ folderName: 'Drafts' })
@wire('zimbra', null, zimbra => ({
	sendMessage: zimbra.messages.send
}))
@withMediaQuery(minWidth(screenXsMax))
@connect(state => ({
	undoSendEnabled: getMailboxMetadata(state, 'zimbraPrefUndoSendEnabled')
}), dispatch => ({
	createReplyDraft: updatedMessage =>
		dispatch(mailActions.createReplyDraft({ messageDraft: updatedMessage })),
	sendMessageWithUndo: ({ messageDraft, onUndoSend }) =>
		dispatch(mailActions.sendMessageWithUndo({ messageDraft, onUndoSend })),
	updateDraft: updatedMessage =>
		dispatch(mailActions.updateDraft({ messageDraft: updatedMessage })),
	deleteDraft: messageDraftId =>
		dispatch(mailActions.deleteDraft({ messageDraftId })),
	openModalCompose: props => dispatch(openModalCompose(props)),
	notify: options => dispatch(notify(options))
}))
export default class Draft extends Component {
	state = {
		draftSaved: {},
		isSaving: false
	};

	urlForMessage = (id) =>
		`/${this.props.urlSlug}/${encodeURIComponent(
			this.props.folderName
		)}/conversation/${encodeURIComponent(id)}`;

	handleChange = newMessageDraft => {
		this.debouncedSaveOrUpdateDraft(newMessageDraft);
	};

	saveOrUpdateDraft = newMessageDraft => {

		if (this.isUnmounted) {
			return;
		}

		if (this.state.isSaving) {
			this.nextNewMessageDraftToSave = newMessageDraft;
			return;
		}

		const messageDraft = this.getMessageDraft();

		const createOrUpdateSuccess = draftSaved => {
			if (this.isUnmounted) {
				return;
			}
			// TODO normalize this using a unified normalizer.
			this.setState(
				{
					draftSaved: {
						...draftSaved,
						draftId: draftSaved.id
					},
					isSaving: false
				},
				() => {
					if (this.nextNewMessageDraftToSave) {
						const { nextNewMessageDraftToSave } = this;
						this.nextNewMessageDraftToSave = null;
						return this.saveOrUpdateDraft(nextNewMessageDraftToSave);
					}
				}
			);
		};

		const createOrUpdateError = error => {
			this.setState({ isSaving: false });
			console.error(error);
		};

		if (messageDraft.id) {
			this.setState({ isSaving: true });
			return this.props
				.updateDraft({
					...messageDraft,
					...newMessageDraft
				})
				.then(createOrUpdateSuccess)
				.catch(createOrUpdateError);
		}

		this.setState({ isSaving: true });
		return this.props
			.createReplyDraft(newMessageDraft)
			.then(createOrUpdateSuccess)
			.catch(createOrUpdateError);
	};

	debouncedSaveOrUpdateDraft = debounce(this.saveOrUpdateDraft, 1000 * draftSaveDebounceSeconds);

	handleDelete = () => {
		const messageDraft = this.getMessageDraft();
		if (messageDraft.id) {
			this.props.deleteDraft(messageDraft.id).then(() => {
				this.props.onDelete(messageDraft);
			});
		} else {
			this.props.onDelete(messageDraft);
		}
	};

	handleSend = (message) => {
		const messageDraft = {
			...this.getMessageDraft(),
			...message
		};

		this.debouncedSaveOrUpdateDraft.cancel();

		if (this.props.undoSendEnabled) {
			const onUndoSend = (savedDraft) =>
				route(this.urlForMessage(savedDraft.conversationId), true);
			return this.props.sendMessageWithUndo({ messageDraft, onUndoSend })
				.then((draftSaved) => {
					this.props.onSend(draftSaved);
					this.props.onCancel && this.props.onCancel();
				});
		}

		return this.props.sendMessage(message).then(() => {
			this.props.notify({
				message: 'Message sent.'
			});
			this.props.onSend(messageDraft);
		});
	};

	getMessageDraft = () => ({
		...omit(this.props.messageDraft, ['autoSendTime']),
		...this.state.draftSaved,
		draftId: this.props.messageDraft.id || this.state.draftSaved.id
	});

	handleMobileOverlayClicked = () => {
		this.props.openModalCompose({
			mode: 'mailTo',
			message: this.getMessageDraft()
		});
	};

	componentWillReceiveProps(nextProps) {
		if (this.props.messageDraft.id !== nextProps.messageDraft.id) {
			this.setState({ draftSaved: {}, isSaving: false });
		}
	}

	componentWillUnmount() {
		this.isUnmounted = true;
	}

	render({ accounts, autofocus, onCancel, inline, matchesMediaQuery, class: cls }) {
		return (
			<div className={cx(s.wrapper, cls, inline && s.inlineWrapper)}>
				<Composer
					accounts={accounts}
					autofocus={autofocus}
					inline={inline}
					message={this.getMessageDraft()}
					onChange={this.handleChange}
					onCancel={onCancel}
					onDelete={this.handleDelete}
					onSend={this.handleSend}
				/>
				{!matchesMediaQuery &&
					inline && (
					<div
						class={s.mobileOverlay}
						onClick={this.handleMobileOverlayClicked}
					/>
				)}
			</div>
		);
	}
}
