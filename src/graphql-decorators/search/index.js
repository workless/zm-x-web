import { graphql } from 'react-apollo';
import { capitalizeFirstLetter } from '../../lib/util';
import last from 'lodash/last';
import get from 'lodash/get';

import Search from '../../graphql/queries/search/search.graphql';

const TYPE_MAP = {
	conversation: 'conversations',
	message: 'messages',
	contact: 'contacts',
	appointment: 'appointments',
	task: 'tasks',
	wiki: 'wikis',
	document: 'documents'
};

function mergeResults(prev, next, type) {
	return next.search[type]
		? [...prev.search[type], ...next.search[type]]
		: prev.search[type];
}

export default function withSearch(_config = {}) {
	const { name = 'search', ...config } = _config;

	return graphql(Search, {
		props: ({
			ownProps,
			data: { error, fetchMore, loading, refetch, search } = {}
		}) => ({
			[name]: search,
			[`${name}Error`]: error,
			[`${name}Loading`]: loading,
			[`refetch${capitalizeFirstLetter(name)}`]: refetch,
			[`${name}LoadNext`]: () => {
				const options =
					typeof config.options === 'function'
						? config.options(ownProps)
						: config.options;
				const lastItem = last(get(search, TYPE_MAP[options.variables.types]));

				return fetchMore({
					variables: {
						query: Search,
						...options.variables,
						cursor: {
							id: get(lastItem, 'id'),
							sortVal: get(lastItem, 'sortField')
						}
					},
					updateQuery: (previousResult, { fetchMoreResult }) => ({
						...fetchMoreResult,
						search: {
							...fetchMoreResult.search,
							contacts: mergeResults(
								previousResult,
								fetchMoreResult,
								'contacts'
							),
							messages: mergeResults(
								previousResult,
								fetchMoreResult,
								'messages'
							),
							conversations: mergeResults(
								previousResult,
								fetchMoreResult,
								'conversations'
							)
						}
					})
				});
			}
		}),
		...config
	});
}
