import h from 'vhtml';
import mapValues from 'lodash-es/mapValues';
import zimbraApiClient, { normalizeToZimbra } from './api-client';
import {
	USER_ROOT_FOLDER_ID,
	DEFAULT_MAILBOX_METADATA_SECTION
} from '../../constants';
import { partitionTagsAndFilename, getTagFromQuery } from '../query-builder';
import { hasCommonSubstr, isValidEmail, isSameOrigin } from '../util';
import array from '@zimbra/util/src/array';
import { isImage, isInline } from '../../utils/attachments';

import reject from 'lodash-es/reject';
import isEmpty from 'lodash-es/isEmpty';

const AuthRequest = 'AuthRequest',
	EndSessionRequest = 'EndSessionRequest';

// Ensure results listing is a real Array, and not an Object (commonly returned for empty result sets).
function ensureArray(data) {
	if (data && !Array.isArray(data)) {
		data = Object.assign([], data);
	}
	return data;
}

// Normalizes one or more IDs or objects with IDs into a CSV of IDs.
export function idField(id) {
	return Array.isArray(id)
		? id.map(idField).join(',')
		: String((id && id.id) || id || '');
}

function coerceBoolean(val) {
	if (val === true) {
		return 'TRUE';
	}
	if (val === false) {
		return 'FALSE';
	}
	return val;
}

