import { combineReducers } from 'redux';
import reduceReducers from 'reduce-reducers';
import { handleActions } from 'redux-actions';
import paginate from '@zimbra/util/src/redux/paginate';
import * as actionCreators from './actions';

const initialState = {
	conversations: {},
	messages: {},
	selectedIds: new Set()
};

function paginateFolder(collectionType, state) {
	return paginate({
		mapActionToKey: action => action.payload.options.folderName,
		mapActionToPage: action => action.payload.data.data.result[collectionType],
		type: actionCreators.loadMailCollection.toString(),
		initialState: state,
		cacheKeys: ['sortBy']
	});
}

export default reduceReducers(
	combineReducers({
		conversations: paginateFolder('conversations', initialState.conversations),
		messages: paginateFolder('messages', initialState.messages),
		selectedIds: handleActions( {
			[actionCreators.clearSelected]: () => new Set(),

			[actionCreators.toggleSelected]: (state, action) => {
				let { id, e } = action.payload;
				return e.target.checked ? new Set(state.add(id)) : new Set(Array.from(state).filter(i => i !== id));
			},

			[actionCreators.toggleAllSelected]: (state, action) => state.size === 0 ? new Set(action.payload.items.map(i => i.id)) : new Set()

		}, initialState.selectedIds)
	})
);
