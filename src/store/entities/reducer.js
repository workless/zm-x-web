import { handleActions } from 'redux-actions';
import { normalize } from 'normalizr';
import castArray from 'lodash-es/castArray';
import every from 'lodash-es/every';
import get from 'lodash-es/get';
import reduceReducers from 'reduce-reducers';
import some from 'lodash-es/some';

import {
	conversation as conversationType,
	message as messageType
} from '../../constants/types';

import { getItem } from './selectors';
import { hasFlag } from '../../lib/util';
import { isUnread } from '../../utils/mail-item';
import { pendingAction } from '@zimbra/util/src/redux/async-action';
import * as Schema from '../schema';
import entitiesMerge from './entities-merge';
import * as mailActionCreators from '../mail/actions';
import * as folderActionCreators from '../folders/actions';
import * as entityActionCreators from './actions';

const initialState = {
	folders: {},
	conversations: {},
	messages: {},
	contacts: {},
	appointments: {},
	senders: {},
	note: {}
};

function setFlag(message, key, val) {
	const re = new RegExp(key, 'g');
	const flag = `${(message.flag || '').replace(re, '')}${val ? key : ''}`;

	return {
		...message,
		flag
	};
}

function setFlagForMessageIds({ ids: idOrIds, flag, value, state }) {
	const ids = castArray(idOrIds);
	const messages = ids.map(id => getItem({ entities: state }, messageType, id));

	const folderUnreadAdjustments = {};
	const newMessages = messages.map(m => {
		flag === 'u' && updateFolderUnreadAdjustments(folderUnreadAdjustments, m, value, state);
		return setFlag(m, flag, value);
	});

	const newConversations = messages
		.map(message => {
			const conversation = getItem(
				{ entities: state },
				conversationType,
				message.conversationId
			);
			if (!conversation) {
				return null;
			}
			if (conversation.messages) {
				conversation.messages = conversation.messages
					.map(conversationMessage => {
						if (!conversationMessage) {
							return null;
						}
						if (conversationMessage.id === message.id) {
							return setFlag(conversationMessage, flag, value);
						}
						return conversationMessage;
					})
					.filter(Boolean);
			}
			if (
				some(conversation.messages, m => hasFlag(m, flag)) &&
					!hasFlag(conversation, flag)
			) {
				return setFlag(conversation, flag, true);
			}
			else if (
				every(conversation.messages, m => !hasFlag(m, flag)) &&
				hasFlag(conversation, flag)
			) {
				return setFlag(conversation, flag, false);
			}
			return conversation;
		})
		.filter(Boolean);

	const normalized = normalize(
		{
			messages: newMessages,
			conversations: newConversations,
			folders: folderUnreadAdjustments
		},
		{
			messages: [Schema.message],
			conversations: [Schema.conversation],
			folders: [Schema.folder]
		}
	);
	return entitiesMerge(state, normalized.entities);
}

function setFlagForConversationIds({ ids: idOrIds, flag, value, state }) {
	const ids = castArray(idOrIds);
	const folderUnreadAdjustments = {};
	const newConversations = ids
		.map(cId => {
			const conversation = getItem({ entities: state }, 'conversation', cId);
			if (!conversation) {
				return null;
			}
			conversation.messages = conversation.messages.map(mId => {
				const message = getItem({ entities: state }, messageType, mId);
				if (!message) {
					return null;
				}
				flag === 'u' && updateFolderUnreadAdjustments(folderUnreadAdjustments, message, value, state);
				return setFlag(message, flag, value);
			});
			return setFlag(conversation, flag, value);
		})
		.filter(Boolean);

	const normalized = normalize({
		conversations: newConversations,
		folders: folderUnreadAdjustments
	},
	{
		conversations: [Schema.conversation],
		folders: [Schema.folder]
	});

	state = entitiesMerge(state, normalized.entities);
	// START DEBUG CODE remove this debugging code if you still see if ater February 1, 2018
	/* eslint-disable no-console */
	let inboxUnread = +get(state, 'folders.2.unread', 0);
	if (inboxUnread < 0) {
		console.log('Found an unread count less than 0: ', inboxUnread);
		console.log('normalized.entities.folders', JSON.stringify(normalized.entities.folders, null, '\t'));
		console.log('state.folders', JSON.stringify(state.folders, null, '\t'));
	}
	/* eslint-enable no-console */
	// END DEBUG CODE
	return state;
}

