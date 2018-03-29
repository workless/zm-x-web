import { createAction } from 'redux-actions';
import { READING_PANE_LOCATION } from '../../constants';
import { groupMailBy } from '../../constants/user-prefs';
import { createAsyncAction } from '@zimbra/util/src/redux/async-action';
import { getAllMailboxMetadata } from './selectors';
import { serializeFoldersExpanded } from '../../utils/prefs';

export const setAccount = createAction('email setAccount');

export const openModalCompose = createAction(
	'email openModalCompose',
	({ mode, message }) => (mode && message ? { mode, message } : true)
);
export const closeCompose = createAction('email closeCompose');
export const toggleFit = createAction('email toggleFit');
export const toggleImages = createAction('email toggleImages');

export const setUserPrefs = createAsyncAction(
	'email set.user.prefs',
	({ options, zimbra }) => zimbra.account.modifyPrefs(options)
);

export const loadMailboxMetadata = createAsyncAction(
	'email load.mailbox.metadata',
	({ zimbra }) => zimbra.mailbox.getMailboxMetadata()
);

export const loadWhiteBlackList = createAsyncAction(
	'email load.whiteBlackList',
	({ zimbra }) => zimbra.whiteBlackList.read()
);

export const loadFilterRules = createAsyncAction(
	'email load.filterRules',
	({ zimbra }) => zimbra.filterRules.read()
);

export const setFilterRules = createAsyncAction(
	'email set.filterRules',
	({ options, zimbra }) => zimbra.filterRules.update(options)
);

/**
 * Update the mailbox metadata, which requires sending _all_ existing
 * and updated keys.
 */
export const setMailboxMetadata = createAsyncAction(
	'email set.mailbox.metadata',
	({ options, zimbra, getState }) =>
		zimbra.mailbox.setMailboxMetadata({
			...getAllMailboxMetadata(getState()),
			...options
		})
);

export const setBlackList = createAsyncAction(
	'email set.whiteBlackList.blackList',
	({ options, zimbra }) => zimbra.whiteBlackList.setBlackList(options)
);

export const setMailboxFoldersExpanded = foldersExpandedObj =>
	setMailboxMetadata({
		zimbraPrefFoldersExpanded: serializeFoldersExpanded(foldersExpandedObj)
	});

export const setReadingPaneLocation = (location /* off|right|bottom */) =>
	setUserPrefs({
		zimbraPrefReadingPaneLocation: READING_PANE_LOCATION[location] || 'off'
	});

export const setGroupMailBy = val =>
	setUserPrefs({
		[groupMailBy.name]: groupMailBy.values[val]
	});