export default function zimbraClient(config) {
	let api = zimbraApiClient(config);

	api.checkSession = () => api.noopRequest().then(Boolean, () => false);
	api.endSession = () => api.soapRequest(
		'EndSessionRequest',
		<EndSessionRequest xmlns="urn:zimbraAccount" />
	);

	api.login = ({ username, email, password }) =>
		api.request(`/?loginOp=relogin&username=${username || email}`).then(() =>
			api.soapRequest(
				'AuthRequest',
				<AuthRequest xmlns="urn:zimbraAccount">
					<account by="name">{username || email}</account>
					<password>{password}</password>
					<prefs />
					<attrs />
				</AuthRequest>
			)
		);

	api.logout = () => {
		// iFrame to the page that actually clears cookies.
		const iframe = document.createElement('iframe');
		iframe.setAttribute('style', 'display: none');
		iframe.src = api.resolve('/?loginOp=logout');
		iframe.onload = function() {
			// "?loginOp=logout" is purely aestetic.
			window.location = '/?loginOp=logout';
		};

		document.body.appendChild(iframe);
	};

	api.account = {
		info: options =>
			api.jsonRequest('account::GetInfoRequest', {
				sections: options && options.sections
			}),
		addExternal: ({ externalAccount: { accountType, ...rest } }) =>
			api
				.jsonRequest('CreateDataSourceRequest', {
					[accountType]: mapValues(rest, coerceBoolean)
				})
				.then(data => {
					if (data !== undefined) return data[0];
				}),

		modifyExternal: (id, type, attrs) =>
			api.jsonRequest('ModifyDataSourceRequest', {
				[type]: {
					id,
					...mapValues(attrs, coerceBoolean)
				}
			}),

		deleteExternal: ({ id }) =>
			api.jsonRequest('DeleteDataSourceRequest', {
				dsrc: {
					id
				}
			}),

		// https://github.com/Zimbra/zm-mailbox/blob/ae6fe18d2ef3af9cdbf086b1b2a521a2210e177b/store/docs/soap.txt#L999
		modifyPrefs: prefs =>
			api.jsonRequest('account::ModifyPrefsRequest', {
				_attrs: mapValues(prefs, coerceBoolean)
			}),

		modifyIdentity: (id, attrs) =>
			api.jsonRequest('account::ModifyIdentityRequest', {
				identity: {
					id,
					_attrs: mapValues(attrs, coerceBoolean)
				}
			})
	};

	api.mailbox = {
		importExternalAccountData: (accountType, id) =>
			api.jsonRequest('ImportDataRequest', {
				[accountType]: {
					id
				}
			}),
		testDataSource: options =>
			api.jsonRequest('TestDataSourceRequest', options),
		getMailboxMetadata: () =>
			api.jsonRequest('GetMailboxMetadataRequest', {
				meta: { section: DEFAULT_MAILBOX_METADATA_SECTION }
			}),
		setMailboxMetadata: prefs =>
			api.jsonRequest('SetMailboxMetadataRequest', {
				meta: {
					section: DEFAULT_MAILBOX_METADATA_SECTION,
					_attrs: mapValues(prefs, coerceBoolean)
				}
			})
	};

	api.autoComplete = ({ name }) =>
		api.jsonRequest('AutoCompleteRequest', { name }).then(ensureArray);

	api.search = function({
		headers,
		fetch = false,
		limit,
		types,
		full,
		...rest
	}) {
		return api.jsonRequest('SearchRequest', {
			header: headers && headers.map(n => ({ n })),
			fetch: fetch === true ? 'all' : fetch | 0,
			limit: limit || 10,
			types: String(types || 'message'),
			fullConversation: full === false ? 0 : 1,
			needExp: 1,
			...rest
		});
	};

	api.searchRequest = options => api.jsonRequest('SearchRequest', options);

	api.searchGal = ({ name, type = 'account', offset = 0, limit = 3 }) =>
		api
			.jsonRequest('account::SearchGalRequest', {
				name,
				type,
				offset,
				limit
			})
			.then(ensureArray);

	api.folders = {
		list(options = {}) {
			let folder,
				{ depth, view, baseFolderUUID, baseFolderId, path } = options;

			if (baseFolderUUID || baseFolderId || path) {
				folder = { uuid: baseFolderUUID, l: baseFolderId, path, view, depth };
			}

			return api
				.jsonRequest('GetFolderRequest', { folder, view, depth })
				.then(data => {
					if (options.root === false) return data.folder;
					return ensureArray(data);
				});
		},

		listSmart() {
			return api
				.jsonRequest('GetSearchFolderRequest')
				.then((data = []) => ensureArray(data));
		},

		read({ folder = 'Inbox', query, types, ...options } = {}) {
			let before = Promise.resolve();
			if (!types) {
				before = api.folders.list({ path: folder }).then(([folderInfo]) => {
					types = folderInfo.view;
				});
			}

			//do some faking to make sort by unread work until the backend supports it
			let isSortByUnread = options && options.sortBy === 'unread';
			if (isSortByUnread) {
				delete options.sortBy; //use default sort
				return before
					.then(() =>
						api.search({
							...options,
							query: query ? `${query} is:unread` : `in:"${folder}" is:unread`,
							types: types || 'conversation'
						})
					)
					.then(ensureArray)
					.then(res => {
						if (res && res.sortBy) {
							res.sortBy = 'unread';
						}
						return res;
					});
			}

			return before
				.then(() =>
					api.search({
						...options,
						query: query || `in:"${folder}"`,
						types: types || 'conversation'
					})
				)
				.then(ensureArray);
		},

		create({
			parentFolderId = 1,
			color,
			name,
			url,
			view,
			flags,
			fetchIfExists,
			sync = 1
		}) {
			api.folders.clearIdMapping();
			return api.jsonRequest('CreateFolderRequest', {
				folder: {
					l: parentFolderId,
					name,
					url,
					view,
					fie: fetchIfExists,
					color,
					f: flags,
					sync
				}
			});
		},

		createSmart({ parentFolderId = 1, view, name, query }) {
			return api.jsonRequest('CreateSearchFolderRequest', {
				search: {
					l: parentFolderId,
					types: view,
					name,
					query
				}
			});
		},

		// Move folder to trash folder
		trash(id) {
			api.folders.clearIdMapping();
			return api.jsonRequest('FolderActionRequest', {
				action: {
					op: 'trash',
					id: idField(id)
				}
			});
		},

		// Permanently delete folder from folder tree
		delete(id) {
			api.folders.clearIdMapping();
			return api.jsonRequest('FolderActionRequest', {
				action: {
					op: 'delete',
					id: idField(id)
				}
			});
		},

		markRead: id =>
			api.actionRequest('FolderActionRequest', {
				id: idField(id),
				op: 'read'
			}),

		changeColor: ({ id, color }) =>
			api.actionRequest('FolderActionRequest', {
				id: idField(id),
				op: 'color',
				color
			}),

		empty: (id, options = {}) =>
			api.actionRequest('FolderActionRequest', {
				recursive: true,
				op: 'empty',
				...options,
				id: idField(id)
			}),

		getIdMapping() {
			let self = api.folders.getIdMapping;
			return (
				self.cached ||
				(self.cached = api.folders.list().then(data => {
					function reduce(acc, folder) {
						acc[folder.id] = folder.absFolderPath.substring(1);
						if (folder.folder) folder.folder.reduce(reduce, acc);
						return acc;
					}
					return reduce({}, data);
				}))
			);
		},

		clearIdMapping() {
			api.folders.getIdMapping.cached = null;
		},

		rename: (id, name) =>
			api.actionRequest('FolderActionRequest', {
				id: idField(id),
				name,
				op: 'rename'
			}),

		/**
		 * Move a folder to another folder. If a destination folder is not
		 * provided, move to the root.
		 */
		move: ({ id, destFolderId }) =>
			api.actionRequest('FolderActionRequest', {
				id: idField(id),
				l: destFolderId || USER_ROOT_FOLDER_ID,
				op: 'move'
			})
	};

	api.tags = {
		list: () => api.jsonRequest('GetTagRequest').then(ensureArray),

		// tags.create({ name:'Foo', color:3 })
		create: tag => api.jsonRequest('CreateTagRequest', { tag }),

		// tags.delete(33401)
		delete: id =>
			api.jsonRequest('TagActionRequest', {
				action: {
					op: 'delete',
					id: idField(id)
				}
			})
	};

	api.notes = {
		list: ({ id, ...rest }) =>
			api.folders.read({
				limit: 500,
				...rest,
				query: `inid:${idField(id)}`,
				types: 'note'
			}),

		create({ parentFolderId, subject, body }) {
			return api.jsonRequest('CreateNoteRequest', {
				note: {
					l: idField(parentFolderId),
					content: JSON.stringify({
						subject,
						body
					})
				}
			});
		},

		read(id) {
			return typeof id !== undefined
				? api.jsonRequest('GetNoteRequest', {
					note: {
						id
					}
				})
				: Promise.resolve();
		},

		// @TODO should probably be `update(id, { subject, body })` to match other methods.
		update({ id, subject, body }) {
			return typeof id !== undefined
				? api.jsonRequest('NoteActionRequest', {
					action: {
						id: idField(id),
						op: 'edit',
						content: JSON.stringify({ subject, body })
					}
				})
				: Promise.reject('id is requried');
		},

		delete(id) {
			return api.jsonRequest('NoteActionRequest', {
				action: {
					id: idField(id),
					op: 'delete'
				}
			});
		},

		move(id, parentFolderId) {
			return api.jsonRequest('NoteActionRequest', {
				action: {
					id: idField(id),
					op: 'move',
					l: idField(parentFolderId)
				}
			});
		}
	};

	api.conversations = {
		list: (options = {}) =>
			api.folders
				.read({
					recip: 2,
					...options,
					types: 'conversation'
				})
				.then(ensureArray),

		/**
		 *	@example
		 *	read('-30716', {
		 *		headers: ['List-ID', 'X-Zimbra-DL', 'IN-REPLY-TO']
		 *		read: true	// mark any expanded as read
		 *	})
		 */
		read: (id, options = {}) =>
			api.jsonRequest('GetConvRequest', {
				c: {
					id: idField(id),
					fetch:
						options.fetch === false
							? 0
							: typeof options.fetch === 'number' ? options.fetch : 'all',
					html: options.html !== false && options.text !== true ? 1 : 0,
					header: options.headers && options.headers.map(n => ({ n })),
					needExp: 1,
					max: options.max || 250000
				}
			}),
		// read: (id, options={}) => api.jsonRequest('SearchConvRequest', {
		// 	cid: id,
		// 	fetch: options.fetch || 0,
		// 	html: options.html!==false && options.text!==true ? 1 : 0,
		// 	header: options.headers && options.headers.map( n => ({ n }) ),
		// 	// @TODO what are these?
		// 	needExp: 1,
		// 	max: options.max || 250000
		// })

		markRead: (id, value) =>
			api.actionRequest('ConvActionRequest', {
				id: idField(id),
				op: value ? 'read' : '!read'
			}),
		flag: (id, value) =>
			api.actionRequest('ConvActionRequest', {
				id: idField(id),
				op: value ? 'flag' : '!flag'
			}),
		trash: id =>
			api.actionRequest('ConvActionRequest', { id: idField(id), op: 'trash' }),
		spam: (id, value) =>
			api.actionRequest('ConvActionRequest', {
				id: idField(id),
				op: value ? 'spam' : '!spam'
			}),
		move: (id, destFolderId) =>
			api.actionRequest('ConvActionRequest', {
				id: idField(id),
				l: destFolderId,
				op: 'move',
				tcon: '-ds' // not in Drafts or Sent
			})
	};

	api.messages = {
		list: (options = {}) =>
			api.folders.read({ ...options, types: 'message' }).then(ensureArray),

		/**
		 *	@example
		 *	read('30627', {
		 *		headers: ['List-ID', 'X-Zimbra-DL', 'IN-REPLY-TO']
		 *	})
		 */
		read: (id, options = {}) =>
			api.jsonRequest('GetMsgRequest', {
				m: {
					id: idField(id),
					html:
						options.html !== false &&
						options.text !== true &&
						options.raw !== true
							? 1
							: 0,
					header: options.headers && options.headers.map(n => ({ n })),
					read: options.read === true ? 1 : undefined,
					// expand available expansions
					needExp: 1,
					neuter: 0,
					// max body length (look for mp.truncated=1)
					max: options.max || 250000,
					raw: options.raw ? 1 : 0
				}
			}),

		flag: (id, value) =>
			api.actionRequest('MsgActionRequest', {
				id: idField(id),
				op: value ? 'flag' : '!flag'
			}),

		markRead: (id, value) =>
			api.actionRequest('MsgActionRequest', {
				id: idField(id),
				op: value ? 'read' : '!read'
			}),

		trash: id =>
			api.actionRequest('MsgActionRequest', { id: idField(id), op: 'trash' }),

		spam: (id, value) =>
			api.actionRequest('MsgActionRequest', {
				id: idField(id),
				op: value ? 'spam' : '!spam'
			}),

		move: (id, destFolderId) =>
			api.actionRequest('MsgActionRequest', {
				id: idField(id),
				l: destFolderId,
				op: 'move',
				tcon: '-ds' // not in Drafts or Sent
			}),

		send(message) {
			const params = { m: convertMessageToZimbra(message) };
			return api.jsonRequest('SendMsgRequest', params);
		},

		attach(files, { ...message }) {
			return Promise.all(array(files).map((file) => {
				const contentDisposition = isInline(file) ? 'inline' : 'attachment';
				let before = Promise.resolve(file);

				if (file.messageId && file.part) {
					// short path: this file is an attachment from a different message, directly add it as an attachment.
					return Promise.resolve(file);
				}

				// If the file is not a real file, fetch it to convert it to a Blob.
				if ((!(file instanceof File) || !(file instanceof Blob)) && file.url) {
					before = fetch(file.url, isSameOrigin(file.url) ? { credentials: 'include' } : undefined)
						.then((r) => r.ok ? r.blob() : Promise.reject(r.status));
				}

				return before.then((data) => (
					api.request('/service/upload?fmt=extended,raw', data, {
						method: 'POST',
						headers: {
							'Content-Disposition': `${contentDisposition}; filename="${file.filename || file.name || data.filename || data.name}"`,
							'Content-Type': data.type || data.contentType || 'application/octet-stream'
						}
					})
						.then((result) => {
							if (!result) { return Promise.reject(Error('Empty result after uploading attachment')); }

							const [,status,err,json] = result.match(/^([^,]+),([^,]+),(.*)/) || [];

							if (err && err !== `'null'`) {
								return Promise.reject(err);
							}

							if (+status === 200) {
								return JSON.parse(json)[0];
							}

							return Promise.reject(Error('Bad Response Status: ' + status));
						})
						.catch((e) => {
							console.error('Upload ERR: Could not parse JSON', e);
							return Promise.reject(e);
						})
				));
			}))
				.then((attached) => {

					// After all uploads have completed, add attachments to the message and save it as a draft.
					attached.forEach((attachment, index) => {
						if (attachment) {
							const file = files[index];

							if (isInline(file)) {
								message.inlineAttachments = [
									...(message.inlineAttachments || []),
									{ ...file, attachmentId: attachment.aid }
								];
							}
							else if (!attachment.aid) {
								// Existing attachments have no attachmentId, just push it onto the message
								message.attachments = [
									...(message.attachments || []),
									attachment
								];
							}
							else {
								// New attachments have an attachmentId, pass them on as CSV
								message.attach = message.attach || {};
								message.attach.attachmentId = message.attach.attachmentId ? `${message.attach.attachmentId},${attachment.aid}` : attachment.aid;
							}
						}
					});

					return api.drafts[message.draftId ? 'update' : 'create'](message);
				});
		}
	};

	api.drafts = {
		create(message) {
			const params = { m: convertMessageToZimbra(message) };
			return api.jsonRequest('SaveDraftRequest', params);
		},
		update(message) {
			const params = {
				m: {
					...convertMessageToZimbra(message),
					id: idField(message.draftId)
				}
			};

			return api.jsonRequest('SaveDraftRequest', params);
		},
		delete(id) {
			return api.actionRequest('MsgActionRequest', {
				id: idField(id),
				op: 'delete'
			});
		}
	};

	api.appointments = {

		delete: ({ inviteId }) =>
			api.jsonRequest('CancelAppointmentRequest', {
				comp: '0', // TODO determine what this does and don't hard code it
				id: inviteId
			}),

		list(options = {}) {
			return api
				.jsonRequest('SearchRequest', {
					types: 'appointment',
					calExpandInstStart: options.start,
					calExpandInstEnd: options.end || options.start + 2678400000, // 31 days
					query: options.folderIds
						? {
							_content: options.folderIds
								.map(id => `inid:"${id}"`)
								.join(' OR ')
						}
						: undefined,
					offset: options.offset || 0,
					limit: options.limit || 50
				})
				.then(options.flatten ? flattenEvents : Object)
				.then(ensureArray);
		},

		attach(file, options = {}) {
			return api.request('/service/upload?fmt=extended,raw', file, {
				method: 'POST',
				headers: {
					'Content-Disposition': `${options.disposition ||
						'attachment'}; filename="${options.filename}"`,
					'Content-Type': options.contentType || 'application/octet-stream'
				}
			}).then(res => RegExp(/"aid":"([^"]*)"/).exec(res)[1]);
		}
	};

	api.calendars = {
		check: ({ calendarId, value }) =>
			api.jsonRequest('FolderActionRequest', {
				action: { op: value ? 'check' : '!check', id: calendarId }
			}),
		import: (fileData, calendarPathName, format, username) =>
			api.request(
				`/home/${username}/${calendarPathName}?fmt=${format}`,
				fileData,
				{ method: 'POST', 'content-type': 'text/calendar' }
			),
		export: (calendarName, username) =>
			api.request(`/home/${username}/${calendarName}?fmt=ics`)
	};

	api.meetings = {
		sendInviteReply: ({ ...message }, options = {}) => {
			if (options.updateOrganizer !== false) {
				// Swap the receiver with the organizer to notify the organizer.
				[ message.from, message.to ] = [ message.to, message.from ];

				// Change the message to reply mode.
				message.rt = 'r';
			}

			delete message.attachments;

			// Use one of these verbs: [ "ACCEPT", "DECLINE", "TENTATIVE" ] }
			return api.jsonRequest('SendInviteReplyRequest', {
				compNum: 0, // TODO: Support multi-component invites
				id: String(message.id),
				...options,
				updateOrganizer: options.updateOrganizer === false ? 'FALSE' : 'TRUE',
				m: convertMessageToZimbra(message)
			});
		},
		accept: (message, options = {}) => api.meetings.sendInviteReply(message, { ...options, verb: 'ACCEPT' }),
		decline: (message, options = {}) => api.meetings.sendInviteReply(message, { ...options, verb: 'DECLINE' }),
		tentative: (message, options = {}) => api.meetings.sendInviteReply(message, { ...options, verb: 'TENTATIVE' })
	};

	api.tasks = {
		trash: ({ inviteId }) =>
			api.jsonRequest(
				'CancelTaskRequest',
				{
					comp: '0',
					id: inviteId
				}
			),

		delete: ({ inviteId }) =>
			api.jsonRequest(
				'ItemActionRequest',
				{
					action: {
						op: 'delete',
						id: inviteId
					}
				}
			),

		move: ({ inviteId, destFolderId }) =>
			api.jsonRequest(
				'ItemActionRequest',
				{
					action: {
						op: 'move',
						id: inviteId,
						l: idField(destFolderId)
					}
				}
			)

		//read: - use messages.read instead - it is more consistent with the other task apis for shape of the response
	};

	api.contacts = {
		// list({ folder }) -> Array<Contact>
		list: (options = {}) => {
			let folder = options.folder || 'Contacts';
			return api.folders
				.read({ folder, types: 'contact', ...options })
				.then(ensureArray);
		},

		//exclude Contact Groups from the results
		listNoGroups: (options = {}) => {
			let folder = options.folder || 'Contacts',
				isId = folder.match(/^\d+$/);
			return api.contacts.list({
				query:
					(options.folder === false
						? ''
						: `${isId ? 'inid' : 'in'}:"${folder}" `) + `NOT #type:group`,
				...options
			});
		},

		//only return Contact Groups (exclude regular contacts)
		listOnlyGroups: (options = {}) => {
			let folder = options.folder || 'Contacts',
				isId = folder.match(/^\d+$/);
			return api.contacts.list({
				query: `${isId ? 'inid' : 'in'}:"${folder}" #type:group`,
				sortBy: 'nameAsc',
				...options
			});
		},

		create(contact) {
			let attrs = contact.attributes || contact._attrs || contact;

			if (typeof attrs === 'object' && !Array.isArray(attrs)) {
				attrs = Object.keys(attrs).map(key => ({
					n: key,
					_content: attrs[key]
				}));
			}

			return api.jsonRequest('CreateContactRequest', {
				cn: {
					l: contact.folderId,
					a: attrs
				}
			});
		},

		createGroup(name, folderId) {
			return api.jsonRequest('CreateContactRequest', {
				cn: {
					l: folderId || 7,
					a: [
						{ n: 'fileAs', _content: `8:${name}` },
						{ n: 'nickname', _content: name },
						{ n: 'type', _content: 'group' },
						{ n: 'fullName', _content: name }
					]
				}
			});
		},

		// read(id) -> Contact
		read: (id, options = {}) =>
			api.jsonRequest('GetContactsRequest', {
				cn: { id },
				derefGroupMember: 1,
				...options
			}),

		// update(id, { key: 'newValue' }) -> UpdateResult
		update(id, contact, options) {
			if (typeof id === 'object') {
				options = contact;
				contact = id;
				id = contact.id;
			}

			options = options || {};

			if (typeof contact === 'object' && !Array.isArray(contact)) {
				let attrs = contact.attributes || contact._attrs || contact;
				contact = Object.keys(attrs).map(key => ({
					n: key,
					_content: attrs[key]
				}));
			}

			if (!id) return Promise.reject('id is required');

			return api.jsonRequest('ModifyContactRequest', {
				force: options.force ? 1 : 0,
				replace: options.replace ? 1 : 0,
				cn: {
					id,
					// m: [],
					a: contact
				}
			});
		},

		memberOf(id) {
			return api.contacts.read(idField(id), { memberOf: 1 }).then(r =>
				array(r).map(currentContact => ({
					id: currentContact.id,
					memberOf:
						currentContact.memberOf &&
						String(currentContact.memberOf)
							.split(',')
							.reduce((acc, gId) => ({ ...acc, [gId]: true }), {})
				}))
			);
		},

		//Specify the new list of contact groups that a contact (or array of contacts) is a member of
		/**
		 * @param {String} operation 'overwrite' to specify exact group membership, '-' to just remove from the group, and '+' to just add to the new groups
		 */
		updateMembership(id, newContactGroups, operation = 'overwrite') {
			newContactGroups = idField(newContactGroups).split(',');

			return api.contacts.memberOf(id).then(contactMembershipMap => {
				contactMembershipMap = contactMembershipMap.reduce(
					(acc, { id: currentId, memberOf }) => ({
						...acc,
						[currentId]: memberOf
					}),
					{}
				);

				//build a map of all of the groups we need to update the membership of and what the operations are
				let updateMap = {};
				//go through each contact
				(Array.isArray(id) ? id : [id]).forEach(currentId => {
					let oldGroups = contactMembershipMap[currentId] || {};

					//find any where we need to ad to a contact group
					if (operation === 'overwrite' || operation === '+') {
						newContactGroups.forEach(groupId => {
							if (oldGroups[groupId]) return;
							if (!updateMap[groupId])
								updateMap[groupId] = { id: groupId, m: [] };
							updateMap[groupId].m.push({
								op: '+',
								type: 'C',
								value: currentId
							});
						});
					}

					//find any where we need to remove from a contact group
					if (operation === 'overwrite' || operation === '-') {
						Object.keys(oldGroups).forEach(groupId => {
							if (newContactGroups.indexOf(groupId) !== -1) return;
							if (!updateMap[groupId])
								updateMap[groupId] = { id: groupId, m: [] };
							updateMap[groupId].m.push({
								op: '-',
								type: 'C',
								value: currentId
							});
						});
					}
				});

				return api.batchJsonRequest(
					Object.keys(updateMap).map(groupId => [
						'ModifyContactRequest',
						{
							force: 1,
							replace: 0,
							cn: {
								a: [],
								...updateMap[groupId]
							}
						}
					])
				);
			});
		},

		// tag(12345, 'Foo', true)
		// tag(12345, 'Foo', false)
		// tag([12345, 12346], { name: 'Foo' }, 'overwrite')
		tag(id, tag, state = true) {
			return api.jsonRequest('ContactActionRequest', {
				action: {
					id: idField(id),
					op: state === 'overwrite' ? 'update' : state ? 'tag' : '!tag',
					[state === 'overwrite' ? 't' : 'tn']: idField(tag)
				}
			});
		},

		move(id, targetFolderId) {
			return api.jsonRequest('ContactActionRequest', {
				action: {
					op: 'move',
					id: idField(id),
					l: idField(targetFolderId)
				}
			});
		},

		trash: id =>
			api.jsonRequest('ContactActionRequest', {
				action: {
					op: 'trash',
					id: idField(id)
				}
			}),

		delete: id =>
			api.jsonRequest('ContactActionRequest', {
				action: {
					op: 'delete',
					id: idField(id)
				}
			}),

		/** Import contacts from a serialized format.
		 *	@param {String} data		Data to import
		 *	@param {Object} [options]
		 *	@param {Object} [options.folder]	      The name of the folder to import contacts into
		 *	@param {Object} [options.format='csv']	Format of the data being imported (csv or vcf).
		 */
		import(data, { format = 'csv', folder } = {}) {
			return api.request(
				`/service/home/~/contacts${folder ? `/${folder}` : ''}?fmt=${format}`,
				data
			);
		},

		/** Export contacts to a serialized downloadable format.
		 *	@param {Object} options
		 *	@param {String} [options.format='csv']	One of: zimbra-csv, yahoo-csv, thunderbird-csv, outlook-2003-csv
		 */
		export({ format = 'outlook-2003-csv' } = {}) {
			return api.jsonRequest('ExportContactsRequest', {
				ct: 'csv',
				csvfmt: format
			});
		},

		getExportUrl({ format = 'csv', csvFormat }) {
			return api.resolve(
				`/service/home/~/contacts?fmt=${format}${
					csvFormat ? `&csvfmt=${csvFormat}` : ''
				}`
			);
		},

		getRestorePoints() {
			return api.jsonRequest('GetContactBackupListRequest').then(
				files =>
					!files || !files.length
						? []
						: files.map((file, index) => ({
							id: index,
							name: file
						}))
			);
		},

		restoreSnapshot(file) {
			return api.jsonRequest('RestoreContactsRequest', {
				contactsBackupFileName: file
			});
		}
	};

	api.attachments = {
		getUrl(attachment) {
			let { messageId, mid, part } = attachment;
			return api.resolve(
				`/service/home/~/?auth=co&id=${encodeURIComponent(
					messageId || mid
				)}&part=${encodeURIComponent(part)}`
			);
		},
		list({ query, offset = 0, ...rest }) {
			return api
				.search({
					query: query || 'has:attachment',
					offset,
					fetch: true,
					...rest
				})
				.then(
					({ messages, ...results } = {}) =>
						results && {
							...results,
							attachments:
								messages && messages.length
									? messages.reduce(
										(acc, message) =>
											acc.concat(
												[
													...(message.attachments || []),
													...(message.inlineAttachments || [])
												].map(attachment => ({
													...attachment,
													sentDate: message.sentDate,
													from: message.from
												}))
											),
										[]
									)
									: []
						}
				);
		},
		files({ searchTerm, offset = 0, ...rest }) {
			if (searchTerm) {
				searchTerm = partitionTagsAndFilename(searchTerm);
			}
			const filename = getTagFromQuery('filename', searchTerm);

			return api.attachments
				.list({
					query: searchTerm,
					offset,
					...rest
				})
				.then(
					({ attachments, ...results }) =>
						results && {
							...results,
							attachments:
								attachments &&
								attachments.filter(
									attachment =>
										!isImage(attachment) &&
										!isBlacklistedAttachmentFile(attachment) &&
										(filename
											? hasCommonSubstr(filename, attachment.filename)
											: true)
								)
						}
				);
		},
		images({ searchTerm, offset = 0, ...rest }) {
			if (searchTerm) {
				searchTerm = partitionTagsAndFilename(searchTerm);
			}
			const filename = getTagFromQuery('filename', searchTerm);

			return api.attachments
				.list({
					query: searchTerm,
					fetch: true,
					offset,
					...rest
				})
				.then(
					({ attachments, ...results }) =>
						results && {
							...results,
							attachments:
								attachments &&
								attachments.filter(
									attachment =>
										isImage(attachment) &&
										(filename
											? hasCommonSubstr(filename, attachment.filename)
											: true)
								)
						}
				);
		}
	};

	const SEEN_IMAGES = [];
	const PRELOADING = {};

	const getUrl = url => (typeof url === 'object' ? url.url : url);

	api.images = {
		isPreloaded: resource => SEEN_IMAGES.indexOf(getUrl(resource)) !== -1,

		isPreloading: resource => PRELOADING[getUrl(resource)] !== undefined,

		preload(resource, callback) {
			const url = getUrl(resource);
			let promise;

			if (typeof callback !== 'function') {
				promise = PRELOADING[url] || new Promise(r => (callback = r));
			}
			if (!url || url === '' || SEEN_IMAGES.indexOf(url) > -1) {
				if (promise && PRELOADING[url]) return PRELOADING[url];
				callback();
			}
			else {
				let img = new Image(),
					sync = true,
					loaded;
				img.onload = img.onerror = () => {
					loaded = true;
					SEEN_IMAGES.push(url);
					if (!sync) {
						api.emit('res', { url });
						callback();
					}
				};
				img.src = url;
				sync = false;
				if (loaded) callback();
				else api.emit('req', { url: img.src });
			}
			return promise;
		}
	};

	api.whiteBlackList = {
		read: () =>
			api.jsonRequest(
				'GetWhiteBlackListRequest',
				{},
				{
					ns: 'account'
				}
			),

		setBlackList: addresses =>
			api.jsonRequest(
				'ModifyWhiteBlackListRequest',
				{
					blackList: {
						addr: addresses.map(email => ({ _content: email }))
					}
				},
				{
					ns: 'account'
				}
			),

		/**
		 * Update the black list
		 * @param  {Array<{ op: '+' | '-', email: string }>} addresses
		 */
		updateBlackList: addresses =>
			api.jsonRequest(
				'ModifyWhiteBlackListRequest',
				{
					blackList: {
						addr: addresses.map(a => ({ op: a.op, _content: a.email }))
					}
				},
				{
					ns: 'account'
				}
			)
	};

	api.linkEnhancer = function(url) {
		return fetch(
			`https://api.linkpreview.net/?key=5a0e2be54fcbb99b07ce94a935e5a5f9e8a31297d3140&q=${url}`
		)
			.then(resp => (resp.ok ? resp.json() : Promise.reject(resp.status)))
			.then(obj => ({
				...obj,
				// TODO: Implement favicon and domainStyles somehow?
				favicon: {},
				domainStyles: {
					logo: '',
					color: '#000000'
				}
			}));
	};

	api.filterRules = {
		read: () => api.jsonRequest('GetFilterRulesRequest'),
		update: filterRules =>
			api.jsonRequest('ModifyFilterRulesRequest', {
				filterRules: [{ filterRule: filterRules }]
			})
	};

	api.share = {
		getInfo: address =>
			api
				.jsonRequest(
					'GetShareInfoRequest',
					{
						includeSelf: 0,
						owner: {
							by: 'name',
							_content: address
						}
					},
					{
						ns: 'account'
					}
				)
				.then(shares => reject([].concat(shares || []), isEmpty)),
		mountCalendar: ({
			name,
			color,
			ownerId,
			ownerCalendarId,
			reminder,
			flags
		}) =>
			api.jsonRequest('CreateMountpointRequest', {
				// TODO: use new normalization approach?
				link: {
					name,
					color,
					reminder: reminder ? '1' : '0',
					rid: ownerCalendarId,
					zid: ownerId,
					f: flags,
					l: 1,
					view: 'appointment'
				}
			})
	};

	return api;
}

