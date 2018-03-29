import first from 'lodash-es/first';
import { denormalize } from 'normalizr';
import * as Schema from '../schema';
import values from 'lodash-es/values';
import { hasFlag } from '../../lib/util';
import {
	message as messageType
} from '../../constants/types';

export function getItem(state, type, id, options = { full: false }) {
	const resource = denormalize(id, Schema[type], state.entities);

	if (resource) {
		return options.full && !resource.full ? null : resource;
	}
}

export function getAttachments(state, type, ids) {
	return denormalize(ids, [Schema[type]], state.entities);
}

/**
 * Senders are keyed by address and type. This returns the first matching
 * sender.
 */
export function getSender(state, address) {
	return first(
		denormalize(
			[`${address}-f`, `${address}-t`],
			[Schema.sender],
			state.entities
		)
	);
}

export function getItems(state, type, ids) {
	return denormalize(ids, [Schema[type]], state.entities);
}

export function getAutoSendDraftItems(state, type) {
	const autoSendDraftIds = values(state.entities.messages)
		.reduce((memo, msg) => {
			if (msg.autoSendTime) {
				memo.push(msg.id);
			}
			return memo;
		}, []);

	if (type === messageType) {
		return denormalize(
			autoSendDraftIds,
			[Schema.message],
			state.entities
		);
	}
	const autoSendConversationIds = values(state.entities.conversations)
		.reduce((memo, conversation) => {
			if (hasFlag(conversation, 'draft') &&
					conversation.messages &&
					conversation.messages.some(messageId => autoSendDraftIds.includes(messageId))) {
				memo.push(conversation.id);
			}
			return memo;
		}, []);
	return denormalize(
		autoSendConversationIds,
		[Schema.conversation],
		state.entities
	);
}
