import cloneDeep from 'lodash/cloneDeep';
import { FORWARD, REPLY, REPLY_ALL } from '../constants/mail';
import array from '@zimbra/util/src/array';
import { getEmailBody, htmlToText } from '../lib/html-email';
import incomingMessage from '../components/composer/vhtml-templates/incoming-message';
import newMessageDraft from './new-message-draft';

export default function draftForMessage(type, message) {
	const subjectPrefix = type === FORWARD ? 'Fwd' : 'Re';
	const subject = `${subjectPrefix}: ${(message.subject || '').replace(
		/^((fwd|re):\s*)*/gi,
		''
	)}`;

	const bodyWithReply = incomingMessage({
		date: new Date(message.date).toLocaleString(),
		from: message.from && message.from[0],
		body: getEmailBody(cloneDeep(message), { allowImages: true })
	});

	const baseResponseMessage = {
		...newMessageDraft(),
		attachments: array(message.attachments),
		conversationId: message.conversationId,
		html: bodyWithReply,
		inReplyTo: message.messageId,
		origId: message.id.toString(),
		subject,
		text: htmlToText(bodyWithReply)
	};

	switch (type) {
		case REPLY:
			return {
				...baseResponseMessage,
				rt: 'r',
				to: array(message.from)
			};
		case REPLY_ALL:
			return {
				...baseResponseMessage,
				cc: array(message.cc),
				rt: 'r',
				//TODO filter sender's email address
				to: array(message.from).concat(array(message.to))
			};
		case FORWARD:
			return {
				...baseResponseMessage,
				rt: 'w'
			};
		default:
			throw new Error(`Unsupported response type '${type}'`);
	}
}