/** Flattens all instances of each event as events with a single instance.
 *	The original event can be accessed as .originalEvent
 *	@private
 */
function flattenEvents(events) {
	let instances = [];
	for (let i = 0; i < events.length; i++) {
		let event = events[i];
		for (let j = 0; j < event.instances.length; j++) {
			let instance = event.instances[j];
			instances.push({
				originalEvent: event,
				...event,
				instances: [instance],
				instance
			});
		}
	}
	return instances;
}

function collapseAddresses(list, type) {
	if (!list) {
		return [];
	}
	let out = [];
	for (let i = 0; i < list.length; i++) {
		let sender = list[i];

		// Skip invalid senders.
		if (isValidEmail(sender.email || sender.address)) {
			out.push({
				address: sender.email || sender.address,
				name: sender.name,
				shortName: sender.shortName || sender.firstName,
				type: type[0] // @TODO verify this is t/f/b/c
			});
		}
	}
	return out;
}

function isBlacklistedAttachmentFile({ filename, contentType }) {
	// If a attachment has no name, or ends in `ics`, blacklist it.
	return (
		!filename || /\.ics$/.test(filename) || /message\/rfc822/.test(contentType)
	);
}

function formatAttachment({ ...attachment }, contentDisposition='attachment') {
	const { contentId, attachmentId } = attachment;
	const messageId = attachment.messageId || attachment.draftId;

	if (attachmentId) {
		return {
			contentDisposition,
			contentId,
			attach: { attachmentId }
		};
	}

	if (messageId) {
		return {
			contentId,
			attach: {
				mimeParts: [{
					messageId,
					part: attachment.part
				}]
			}
		};
	}

	// never send locally resolved url
	delete attachment.url;
	delete attachment.messageId;
	delete attachment.contentId;
	delete attachment.attachmentId;

	return {
		...attachment,
		contentDisposition
	};
}

