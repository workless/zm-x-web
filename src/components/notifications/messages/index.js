import { h, Component } from 'preact';
import Markup from 'preact-markup';
import { Text, withText } from 'preact-i18n';

// TODO: Is this a block, or should it be merged upstream to `preact-i18n`?
@withText((props) => ({ markup: <Text {...props} /> }))
class MarkupText extends Component {
	render({ markup }) {
		return (
			<Markup markup={markup} trim={false} type="html" />
		);
	}
}

export const RenameMessage = ({ prevName, name }) => (
	<span><b>{prevName}</b> renamed to <b>{name}</b>.</span>
);

export const DeletedMessage = ({ name }) => (
	<span><b>{name}</b> deleted.</span>
);

export const CreatedMessage = ({ name }) => (
	<span><b>{name}</b> created.</span>
);

export const MovedMessage = ({ name, destName }) => (
	<span><b>{name}</b> moved to <b>{destName}</b>.</span>
);

export const MovedTopLevelMessage = ({ name }) => (
	<span><b>{name}</b> moved to the top level.</span>
);

export const OnlyEmptyFoldersDeletedMessage = ({ name }) => (
	<span>
		Only empty folders can be deleted. Please delete all contents of the <b>{name}</b> folder first.
	</span>
);

export const FolderAlreadyExistsMessage = ({ view, name }) => (
	<span>
		<MarkupText id={`toasts.folderExists.${view}`} fields={{ name }} />
	</span>
);

/**
 * Contacts
 */
export const ContactsRestoredMessage = ({ failure, restorePointName }) => (
	<span>
		<Text id={`toasts.restoreContacts.${failure ? 'failure' : 'success'}`} fields={{ name: restorePointName }} />
	</span>
);
