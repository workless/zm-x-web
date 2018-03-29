import queryString from 'query-string';

export function getRouteProps(state) {
	return state.url.routeProps || {};
}

export function getSearchQuery(state) {
	const { q } = queryString.parse(state.url.location.search);
	return `${q || ''}`.trim();
}

export function getSearchEmail(state) {
	const { e } = queryString.parse(state.url.location.search);
	return `${e || ''}`.trim();
}

export function getSearchFolder(state) {
	const { folder } = queryString.parse(state.url.location.search);
	return `${folder || ''}`.trim();
}

export function getView(state) {
	return state.url.view;
}
