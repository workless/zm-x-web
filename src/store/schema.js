import { schema } from 'normalizr';

export const sender = new schema.Entity(
	'senders',
	{},
	{
		idAttribute: v => `${v.address}-${v.type}`
	}
);
export const message = new schema.Entity('messages');
export const messageList = new schema.Array(message);
export const conversation = new schema.Entity('conversations', {
	messages: [message],
	senders: [sender]
});
export const conversationList = new schema.Array(conversation);
export const folder = new schema.Entity('folders');
export const folderList = new schema.Array(folder);
folder.define({ folder: folderList });

export const contact = new schema.Entity('contacts');
export const contactList = new schema.Array(contact);
export const appointment = new schema.Entity('appointment');
export const appointmentList = new schema.Array(appointment);

export const searchResults = new schema.Object({
	conversations: [conversation],
	messages: [message],
	contacts: [contact],
	appointments: [appointment]
});
