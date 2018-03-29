import { applyMiddleware, createStore, compose } from 'redux';
import { zimletReduxStoreEnhancer } from './enhancers';
import thunk from 'redux-thunk';
import promiseMiddleware from 'redux-promise-middleware';
import createReducer from './reducers';

const middlewares = [
	promiseMiddleware()
];

let composeEnhancers = compose;

if (process.env.NODE_ENV !== 'production') {
	// @FIXME because of circular references in the API client, this throws
	// an exception. The API client should be updated to fix
	// middlewares.push(require('redux-immutable-state-invariant').default());

	if (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
		composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
	}
}

export default function configureStore(initialState = {}, zimbra, additionalReducers) {
	const store = zimletReduxStoreEnhancer(createStore)(
		createReducer(additionalReducers),
		initialState,
		composeEnhancers(
			applyMiddleware(...middlewares, thunk.withExtraArgument(zimbra))
		)
	);


	if (module.hot) {
		// Enable Webpack hot module replacement for reducers
		module.hot.accept('./reducers', () => {
			const nextRootReducer = require('./reducers').default();
			store.replaceReducer(nextRootReducer);
		});
	}
	return store;
}
