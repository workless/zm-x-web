import { handleActions } from 'redux-actions';

import { ALL_VIEW } from '../../constants/views';

import { fulfilledAction } from '@zimbra/util/src/redux/async-action';
import * as actionCreators from './actions';

const initialState = {
	views: {}
};

export default handleActions({
	[fulfilledAction(actionCreators.loadFolders)]: (state, action) => ({
		...state,
		views: {
			...state.views,
			[action.payload.options.view || ALL_VIEW]: {
				ids: action.payload.data.result
			}
		}
	})
}, initialState);
