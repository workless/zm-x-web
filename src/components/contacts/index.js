import { h, Component } from 'preact';
import { route } from 'preact-router';
import { Text } from 'preact-i18n';
import MenuItem from '../menu-item';
import Sidebar from '../sidebar';
import FolderList from '../folder-list';
import ContactGroupsList from '../folder-list/contact-groups-list';
import ContactList from './list';
import CreateList from './edit-lists/create-list';
import ExportContacts from './export-contacts';
import ImportContactsFromFile from './import-contacts/from-file';
import ContactEditor from './editor';
import ContactDetails from './contact-details';
import ContactsToolbar from './toolbar';
import cx from 'classnames';
import { connect } from 'preact-redux';
import { configure } from '../../config';
import * as contactsActionCreators from '../../store/contacts/actions';
import { openModalCompose } from '../../store/email/actions';
import { getAttachmentPreviewVisibility } from '../../store/attachment-preview/selectors';
import { setPreviewAttachment } from '../../store/attachment-preview/actions';
import wire from 'wiretie';
import { getId, pluck, callWith } from '../../lib/util';
import array from '@zimbra/util/src/array';
import { getDataTransferJSON } from '@zimbra/util/src/data-transfer-manager';
import style from './style';
import RestoreContacts from './restore-contacts';
import AssignToLists from './edit-lists';
import SelectedContactsActions from './selected-contacts-actions';
import { DIALOGS_RESTORE, DIALOGS_EXPORT, DIALOGS_IMPORT, DIALOGS_ASSIGN_TO_LISTS } from './constants';
import get from 'lodash-es/get';
import { CONTACTS_VIEW } from '../../constants/views';
import withMediaQuery from '../../enhancers/with-media-query';
import { minWidth, screenMd } from '../../constants/breakpoints';

/** Used with createStateUpdater */
const toggle = v => !v;


/** Returns a wiretie method call descriptor that fetches contacts for a folder/list. */
function getContactsMethod({ folder, lastUpdated }) {
	// "group:123" - strip "group:" from url & fetch ContactGroup entity:
	if (/^group:/.test(folder)) {
		return ['contacts.read', folder.substring(6), { lastUpdated }];
	}
	// Folder listing but without ContactGroup entities
	return ['contacts.listNoGroups', {
		folder: (folder || '').replace(/^in/,'') || 'Contacts',
		limit: 1000,
		lastUpdated
	}];
}

@withMediaQuery(minWidth(screenMd), 'matchesScreenMd')
@configure({ urlSlug: 'routes.slugs.contacts' })
@connect((state) => ({
	selected: get(state, 'contacts.selected', []),
	lastUpdated: get(state, 'contacts.lastUpdated'),
	matches: null,
	isAttachmentViewerOpen: getAttachmentPreviewVisibility(state)
}), {
	...contactsActionCreators,
	openModalCompose,
	closeAttachmentViewer: setPreviewAttachment
})
@wire('zimbra', props => ({
	contacts: getContactsMethod(props)
}), ({ contacts }) => ({
	trashContacts: contacts.trash,
	deleteContacts: contacts.delete,
	moveContacts: contacts.move,
	updateContactMembership: contacts.updateMembership
}))
export default class Contacts extends Component {
	static defaultProps = {
		folders: [],
		contacts: []
	};

	createNewContact() {
		return {
			attributes: {}
		};
	}

	getFolderBadge = folder => folder.name==='Contacts' && folder.count;

	getFolderName = folder => String(folder.name).toLowerCase() === 'trash' ? <Text id="folderlist.deleted_contacts">Deleted Contacts</Text> : folder.name;

	contactsUpdated = () => {
		this.props.setLastUpdated();
		this.closeContactEditor();
	};

	handleContactListDrop = e => {
		let data = getDataTransferJSON(e, 'contact'),
			list = e.targetList,
			type = e.targetType;
		if (data) {
			if (type==='contactGroup') {
				this.assignSelectedContactsToList({ contactGroups: list.id, operation: '+' });
			}
			else {
				this.moveSelectedContacts({ folder: list });
			}
		}
	};

	setSelection = (selection) => {
		if (this.state.dialog) {
			this.setState({
				dialog: null
			});
		}
		if (this.props.isAttachmentViewerOpen) this.props.closeAttachmentViewer();
		this.props.setSelection(selection);
	};

