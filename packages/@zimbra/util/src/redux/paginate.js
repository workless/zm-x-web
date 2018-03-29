/* eslint-disable no-case-declarations */
import find from 'lodash-es/find';
import flatten from 'lodash-es/flatten';
import { pendingAction, fulfilledAction, rejectedAction } from './async-action';

/**
 * A higher order reducer that manages pagination for an async
 * flux standard action following the pending, fulfilled, rejected pattern.
 */
export default function createPaginationReducer({
	type,
	mapActionToKey,
	mapActionToPage,
	initialState = {},
	cacheKeys = []
}) {
	if (typeof type !== 'string') {
		throw new Error('Expected type to be a async action type string.');
	}
	if (typeof mapActionToKey !== 'function') {
		throw new Error('Expected mapActionToKey to be a function.');
	}

	const requestType = pendingAction(type);
	const successType = fulfilledAction(type);
	const failureType = rejectedAction(type);

	const shouldClearCache = (state, options) =>
		!!find(cacheKeys, key => options[key] && options[key] !== state[key]);

	const updatePagination = (
		state = {
			pending: false,
			rejected: false,
			fulfilled: false,
			more: true,
			limit: 50,
			sortBy: null,
			error: null,
			pages: [],
			currentPage: 1
		},
		action
	) => {
		switch (action.type) {
			case requestType:
				const { options } = action.payload;
				const clearCache = shouldClearCache(state, options);

				return {
					...state,
					pending: true,
					rejected: false,
					fulfilled: false,
					error: null,
					sortBy: options.sortBy || state.sortBy,
					pages: clearCache ? [] : state.pages
				};
			case successType:
				const { meta, data } = action.payload.data;
				const pageIndex = meta.offset / meta.limit;
				const result = mapActionToPage ? mapActionToPage(action) : data.result;

				return {
					...state,
					...meta,
					pending: false,
					fulfilled: true,
					rejected: false,
					error: null,
					pages: [...state.pages.slice(0, pageIndex), result || []],
					currentPage: pageIndex + 1
				};
			case failureType:
				return {
					...state,
					pending: false,
					fulfilled: false,
					rejected: true,
					error: action.payload.error
				};
			default:
				return state;
		}
	};

	return (state = initialState, action) => {
		switch (action.type) {
			case requestType:
			case successType:
			case failureType:
				const key = mapActionToKey(action);
				if (typeof key !== 'string') {
					throw new Error('Expected key to be a string.');
				}
				return {
					...state,
					[key]: updatePagination(state[key], action, mapActionToPage)
				};
			default:
				return state;
		}
	};
}
