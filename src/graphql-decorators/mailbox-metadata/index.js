import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import get from 'lodash/get';

import { normalizeFoldersExpanded } from '../../utils/prefs';
import {
	getMailboxMetadata as getMailboxMetadataQuery,
	setMailboxMetadata as setMailboxMetadataQuery
} from '../../graphql/queries/mailbox-metadata.graphql';

export function getMailboxMetadata() {
	return graphql(getMailboxMetadataQuery, {
		options: { variables: {} },
		props: ({ data: { getMailboxMetadata: mailboxMetadata } }) => {
			const attrs = get(mailboxMetadata, 'meta.0._attrs');
			return {
				mailboxMetadata: attrs || {},
				folderTreeOpen: get(attrs, 'zimbraPrefCustomFolderTreeOpen'),
				smartFolderTreeOpen: get(attrs, 'zimbraPrefSmartFolderTreeOpen'),
				foldersExpanded: normalizeFoldersExpanded(
					get(attrs, 'zimbraPrefFoldersExpanded')
				),
				groupByList: get(attrs, 'zimbraPrefGroupByList'),
				messageListDensity: get(attrs, 'zimbraPrefMessageListDensity')
			};
		}
	});
}

export function setMailboxMetadata() {
	return graphql(setMailboxMetadataQuery, {
		props: ({
			ownProps: { mailboxMetadata: { __typename: _, ...mailboxMetadata } },
			mutate
		}) => ({
			setMailboxMetadata: attrs => {
				// All attributes must be passed to the server when modifying
				const nextAttrs = {
					...mailboxMetadata,
					...attrs
				};

				return mutate({
					variables: {
						attrs: nextAttrs
					},
					optimisticResponse: {
						__typename: 'Mutation',
						setMailboxMetadata: true
					},
					update: proxy => {
						// Write a fragment to the subsection of MailboxMetadata
						// with the changed attributes.
						proxy.writeFragment({
							id: `$MailboxMetadata:zwc:implicit.meta.0._attrs`,
							fragment: gql`
								fragment attrs on MailboxMetadataAttrs {
									${Object.keys(nextAttrs)}
								}
							`,
							data: {
								__typename: 'MailboxMetadataAttrs',
								...nextAttrs
							}
						});
					}
				});
			}
		})
	});
}
