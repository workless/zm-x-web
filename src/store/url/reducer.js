import defaults from '../../config';
import pick from 'lodash/pick';
import { handleActions } from 'redux-actions';
import * as actionCreators from './actions';

// NOTE: The state is actually a URI not a URL.

const defaultSlugs = defaults.routes.slugs;

const initialLocation = pickLocation(window.location);

function pickLocation(obj) {
	return pick(obj, [ 'hash', 'host', 'hostname', 'href', 'origin', 'pathname', 'port', 'protocol', 'search' ]);
}

let anchor = document.createElement('a');
function urlToLocation(url) {
	anchor.href = url;
	return pickLocation(anchor);
}

const initialState = {
	location: initialLocation,
	view: getView(initialLocation.pathname),
	routeProps: {}
};

/**
 * Given a uri of either /{view}/restOfPath or /search/{view}/restOfPath, returns {view}
 *
 * @param {String} uri     A URI (no origin)
 * @returns {String}       The view portion of the path
 * @example
 *   getView('/someroute/foo') === 'someroute'
 *   getView('/search/someroute/foo') === 'someroute'
 */
function getView(uri = '') {
	let matched = uri.match(/^\/(?:search\/)?([^/]+)/),
		view = matched && matched[1];
	return defaultSlugs[view] || view || defaultSlugs.email;
}

export default handleActions({
	[actionCreators.setUrl]: (state, action) => {
		const location = urlToLocation(action.payload);
		return {
			...state,
			location,
			view: getView(location.pathname)
		};
	},
	[actionCreators.setRouteProps]: (state, action) => ({
		...state,
		routeProps: {
			...action.payload
		}
	})
}, initialState);
