import { combineReducers } from 'redux';
import reduceReducers from 'reduce-reducers';
import { handleActions, combineActions } from 'redux-actions';
import paginate from '@zimbra/util/src/redux/paginate';
import { pendingAction } from '@zimbra/util/src/redux/async-action';
import array from '@zimbra/util/src/array';
import without from 'lodash-es/without';
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

function collectionTypeFor(itemType) {
	return `${itemType}s`;
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
	}),
	handleActions(
		{
			[combineActions(
				pendingAction(actionCreators.deleteMailItem),
				pendingAction(actionCreators.moveMailItem),
				pendingAction(actionCreators.archiveMailItem)
			)]: (state, action) => {
				const { currentFolder, type } = action.payload.options;
				if (!currentFolder) {
					return state;
				}

				const collectionType = collectionTypeFor(type);
				if (!state[collectionType]) {
					return state;
				}

				const folderKey = currentFolder.absFolderPath.replace('/', '');
				if (!state[collectionType][folderKey]) {
					return state;
				}

				return {
					...state,
					[collectionType]: {
						...state[collectionType],
						[folderKey]: {
							...state[collectionType][folderKey],
							pages: state[collectionType][folderKey].pages.map(p => without(p, ...array(action.payload.options.id)))
						}
					}
				};
			}
		},
		initialState
	)
);
