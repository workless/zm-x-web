import { graphql } from 'react-apollo';
import find from 'lodash/find';
import get from 'lodash/get';

import { MAIL_VIEW } from '../../constants/views';
import GetFolder from '../../graphql/queries/folders/get-folder.graphql';

// Some remote folders do not have a `view` attribute, and should be
// displayed as mail folders. This includes POP3 accounts.
export default function getMailFolders(config = {}) {
	return graphql(GetFolder, {
		options: {
			variables: {
				view: null
			}
		},
		props: ({ data }) => {
			if (data.error) {
				console.error('Error getting mail folder data', data.error);
			}
			const folders = get(data, 'getFolder.folders.0.folders');
			return {
				folders: folders &&
					folders.filter(
						f => !f.view || f.view === MAIL_VIEW
					),
				foldersError: get(data, 'error'),
				foldersLoading: get(data, 'loading'),
				inboxFolder: folders && find(folders, f => /^Inbox$/i.test(f.name)),
				refetchFolders: get(data, 'refetch')
			};
		},
		...config
	});
}
