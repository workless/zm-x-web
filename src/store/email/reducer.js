import { handleActions } from 'redux-actions';
import { DEFAULT_MAILBOX_METADATA_SECTION } from '../../constants';
import { pendingAction, fulfilledAction } from '@zimbra/util/src/redux/async-action';

import * as actionCreators from './actions';

const initialState = {
	account: undefined,
	compose: undefined,
	whiteBlackList: {
		whiteList: [],
		blackList: []
	},
	filterRules: [],
	fit: typeof window !== 'undefined' ? window.innerWidth <= 480 : true,
	images: true,
	mailbox: {
		metadata: {}
	}
};

export default handleActions({
	[actionCreators.setAccount]: (state, action) => ({
		...state,
		account: action.payload
	}),
	[actionCreators.openModalCompose]: (state, action) => ({
		...state,
		compose: action.payload
	}),
	[actionCreators.closeCompose]: (state) => ({
		...state,
		compose: null
	}),
	[actionCreators.toggleImages]: (state) => ({
		...state,
		images: !state.images
	}),
	[actionCreators.toggleFit]: (state) => ({
		...state,
		fit: !state.fit
	}),
	[fulfilledAction(actionCreators.loadMailboxMetadata)]: (state, action) => ({
		...state,
		mailbox: {
			...state.mailbox,
			metadata: {
				...state.mailbox.metadata,
				[action.payload.data.section]: action.payload.data._attrs
			}
		}
	}),
	[fulfilledAction(actionCreators.loadWhiteBlackList)]: (state, action) => ({
		...state,
		whiteBlackList: action.payload.data
	}),
	[fulfilledAction(actionCreators.loadFilterRules)]: (state, action) => ({
		...state,
		filterRules: Array.from(action.payload.data)
	}),
	[pendingAction(actionCreators.setFilterRules)]: (state, action) => ({
		...state,
		filterRules: action.payload.options
	}),
	[pendingAction(actionCreators.setUserPrefs)]: (state, action) => ({
		...state,
		account: {
			...state.account,
			prefs: {
				...state.account.prefs,
				...action.payload.options
			}
		}
	}),
	[pendingAction(actionCreators.setMailboxMetadata)]: (state, action) => ({
		...state,
		mailbox: {
			...state.mailbox,
			metadata: {
				...state.mailbox.metadata,
				[DEFAULT_MAILBOX_METADATA_SECTION]: {
					...state.mailbox.metadata[DEFAULT_MAILBOX_METADATA_SECTION],
					...action.payload.options
				}
			}
		}
	}),
	[(pendingAction(actionCreators.setBlackList))]: (state, action) => ({
		...state,
		whiteBlackList: {
			...state.whiteBlackList,
			blackList: action.payload.options
		}
	})
}, initialState);
