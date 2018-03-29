import { graphql } from 'react-apollo';
import LogoutMutation from '../graphql/queries/logout.graphql';

// Logout is called directly on the client because it has no parameters or results.
// It is accessed by `withApollo` because `graphql` would immediately fetch the query on mount and cause a logout.

export default function withLogout({ name = 'logout' } = {}) {
	return graphql(LogoutMutation, {
		props: ({ mutate }) => ({
			[name]: mutate
		})
	});
}
