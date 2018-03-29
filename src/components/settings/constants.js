import find from 'lodash-es/find';
import { weekdays } from 'moment-timezone';
import { FONT_FAMILY, FONT_SIZE } from '../../constants/fonts';
import {
	groupMailBy,
	markAsRead,
	messageListsShowSnippets
} from '../../constants/user-prefs';
import { groupByList, multitasking } from '../../constants/mailbox-metadata';
import {
	setUserPrefs,
	setMailboxMetadata,
	setFilterRules,
	setBlackList
} from '../../store/email/actions';
import {
	getMailboxMetadata,
	getUserPref,
	getWhiteBlackList,
	getSupportedFilterRules
} from '../../store/email/selectors';
import { empty, getDayNumber } from '../../lib/util';
import {
	parse as parseDate,
	format as formatDate
} from '../../utils/date/zimbra-date';
import ViewingEmailSettings from './viewing-email-settings';
import WritingEmailSettings from './writing-email-settings';
import AccountsSettings from './accounts-settings';
import BlockedAddressesSettings from './blocked-addresses-settings';
import SecurityAndActivitySettings from './security-and-activity-settings';
import CalendarAndRemindersSettings from './calendar-and-reminders-settings';
import { soapTimeToJson, jsonTimeToSoap } from '../../utils/prefs';
import FiltersSettings from './filters-settings';
import VacationResponseSettings from './vacation-response-settings';

export const FIELD_TYPES = {
	MAILBOX_METADATA: 'mailboxMetadata',
	USER_PREF: 'userPref',
	WHITE_BLACK_LIST: 'whiteBlacklist',
	FILTER_RULES: 'filterRules'
};
export const FIELD_TYPE_METHODS = {
	[FIELD_TYPES.MAILBOX_METADATA]: {
		updateAction: setMailboxMetadata,
		selector: getMailboxMetadata
	},
	[FIELD_TYPES.USER_PREF]: {
		selector: getUserPref,
		updateAction: setUserPrefs
	},
	[FIELD_TYPES.WHITE_BLACK_LIST]: {
		updateAction: ({ blackList }) => setBlackList(blackList),
		selector: getWhiteBlackList
	},
	[FIELD_TYPES.FILTER_RULES]: {
		selector: getSupportedFilterRules,
		updateAction: ({ filterRules }) => setFilterRules(filterRules)
	}
};

const fieldConfig = (type, key, defaultValue, toJS, fromJS) => ({
	type,
	key,
	defaultValue,
	toJS,
	fromJS
});
const userPref = (zimbraUserPref, defaultValue, toJS, fromJS) =>
	fieldConfig(
		FIELD_TYPES.USER_PREF,
		zimbraUserPref,
		defaultValue,
		toJS,
		fromJS
	);
const mailboxMetadata = (zimbraMailboxMetadata, defaultValue, toJS, fromJS) =>
	fieldConfig(
		FIELD_TYPES.MAILBOX_METADATA,
		zimbraMailboxMetadata,
		defaultValue,
		toJS,
		fromJS
	);
const whiteBlackList = listType =>
	fieldConfig(FIELD_TYPES.WHITE_BLACK_LIST, listType, []);
const filterRules = () =>
	fieldConfig(FIELD_TYPES.FILTER_RULES, 'filterRules', []);

export const VIEWING_EMAIL_SETTINGS = {
	id: 'viewingEmail',
	title: 'Viewing Email',
	component: ViewingEmailSettings,
	fields: {
		messageListsEnableConversations: userPref(
			groupMailBy.name,
			groupMailBy.default,
			val => val === groupMailBy.values.conversation,
			val =>
				val ? groupMailBy.values.conversation : groupMailBy.values.message
		),
		messageListsShowSnippets: userPref(messageListsShowSnippets, true),
		messageListsGroupByList: mailboxMetadata(
			groupByList.name,
			groupByList.values.date,
			val => val === groupByList.values.date,
			val => (val ? groupByList.values.date : groupByList.values.none)
		),
		// New preference, not supported in old client.
		multitasking: mailboxMetadata(
			'zimbraPrefMultitasking',
			multitasking.default
		),
		previewPane: userPref('zimbraPrefReadingPaneLocation', 'right'),
		// New preference, not supported in old client.
		messageListDensity: mailboxMetadata(
			'zimbraPrefMessageListDensity',
			'regular'
		),
		markAsRead: userPref(markAsRead, '0'),
		afterMoveMessage: userPref('zimbraPrefMailSelectAfterDelete', 'adaptive'),
		enableDesktopNotifications: userPref('zimbraPrefMailToasterEnabled', true),
		mailVersion: userPref('zimbraPrefClientType', 'advanced')
	}
};
export const WRITING_EMAIL_SETTINGS = {
	id: 'writingEmail',
	title: 'Writing Email',
	component: WritingEmailSettings,
	fields: {
		whenSendingMessageAddToContacts: userPref(
			'zimbraPrefAutoAddAddressEnabled',
			true
		),
		whenSendingMessageGenerateLinkPreviews: mailboxMetadata(
			'zimbraPrefGenerateLinkPreviews',
			true
		),
		undoSendEnabled: mailboxMetadata(
			'zimbraPrefUndoSendEnabled',
			false
		),
		// Stores different values than those stored by the old client, interop is not supported.
		// API enforces an 80 char limit, so we persist the font label instead of the value.
		defaultRichTextFont: userPref(
			'zimbraPrefHtmlEditorDefaultFontFamily',
			FONT_FAMILY[0].label,
			val => {
				const fontFamily = find(FONT_FAMILY, ({ label }) => label === val);
				if (!empty(fontFamily)) {
					return fontFamily.value;
				}
				return FONT_FAMILY[0].value;
			},
			val => {
				const fontFamily = find(FONT_FAMILY, ({ value }) => value === val);
				return fontFamily.label;
			}
		),
		// Stores different values than those stored by the old client, interop is not supported.
		defaultRichTextSize: userPref(
			'zimbraPrefHtmlEditorDefaultFontSize',
			FONT_SIZE[Math.floor(FONT_SIZE.length / 2)].value
		),
		// FIXME: determine preference key
		defaultSendingAccount: mailboxMetadata('')
	}
};
export const BLOCKED_ADDRESSES_SETTINGS = {
	id: 'blockedAddresses',
	title: 'Blocked Addresses',
	component: BlockedAddressesSettings,
	fields: {
		blockedAddresses: whiteBlackList('blackList')
	}
};

