import get from 'lodash-es/get';
import has from 'lodash-es/has';
import {
	normalizeFoldersExpanded,
	normalizeList
} from '../../utils/prefs';
import { DEFAULT_MAILBOX_METADATA_SECTION } from '../../constants';
import {
	markAsRead,
	messageListsShowSnippets
} from '../../constants/user-prefs';
import {
	FILTER_ACTION_TYPE,
	FILTER_TEST_TYPE
} from '../../constants/filter-rules';

export function getUserPref(state, key) {
	return get(state, `email.account.prefs.${key}`);
}

export function getAllMailboxMetadata(state) {
	return state.email.mailbox.metadata[DEFAULT_MAILBOX_METADATA_SECTION];
}

export function getMailboxMetadata(state, key) {
	return get(
		state.email.mailbox.metadata[DEFAULT_MAILBOX_METADATA_SECTION],
		key
	);
}

export function getWhiteBlackList(state, listType) {
	return normalizeList(state.email.whiteBlackList[listType]);
}

export function getFilterRules(state) {
	return normalizeList(state.email.filterRules);
}

/**
 * We support a subset of the filter rules supported by the legacy client.
 *
 * We only support creation and edit of `actionFileInto` filter
 * rules with a single destination folder.
 *
 * We only support creation and edit of tests of type `bodyTest`,
 * `addressTest` where `header` is `from` or `to,cc`, and `headerTest` where
 * `header` is `subject`.
 */
export function getSupportedFilterRules(state) {
	return getFilterRules(state).filter(rule => {
		if (!rule.active) return false;

		// We only support single-action rules.
		if (rule.filterActions.length > 1) return false;

		// We only support single-clause actionFileInto actions.
		const filterAction = rule.filterActions[0];
		if (Object.keys(filterAction).length !== 1 ||
				!has(filterAction, FILTER_ACTION_TYPE.FILE_INTO)) {
			return false;
		}

		// We only support a subset of test types.
		// TODO: we could be stricter on filtering, e.g. for these test types there
		// might exist unsupported header tests set by legacy client.
		return rule.filterTests.every(filterTest => {
			if (filterTest[FILTER_TEST_TYPE.BODY] ||
					filterTest[FILTER_TEST_TYPE.HEADER] ||
					filterTest[FILTER_TEST_TYPE.ADDRESS]) {
				return true;
			}
			return false;
		});
	});
}

export function getMailboxFoldersExpanded(state) {
	return normalizeFoldersExpanded(
		getMailboxMetadata(state, 'zimbraPrefFoldersExpanded')
	);
}

export function getMarkAsReadAfterSeconds(state) {
	return parseInt(getUserPref(state, markAsRead), 10);
}

export function getMessageListsShowSnippets(state) {
	return getUserPref(state, messageListsShowSnippets);
}
