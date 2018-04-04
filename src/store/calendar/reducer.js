import { handleActions } from 'redux-actions';
import * as actionCreators from './actions';

const initialState = {
	date: new Date()
};

export default handleActions({
	[actionCreators.setDate]: (state, action) => ({
		...state,
		date: action.payload
	})
}, initialState);
