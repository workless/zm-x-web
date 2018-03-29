import { handleAction } from 'redux-actions';
import { setActiveAccountId } from './actions';

const initialState = {
	id: null
};

export default handleAction(
	setActiveAccountId,
	(state, action) => ({
		...state,
		id: action.payload
	}),
	initialState
);
