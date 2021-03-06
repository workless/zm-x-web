import { h } from 'preact';
import { Text } from 'preact-i18n';
import { createTaskMutationVariables } from './util';
import format from 'date-fns/format';
import withAccountInfo from '../../graphql-decorators/account-info';
import { getPrimaryAccountName, getPrimaryAccountAddress } from '../../utils/account';
import { FoldersQuery, TaskCreateMutation } from '../../graphql/queries/tasks.graphql';
import get from 'lodash-es/get';
import { graphql, compose } from 'react-apollo';

export default function withCreateTask() {
	return compose(
		withAccountInfo(({ data: { accountInfo } }) => ({
			userDisplayName: accountInfo && getPrimaryAccountName(accountInfo),
			primaryAddress: accountInfo && getPrimaryAccountAddress(accountInfo)
		})),
		graphql(TaskCreateMutation, {
			props: ({ ownProps: { notify, userDisplayName, primaryAddress }, mutate }) => ({
				createTask: ( createTaskInput ) => {
					const mutationVariables = createTaskMutationVariables({
						userDisplayName,
						primaryAddress,
						...createTaskInput
					});
					return mutate({
						variables: mutationVariables,
						optimisticResponse: {
							createTask: {}
						},
						update: (cache) => {
							const data = cache.readQuery({ query: FoldersQuery });

							const { tasks: { tasks } } = data.taskFolders.find(({ id }) => id === createTaskInput.folderId);

							const component = get(mutationVariables, 'task.message.invitations.components[0]');

							tasks.unshift({
								...component,
								folderId: get(mutationVariables, 'task.message.folderId'),
								percentComplete: component.percentComplete || '',
								date: '',
								excerpt: get(component, 'description[0]._content') || '',
								id: '',
								modifiedSequence: '',
								revision: '',
								instances: [{
									dueDate: get(component, 'end.date') && +format(component.end.date, 'x') || '',
									tzoDue: '',
									__typename: 'Instance'
								}],
								inviteId: '',
								__typename: 'CalendarItemHitInfo'
							});

							cache.writeQuery({ query: FoldersQuery, data });
						},
						refetchQueries: [
							{
								query: FoldersQuery
							}
						]
					}).then((data) => {
						notify({
							message: <Text id="tasks.notifications.addTask" />
						});
						return data;
					});
				}
			})
		})
	);
}
