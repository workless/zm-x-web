import { handleActions } from 'redux-actions';
import * as actionCreators from './actions';

const initialState = {
	folder: 10,
	date: new Date(),
	view: null
};

export default handleActions({
	[actionCreators.setDate]: (state, action) => ({
		...state,
		date: action.payload
	}),
	[actionCreators.setView]: (state, action) => ({
		...state,
		view: action.payload
	})
}, initialState);
