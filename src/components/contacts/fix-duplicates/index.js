import { h, Component } from 'preact';
import PureComponent from '../../../lib/pure-component';
import { Button, Icon } from '@zimbra/blocks';
import { route } from 'preact-router';
import ContactList from '../list';
import HelpButton from '../../help-button';
import DuplicateEditor from './editor';
import cx from 'classnames';
import wire from 'wiretie';
import { computeDuplicates, mergeDuplicateContacts } from './util';
import { pluck, getId } from '../../../lib/util';
import array from '@zimbra/util/src/array';
import { getName } from '../../../utils/contacts';
import style from './style';

@wire('zimbra', () => ({
	contacts: ['contacts.list', {
		all: true,
		limit: 1000
	}]
}), ({ contacts }) => ({
	createContact: contacts.create,
	deleteContact: contacts.delete
}))
export default class Contacts extends Component {
	static defaultProps = {
		contacts: []
	};

	state = {
		selected: [],
		completed: []
	};

	/** Immediately commit the merge of all exact duplicates. */
	mergeExact = () => {
		let exact = this.state.duplicates.filter( d => d.exactMatch===true );
		// eslint-disable-next-line no-alert
		if (confirm(`Merge ${exact.length} exact duplicates?`)) {
			exact.forEach( duplicate => {
				this.mergeContact(duplicate);
			});
		}
	};

	next = () => {
		let { duplicates, selected } = this.state,
			dupe = selected[0] && pluck(duplicates, 'id', selected[0]),
			next = duplicates[duplicates.indexOf(dupe) + 1];
		this.setSelection(getId(next));
	};

	close = () => {
		route('/contacts');
	};

	setSelection = selection => {
		selection = array(selection);
		this.setState({
			// force single selection
			selected: selection.slice(selection.length-1)
		});
	}

	/** Commit the merge of a given set of duplicates immediately. */
	mergeContact(duplicate) {
		if (typeof id==='string' || typeof id==='number') {
			duplicate = pluck(this.state.duplicates, 'id', duplicate);
		}
		let merged = {
			...duplicate,
			...mergeDuplicateContacts(duplicate.contacts),
			id: duplicate.id
		};
		return this.onSave({ duplicate, merged });
	}

	/** Save a deduplicated contact entry and delete the originals.
	*	@param {Object} options
	*	@param {Duplicate} options.duplicate	Original duplicate entry, used for removal of old duplicates and to update the list.
	*	@param {Object} options.merged			The already-merged new contact.
	 */
	onSave = ({ duplicate, merged }) => {
		let { createContact, deleteContact } = this.props;

		let newContact = Object.assign({}, merged);
		delete newContact.id;

		return createContact(newContact)
			.then( () => {
			})
			.then( () => Promise.all(
				duplicate.contacts.map(getId).map(deleteContact)
			))
			.then( () => {
				let { completed } = this.state;
				completed.push(getId(duplicate));
				this.setState({ completed });
				this.next();
			})
			.catch( err => {
				// @TODO error toast
				this.setState({ error: String(err && err.message || err) });
				console.error(err);
			});
	};

	onCancel = () => {
		this.setSelection([]);
	}

	computeDuplicates(contacts) {
		let duplicates = computeDuplicates(array(contacts));
		this.setState({ duplicates });
	}

	componentWillMount() {
		let { contacts } = this.props;
		if (contacts) this.computeDuplicates(contacts);
	}

	componentWillReceiveProps({ contacts }) {
		if (contacts!==this.props.contacts) {
			this.computeDuplicates(contacts);
		}
	}

	render({ pending }, { selected, completed, duplicates }) {
		if (!duplicates) pending = true;
		let selectedCount = selected ? selected.length : 0,
			view = selectedCount===1 && pluck(duplicates, 'id', selected[0]);

		if (view) {
			return (
				<DuplicateEditor
					listPosition={duplicates.indexOf(view)+1}
					listLength={duplicates.length}
					duplicate={view}
					next={this.next}
					onSave={this.onSave}
					onCancel={this.onCancel}
				/>
			);
		}

		let hasExactMatches = false;

		duplicates = duplicates.map( duplicate => {
			if (duplicate.exactMatch) {
				hasExactMatches = true;
			}

			if (completed.indexOf(getId(duplicate))!==-1) {
				duplicate = { ...duplicate, completed: true };
			}
			return duplicate;
		});

		return (
			<div class={style.fixDuplicates}>
				<header class={style.header}>
					<h2>Fix Duplicates</h2>
					<h4>Click on a contact below to view and merge duplicates:</h4>
				</header>

				{ pending ? (
					<Checking close={this.close} />
				) : !duplicates.length ? (
					<NoDuplicates close={this.close} />
				) : (
					<div class={style.inner}>
						<ContactListHeading contacts={duplicates} />

						<ContactList
							class={style.contactList}
							contacts={duplicates}
							selected={selected}
							onSelectionChange={this.setSelection}
							ContactListItem={ContactListItem}
							header={false}
						/>

						<footer class={style.footer}>
							<div class={style.buttons}>
								<Button onClick={this.mergeExact} disabled={!hasExactMatches}>Merge all Exact</Button>
								<Button onClick={this.close}>Close</Button>
							</div>
						</footer>
					</div>
				) }
			</div>
		);
	}
}


const Checking = ({ close }) => (
	<div class={style.inner}>
		<div class={style.message}>
			Please wait while we check for duplicates...
		</div>
		<footer class={style.footer}>
			<div class={style.buttons}>
				<Button onClick={close}>Close</Button>
			</div>
		</footer>
	</div>
);


const NoDuplicates = ({ close }) => (
	<div class={style.inner}>
		<div class={style.message}>
			No duplicates found.
		</div>
		<footer class={style.footer}>
			<div class={style.buttons}>
				<Button onClick={close}>Close</Button>
			</div>
		</footer>
	</div>
);


const ContactListHeading = ({ contacts }) => (
	<div class={style.tableHeading}>
		<span class={style.nameColumn}>
			Contacts ({contacts.length})
		</span>
		<span class={style.duplicatesColumn}>
			Duplicate Matches
			<HelpButton title="Match Types" more>
				<p><strong>EXACT</strong> matches include contacts who have identical information or cases where one contact has the same or information as another contact plus more details.</p>
				<p><strong>Similar</strong> matches include contacts whose information seem similar, so we cannot be sure that the contacts are the same person.</p>
			</HelpButton>
		</span>
	</div>
);


class ContactListItem extends PureComponent {
	handleClick = event => {
		let { onClick, contact } = this.props;
		onClick({ contact, event });
	};

	render({ contact, selected }) {
		return (
			<div class={cx(style.contact, selected && style.selected, contact.completed && style.completed)} onClick={this.handleClick}>
				<span class={style.nameColumn}>
					{getName(contact.attributes)}
				</span>
				<span class={style.duplicatesColumn}>
					{ contact.completed ? (
						<Icon name="check" />
					) : (
						`${contact.contacts.length} ${contact.exactMatch ? 'exact' : 'similar'}`
					) }
				</span>
			</div>
		);
	}
}