export const ACCOUNTS_SETTINGS = {
	id: 'accounts',
	title: 'Accounts',
	component: AccountsSettings,
	fields: {
		mailForwardingAddress: userPref('zimbraPrefMailForwardingAddress'),
		mailLocalDeliveryDisabled: userPref(
			'zimbraPrefMailLocalDeliveryDisabled',
			false,
			val => val.toString(),
			val => val === 'true'
		)
	}
};

export const VACATION_RESPONSE_SETTINGS = {
	id: 'vacationResponses',
	title: 'Vacation Response',
	component: VacationResponseSettings,
	fields: {
		enableOutOfOfficeReply: userPref(
			'zimbraPrefOutOfOfficeReplyEnabled',
			false
		),

		defaultFromDate: userPref(
			'zimbraPrefOutOfOfficeFromDate',
			new Date(),
			parseDate,
			formatDate
		),

		defaultUntilDate: userPref(
			'zimbraPrefOutOfOfficeUntilDate',
			new Date(),
			parseDate,
			formatDate
		),

		enableOutOfOfficeAlertOnLogin: userPref(
			'zimbraPrefOutOfOfficeStatusAlertOnLogin',
			false
		),

		outOfOfficeReply: userPref('zimbraPrefOutOfOfficeReply', '')
	}
};

export const SECURITY_AND_ACTIVITY_SETTINGS = {
	id: 'securityAndActivity',
	title: 'Security and Activity',
	component: SecurityAndActivitySettings,
	fields: {
		showImages: userPref(
			'zimbraPrefDisplayExternalImages',
			'never',
			val => val.toString(),
			val => val === 'true'
		)
	}
};

export const CALENDAR_AND_REMINDERS_SETTINGS = {
	id: 'calendarAndReminders',
	title: 'Calendar and Reminders',
	component: CalendarAndRemindersSettings,
	fields: {
		startOfWeek: userPref(
			'zimbraPrefCalendarFirstDayOfWeek',
			weekdays(0),
			val => weekdays(val),
			val => getDayNumber(val)
		),
		timeOfDay: userPref(
			'zimbraPrefCalendarWorkingHours',
			{},
			val => soapTimeToJson(val),
			jsonTime => jsonTimeToSoap(jsonTime)
		),
		timeZone: userPref(
			'zimbraPrefTimeZoneId',
			'America/New_York',
			val => val.toString(),
			val => val
		),
		autoAddAppointmentsToCalendar: userPref(
			'zimbraPrefCalendarAutoAddInvites',
			true
		)
	}
};

export const FILTERS_SETTINGS = {
	id: 'filters',
	title: 'Filters',
	component: FiltersSettings,
	fields: {
		filters: filterRules()
	},
	hideOnScreenXs: true
};

export const SETTINGS_ID_TO_CONFIG = {
	viewingEmail: VIEWING_EMAIL_SETTINGS,
	writingEmail: WRITING_EMAIL_SETTINGS,
	accounts: ACCOUNTS_SETTINGS,
	vacationResponses: VACATION_RESPONSE_SETTINGS,
	blockedAddresses: BLOCKED_ADDRESSES_SETTINGS,
	securityAndActivity: SECURITY_AND_ACTIVITY_SETTINGS,
	calendarAndReminders: CALENDAR_AND_REMINDERS_SETTINGS,
	filters: FILTERS_SETTINGS
};
