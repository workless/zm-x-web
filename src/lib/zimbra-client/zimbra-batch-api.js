import DataLoader from 'dataloader';
import castArray from 'lodash/castArray';
import flow from 'lodash/flow';
import reject from 'lodash/reject';
import isEmpty from 'lodash/isEmpty';
import fastStableStringify from 'fast-stable-stringify';

import { APPOINTMENT_VIEW, TASK_VIEW } from '../../constants/views';

import { normalize } from './normalize';
import { Folder, FreeBusy, CalendarItemHitInfo, MessageInfo } from './schema';

const APPOINTMENT = 'appointment';

const appointmentsForCalendar = ({
	start,
	end,
	calendarId,
	offset,
	limit
}) => ({
	name: 'SearchRequest',
	options: {
		types: APPOINTMENT,
		calExpandInstStart: start,
		calExpandInstEnd: end,
		query: `inid:"${calendarId}"`,
		offset,
		limit
	},
	normalizeResponse: ({ appointments = [], ...rest }) => ({
		...rest,
		appointments
	})
});


const tasks= ({
	offset,
	limit=1000,
	sortBy,
	folderId
}) => ({
	name: 'SearchRequest',
	options: {
		types: TASK_VIEW,
		offset,
		limit,
		query: `inid:"${folderId}"`,
		sortBy: sortBy || 'dateAsc'
	},
	normalizeResponse: ({ task = [], ...rest }) => ({
		...rest,
		tasks: task.map(t => normalize(t, CalendarItemHitInfo))
	})
});

const message = ({
	id,
	html,
	text,
	raw,
	headers,
	read,
	max
}) => ({
	name: 'GetMsgRequest',
	options: {
		m: {
			id,
			html: html !== false && text !== true && raw !== true ? 1 : 0,
			header: headers && headers.map(n => ({ n })),
			read: read === true ? 1 : undefined,
			// expand available expansions
			needExp: 1,
			neuter: 0,
			// max body length (look for mp.truncated=1)
			max: max || 250000,
			raw: raw ? 1 : 0
		}
	},
	normalizeResponse: (m) => normalize(m, MessageInfo)
});

const folder = ({
	id,
	uuid,
	view
}) => ({
	name: 'GetFolderRequest',
	options: {
		view: view || APPOINTMENT_VIEW,
		tr: true,
		folder: id || uuid ? { id, uuid } : undefined
	},
	normalizeResponse: ({ folder: folders, link } = { folder: [], link: [] }) =>
		normalize(
			[].concat(folders, link).filter((f) => (
				f && !f.folder && !f.link
			)),
			Folder
		)
});

const freeBusy = ({ start, end, names }) => ({
	name: 'GetFreeBusyRequest',
	options: {
		s: start,
		e: end,
		name: names.join(',')
	},
	normalizeResponse: ({ usr }) => normalize(usr, FreeBusy)
});

const shareInfo = ({ address }) => ({
	name: 'GetShareInfoRequest',
	options: {
		includeSelf: 0,
		owner: {
			by: 'name',
			_content: address
		},
		_jsns: 'urn:zimbraAccount'
	},
	normalizeResponse: ({ share } = { share: [] }) =>
		reject([].concat(share || []), isEmpty)
});

const accountInfo = () => ({
	name: 'account::GetInfoRequest',
	normalizeResponse: data => {
		if (isEmpty(data.signatures)) {
			data.signatures = [];
		}
		return data;
	}
});

const preferences = () => ({
	name: 'account::GetPrefsRequest'
});

const addSignature = ({ name, contentType, value }) => ({
	name: 'account::CreateSignatureRequest',
	options: {
		signature: {
			name,
			content: {
				type: contentType,
				_content: value
			}
		}
	},
	normalizeResponse: ({ id }) => ({
		id
	})
});

const modifySignature = ({ id, contentType, value }) => ({
	name: 'account::ModifySignatureRequest',
	options: {
		signature: {
			id,
			content: {
				type: contentType,
				_content: value
			}
		}
	}
});

const deleteSignature = ({ id }) => ({
	name: 'account::DeleteSignatureRequest',
	options: {
		signature: {
			id
		}
	}
});

const searchRequest = options => ({
	name: 'SearchRequest',
	options
});

const _getContact = ({ id }) => ({
	name: 'GetContactsRequest',
	options: {
		cn: { id }
	}
});

const _getContactFrequency = (options) => ({
	name: 'GetContactFrequencyRequest',
	options
});

const _relatedContacts = ({ email }) => ({
	name: 'GetRelatedContactsRequest',
	options: {
		targetContact: {
			cn: email
		}
	}
});

export default function zimbraBatchAPI({ zimbra }) {
	if (!zimbra) {
		throw new Error("A 'zimbra' client must be provided");
	}

	const batchLoader = new DataLoader(
		requests => {
			const requestsForZimbra = requests.map(({ name, options }) => [
				name,
				options
			]);
			return zimbra.batchJsonRequest(requestsForZimbra).then(results => {
				batchLoader.clearAll();
				return castArray(results).map(
					(result, index) =>
						requests[index].normalizeResponse
							? requests[index].normalizeResponse(result)
							: result
				);
			});
		},
		{
			// We want caching for each GraphQL resolve, but we will clear after each
			// round to avoid subsequent query caching we don't want.
			cacheKeyFn: ({ name, options }) => fastStableStringify({ name, options })
		}
	);

	const batchLoaderLoad = batchLoader.load.bind(batchLoader);
	const getContact = flow([_getContact, batchLoaderLoad]);
	const getContactFrequency = flow([_getContactFrequency, batchLoaderLoad]);
	const getMessage = flow([message, batchLoaderLoad]);
	const loadAccountInfo = flow([accountInfo, batchLoaderLoad]);
	const loadAddSignature = flow([addSignature, batchLoaderLoad]);
	const loadAppointmentsForCalendar = flow([appointmentsForCalendar,batchLoaderLoad]);
	const loadDeleteSignature = flow([deleteSignature, batchLoaderLoad]);
	const loadFolder = flow([folder, batchLoaderLoad]);
	const loadFreeBusy = flow([freeBusy, batchLoaderLoad]);
	const loadModifySignature = flow([modifySignature, batchLoaderLoad]);
	const loadPreferences = flow([preferences, batchLoaderLoad]);
	const loadShareInfo = flow([shareInfo, batchLoaderLoad]);
	const loadTasks = flow([tasks,batchLoaderLoad]);
	const relatedContacts = flow([_relatedContacts, batchLoaderLoad]);
	const search = flow([searchRequest, batchLoaderLoad]);

	return {
		getContact,
		getContactFrequency,
		getMessage,
		loadAccountInfo,
		loadAddSignature,
		loadAppointmentsForCalendar,
		loadDeleteSignature,
		loadFolder,
		loadFreeBusy,
		loadModifySignature,
		loadPreferences,
		loadShareInfo,
		loadTasks,
		relatedContacts,
		search
	};
}
