import format from 'date-fns/format';
import get from 'lodash-es/get';
import { NORMAL_PRIORITY } from '../../constants/tasks';

export function createTaskMutationVariables({
	inviteId,
	modifiedSequence,
	revision,
	userDisplayName,
	primaryAddress,
	name,
	folderId,
	dueDate,
	instances,
	priority = NORMAL_PRIORITY,
	notes,
	status,
	percentComplete
}) {

	const organizer = {
		address: primaryAddress,
		name: userDisplayName
	};

	dueDate = dueDate || get(instances, '[0].dueDate');
	const end = !dueDate ? {} : {
		allDay: true, // Tasks should always be all day
		end: {
			date: format(dueDate, 'YYYYMMDD')
		}
	};

	//fields only set when modifying a task
	let modifyFields = !inviteId ? {} : {
		id: inviteId,
		modifiedSequence,
		revision
	};

	let description = !notes  ? {} : {
		mimeParts: {
			contentType: 'multipart/alternative',
			mimeParts: [{
				contentType: 'text/plain',
				content: notes
			}, {
				contentType: 'text/html',
				content: '<html><body>' + notes.replace('\n', '<br />') + '</body></html>'
			}]
		}
	};

	return {
		task: {
			...modifyFields,
			message: {
				folderId,
				subject: name,
				invitations: {
					components: [
						{
							name,
							priority,
							percentComplete,
							status,
							organizer,
							...end,
							class: 'PUB',
							noBlob: true //this tell it to use description for notes instead of full mime parts
						}
					]
				},
				...description,
				emailAddresses: [{
					address: primaryAddress,
					name: userDisplayName,
					type: 'f'
				}]
			}
		}
	};
}

