import { graphql } from 'react-apollo';
import find from 'lodash/find';
import get from 'lodash/get';

import GetFolder from '../../graphql/queries/folders/get-folder.graphql';

export default function getRootFolders(config = {}) {
	return graphql(GetFolder, {
		props: ({ data }) => {
			const folders = get(data, 'getFolder.folders.0.folders');
			return {
				folders,
				foldersError: get(data, 'error'),
				foldersLoading: get(data, 'loading'),
				inboxFolder: folders && find(folders, f => /^Inbox$/i.test(f.name)),
				refetchFolders: get(data, 'refetch')
			};
		},
		...config
	});
}