	// Create a function that updates a given state property to the given value (-mutator result)
	createStateUpdater = (key, value) => () => {
		this.setState({
			[key]: typeof value==='function' ? value(this.state[key]) : value
		});
	};

	closeContact = () => {
		this.props.closeAttachmentViewer();
		this.setSelection([]);
	};

	closeContactEditor = () => {
		this.cancel();
		if (this.props.contact==='new') {
			route(this.props.url.replace(/\/new$/, ''), true);
		}
	};

	createContact = () => {
		route(`/${this.props.urlSlug}/${this.props.folder ? (this.props.folder + '/') : ''}new`);
	};

	cancel = this.createStateUpdater('edit', false);
	toggleEdit = this.createStateUpdater('edit', toggle);

	// Show a named dialog.
	showDialog = dialog => {
		this.setState({ dialog });
	};

	// Hide the named dialog, or whatever dialog is currently showing.
	hideDialog = dialog => {
		if (dialog==null || this.state.dialog===dialog) {
			this.showDialog(null);
		}
	};

	composeEmailForSelectedContacts = () => {
		let { contacts, selected } = this.props;
		let to = contacts.filter( contact => (
			selected.indexOf(getId(contact))!==-1 && contact.attributes && contact.attributes.email
		))
			.map( contact => ({
				address: contact.attributes.email.replace(/(^.+<\s*|\s*>\s*$)/g, ''),
				full: `${contact.attributes.firstName || ''} ${contact.attributes.lastName || ''}`,
				shortName: contact.attributes.firstName
			}) );
		openModalCompose({
			mode: 'mailTo',
			message: {
				to
			}
		});
	};

	assignSelectedContactsToList = ({ contactGroups, operation }) => {
		let { updateContactMembership, selected, lastUpdated } = this.props;
		this.hideDialog(DIALOGS_ASSIGN_TO_LISTS);
		if (!selected.length) return;
		updateContactMembership(selected, contactGroups, operation, lastUpdated).then(this.contactsUpdated);
	};

	moveSelectedContacts = ({ folder }) => {
		let { moveContacts, selected } = this.props;
		if (!selected.length) return;
		moveContacts(selected, folder).then(this.contactsUpdated);
	};

	deleteSelectedContacts = () => {
		let { folder, trashContacts, deleteContacts, selected, setSelection } = this.props,
			op = folder==='Trash' ? deleteContacts : trashContacts;
		if (!selected.length) return;
		op(selected).then( () => {
			setSelection([]);
			this.contactsUpdated();
		});
	};

	componentDidMount() {
		let { contact, selected } = this.props;
		if (contact && contact!=='new' && !selected.length) {
			this.setSelection(array(getId(contact)), false);
		}
	}

	componentWillReceiveProps({ selected, contacts, contact, url }, { edit }) {
		let id = getId(contact);

		if (edit && selected[0]!==this.props.selected[0]) {
			this.setState({ edit: false });
		}

		if (id==='new') {
			if (this.props.contact==='new') {
				// "new" unchanged but selection change --> wipe /new  (eg: user clicked on contact while editing)
				if (selected[0] && selected[0]!==this.props.selected[0]) {
					route(url.replace(/\/new$/, ''), true);
				}
			}
			else if (selected[0]) {
				// navigated to /new, clear selection
				this.setSelection([], false);
			}
		}
		else if (id && id!==getId(this.props.contact) && id!==getId(selected[0])) {
			// /contacts/:contact value changed, make that the selection
			this.setSelection(array(id), false);
		}

		// The selection contains an ID for which there is no longer a contact, so clear it:
		if (selected[0] && !pluck(contacts, 'id', selected[0])) {
			this.setSelection([], false);
		}
	}

