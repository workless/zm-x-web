export const CALENDAR_TYPE = {
	holiday: 'holiday',
	own: 'own',
	other: 'other'
};

export const CALENDAR_LIST_ORDER = {
	[CALENDAR_TYPE.own]: 0,
	[CALENDAR_TYPE.holiday]: 1,
	[CALENDAR_TYPE.other]: 2
};

export const CALENDAR_IDS = {
	[CALENDAR_TYPE.own]: {
		DEFAULT: '10'
	}
};

// Zimbra FolderActionRequest op='!grant' requires a `zid`
// however, `pub` and `all` require fake `zid`s.
// https://files.zimbra.com/docs/soap_api/8.7.11/api-reference/zimbraMail/FolderAction.html
export const ZIMBRA_GRANT_IDS = {
	all: '00000000-0000-0000-0000-000000000000',
	pub: '99999999-9999-9999-9999-999999999999'
};

export const ATTENDEE_ROLE = {
	optional: 'OPT',
	required: 'REQ'
};