function toggleFlagAction(flag, invert = false) {
	return (state, action) => {
		const { id, type, value: val } = action.payload.options;
		const value = invert ? !val : val;

		switch (type) {
			case conversationType:
				return setFlagForConversationIds({
					flag,
					value,
					ids: id,
					state
				});
			case messageType:
				return setFlagForMessageIds({
					flag,
					value,
					ids: id,
					state
				});
			default:
				return state;
		}
	};
}

/**
* Calculate how the new unread state for a given message impacts the unread
* count of the folder that message is in.  If there is a change, calculate what the
* new value of the unread count for the folder should be and update the folderAdjustments
* object appropriately
*
* @param {Object} folderAdjustments in/out - keys are folder IDs and values are their corresponding calculated unread counts.  mutated by this function
* @param {Object} message message Object, used to determine its current unread status and its folder location
* @param {Boolean} markUnread true if message will be marked unread, false if it will be marked as read
* @param {Object} state
* @param {Object} state.folders The redux status for the folder entities
*/
function updateFolderUnreadAdjustments(folderAdjustments, message, markUnread, { folders }) {
	if (isUnread(message) !== Boolean(markUnread)) {
		const folderId = message.folderId;
		//Get the currently calculated unread count of the folder.  Initialize to the value
		//from state if no adjustments made yet
		let folder = folderAdjustments[folderId] ||
			(folderAdjustments[folderId] = { id: folderId, unread: folders[folderId].unread });
		folder.unread += markUnread ? 1 : -1;
	}
}

/**
 * Apply changes received from session response to update things like folder unread count
 */
function mergeChangesReducer(state = initialState, action) {
	const changes = action.payload;
	if (!changes) return state;
	changes.forEach(c => {
		const normalized = normalize({
			conversations: get(c, 'modified.conversations'),
			messages: get(c, 'modified.messages'),
			folders: get(c, 'modified.folder')
		},
		{
			conversations: [Schema.conversation],
			messages: [Schema.message],
			folders: [Schema.folder]
		});
		state = entitiesMerge(state, normalized.entities);
	});
	// START DEBUG CODE remove this debugging code if you still see if ater February 1, 2018
	/* eslint-disable no-console */
	let inboxUnread = +get(state, 'folders.2.unread', 0);
	if (inboxUnread < 0) {
		console.log('Found an unread count less than 0: ', inboxUnread);
		console.log('changes', JSON.stringify(changes, null, '\t'));
		console.log('state.folders', JSON.stringify(state.folders, null, '\t'));
	}
	/* eslint-enable no-console */
	// END DEBUG CODE
	return state;
}

/**
 * If the action payload contains normalized entities, merge it into
 * the store.
 */
function mergeEntitiesReducer(state = initialState, action) {
	const entities =
		get(action, 'payload.entities') ||
		get(action, 'payload.data.entities') ||
		get(action, 'payload.data.data.entities');

	if (entities) {
		let newState = entitiesMerge(state, entities);
		// START DEBUG CODE remove this debugging code if you still see if ater February 1, 2018
		/* eslint-disable no-console */
		let inboxUnread = +get(newState, 'folders.2.unread', 0);
		if (inboxUnread < 0) {
			console.log('Found an unread count less than 0: ', inboxUnread);
			console.log('entities.folders', JSON.stringify(entities.folders, null, '\t'));
			console.log('state.folders', JSON.stringify(state.folders, null, '\t'));
		}
		/* eslint-enable no-console */
		// END DEBUG CODE
		return newState;
	}

	return state;
}

const updateEntitiesReducer = handleActions(
	{
		[entityActionCreators.applyServerChanges]: mergeChangesReducer,
		[pendingAction(mailActionCreators.readMailItem)]: toggleFlagAction(
			'u',
			true
		),
		[pendingAction(mailActionCreators.flagMailItem)]: toggleFlagAction('f'),
		[pendingAction(folderActionCreators.renameFolder)]: (state, action) => {
			const { folder, name } = action.payload.options;
			return {
				...state,
				folders: {
					...state.folders,
					[folder.id]: {
						...state.folders[folder.id],
						name
					}
				}
			};
		}
	},
	initialState
);

export default reduceReducers(updateEntitiesReducer, mergeEntitiesReducer);