	render({ folder, contact, contacts, pending, selected, lastUpdated, urlSlug, isAttachmentViewerOpen, matchesScreenMd }, { edit, dialog }) {
		let selectedCount = selected ? selected.length : 0,
			isNew = !selectedCount && contact==='new',
			view = selectedCount===1 && pluck(contacts, 'id', selected[0]);

		if (edit) {
			this.props.closeAttachmentViewer();
		}

		if (isNew) {
			view = this.createNewContact();
			selected = [];
		}

		return (
			<div class={cx(style.contacts, pending && style.loading)}>
				<Sidebar header={!matchesScreenMd} inlineClass={style.sidebar}>
					{matchesScreenMd
						? (
							<div class={style.sidebarHeader}>
								<a class={style.createNew} href={`/${urlSlug}/${folder ? (folder+'/') : ''}new`}>New Contact</a>
							</div>
						)
						: (
							<div class={style.sidebarSectionHeader}>
								<span class={style.sidebarSectionHeaderIcon} />
								Contacts
							</div>
						)
					}
					<FolderList
						indexFolderName="Contacts"
						class={style.folders}
						urlSlug={urlSlug}
						view={CONTACTS_VIEW}
						dropEffect="move"
						onDrop={this.handleContactListDrop}
						badgeProp={this.getFolderBadge}
						folderNameProp={this.getFolderName}
						specialFolderList={['contacts', 'trash']}
					/>
					<div class={style.contactGroups}>
						<ContactGroupsList urlSlug={urlSlug} urlPrefix="group:" lastUpdated={lastUpdated} onDrop={this.handleContactListDrop} dropEffect="copy" />
						{matchesScreenMd &&
							<CreateList class={style.createContactGroup} onCreate={this.contactsUpdated} />
						}
					</div>
				</Sidebar>

				<ContactList
					class={cx(style.contactList, isAttachmentViewerOpen && style.attachmentViewerOpen)}
					contacts={(contacts.length || !pending) && contacts}
					selected={selected}
					onSelectionChange={this.setSelection}
					showDialog={this.showDialog}
				/>

				<div class={cx(style.readPane, isAttachmentViewerOpen && style.attachmentViewerOpen)}>
					{ view ? (
						isNew || edit ? (
							<ContactEditor
								folder={folder}
								contact={view}
								isNew={isNew}
								showCard={false}
								showHeader
								onSave={this.contactsUpdated}
								onCancel={this.closeContactEditor}
							/>
						) : (
							<div class={style.inner}>
								<div class={style.toolbar}>
									<MenuItem icon="pencil" onClick={this.toggleEdit}>
										<Text id="contacts.modalEdit.TITLE" />
									</MenuItem>
									<MenuItem icon="list" onClick={callWith(this.showDialog, DIALOGS_ASSIGN_TO_LISTS)}>
										<Text id="contacts.editLists.DIALOG_TITLE" />
									</MenuItem>
									<MenuItem icon="trash" onClick={this.deleteSelectedContacts}>
										<Text id="buttons.delete" />
									</MenuItem>
									<MenuItem icon="close" class={style.alignRight} onClick={this.closeContact} />
								</div>
								<ContactDetails
									folder={folder}
									contact={view}
									onSave={this.contactsUpdated}
								/>
							</div>
						)
					) : selectedCount===0 ? (
						<div class={style.selectedContacts}>
							Choose a contact to view or update.
						</div>
					) : selectedCount>1 &&
						<SelectedContactsActions
							selectedCount={selectedCount}
							totalCount={contacts.length}
							onCompose={this.composeEmailForSelectedContacts}
							onAssignToLists={callWith(this.showDialog, DIALOGS_ASSIGN_TO_LISTS)}
							onDelete={this.deleteSelectedContacts}
							showDialog={this.showDialog}
						/>
					}
				</div>

				{ dialog===DIALOGS_RESTORE && (
					<RestoreContacts onClose={callWith(this.hideDialog, DIALOGS_RESTORE)} />
				) }

				{ dialog===DIALOGS_EXPORT && (
					<ExportContacts onClose={callWith(this.hideDialog, DIALOGS_EXPORT)} />
				) }

				{ dialog===DIALOGS_IMPORT && (
					<ImportContactsFromFile onClose={callWith(this.hideDialog, DIALOGS_IMPORT)} />
				) }

				{ dialog===DIALOGS_ASSIGN_TO_LISTS &&
					<AssignToLists
						selectedContacts={contacts.filter( c => selected.indexOf(getId(c))!==-1 )}
						onSave={this.assignSelectedContactsToList}
						onClose={callWith(this.hideDialog, DIALOGS_ASSIGN_TO_LISTS)}
						lastUpdated={lastUpdated}
					/>
				}
				<ContactsToolbar onCompose={this.createContact} />
			</div>
		);
	}
}