/**
 * Given a message output by the Composer component, create a message
 * compatible with the Zimbra SOAP API
 */
function convertMessageToZimbra(message) {
	let {
		id,
		inReplyTo,
		entityId,
		from,
		to,
		cc,
		bcc,
		subject,
		text,
		html,
		flag,
		origId,
		draftId,
		rt,
		attach, // Used to attach a new attachment.
		attachments,
		inlineAttachments,
		autoSendTime
	} = message;

	let out = {
		id,
		origId,
		draftId,
		rt,
		irt: inReplyTo,
		entityId,
		subject,
		flag,
		autoSendTime,
		senders: [
			...collapseAddresses(to, 'to'),
			...collapseAddresses(cc, 'cc'),
			...collapseAddresses(bcc, 'bcc'),
			...collapseAddresses(from, 'from')
		]
	};

	let mimeParts = [];

	let textPart = {
		contentType: 'text/plain',
		content: {
			_content: text || ''
		}
	};

	let htmlPart = {
		contentType: 'text/html',
		content: {
			_content: html || ''
		}
	};

	if (html && text) {
		// if we have HTML, put the `text` & `html` parts into an `alternative` part
		// with the text part first but the html part flagged as body.
		htmlPart.body = true;

		mimeParts.push({
			contentType: 'multipart/alternative',
			mimeParts: [textPart, htmlPart]
		});
	}
	else {
		// otherwise there is no need for a `related` part, we just drop `text`
		// into `alternative` or `mixed` (depending if there are attachments).
		let part = html ? htmlPart : textPart;
		part.body = true;
		mimeParts.push(part);
	}

	// If there are inline attachments; then create a `multipart/related` part
	// and append the `text/html` part and all inline attachment mimeParts to it.
	if (inlineAttachments && inlineAttachments.length && mimeParts[0] && mimeParts[0].mimeParts[1] === htmlPart) {
		mimeParts[0].mimeParts[1] = {
			contentType: 'multipart/related',
			mimeParts: [
				htmlPart,
				...inlineAttachments.map((attachment) => formatAttachment(attachment, 'inline') )
			]
		};
	}

	out.mimeParts = mimeParts;

	if (attach) {
		out.attach = attach;
	}

	if (attachments && attachments.length) {
		if (!out.attach) {
			out.attach = {};
		}

		out.attach.mimeParts = attachments.map(({ part, messageId }) => ({
			part,
			messageId: messageId || id
		}));
	}

	return normalizeToZimbra(out);
}
