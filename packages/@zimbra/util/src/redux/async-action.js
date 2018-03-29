export function createAsyncAction(type, asyncFunc) {
	const actionCreator = (options = {}) => (dispatch, getState, zimbra) => {
		dispatch({
			type: `${type}_PENDING`,
			payload: { data: null, options }
		});

		return asyncFunc({ options, dispatch, getState, zimbra })
			.then(data => {
				dispatch({
					type: `${type}_FULFILLED`,
					payload: { data, options }
				});
				const { fulfilledActions = [] } = options;
				fulfilledActions.forEach(action => dispatch(action));
				return data;
			})
			.catch(error => {
				// eslint-disable-next-line
				console.log(`[⚠ Async Action Failure] [${type}_REJECTED]:`, error);

				dispatch({
					type: `${type}_REJECTED`,
					error: true,
					payload: { error: error && error.message, options }
				});

				return Promise.reject(error);
			});
	};

	actionCreator.toString = () => type;

	return actionCreator;
}

export function pendingAction(actionCreator) {
	return `${actionCreator}_PENDING`;
}

export function fulfilledAction(actionCreator) {
	return `${actionCreator}_FULFILLED`;
}

export function rejectedAction(actionCreator) {
	return `${actionCreator}_REJECTED`;
}
