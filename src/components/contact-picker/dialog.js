import { h, Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { Button, Select, Option, ModalDialog } from '@zimbra/blocks';
import { getId, munge, pluck } from '../../lib/util';
import { getName } from '../../utils/contacts';
import ContactPickerContact from './contact';
import cx from 'classnames';
import wire from 'wiretie';
import style from './style';


const getContactEmail = contact => contact && contact.attributes && contact.attributes.email;


@wire('zimbra', ({ folder }) => ({
	contacts: ['contacts.listNoGroups', {
		folder,
		limit: 1000
	}],
	folders: ['folders.list', {
		view: 'contact',
		root: false
	}]
}))
export default class ContactPickerDialog extends Component {
	contactsById = {};

	close = () => {
		this.props.onClose();
	};

	save = () => {
		let { selected, onSave } = this.props;
		onSave(selected.map(this.getContact));
		this.close();
	};

	getContact = id => {
		if (id in this.contactsById) return this.contactsById[id];

		let contacts = [].concat(this.props.contacts || [], this.props.additionalContacts || []);
		return pluck(contacts, 'id', id);
	};

	selectContact = contact => {
		let { selected, setSelected } = this.props,
			id = getId(contact);
		if (selected.indexOf(id)===-1) {
			selected = selected.concat(id);
			this.contactsById[id] = contact;
		}
		else {
			selected = selected.filter( c => c!==id );
		}
		setSelected(selected);
	};

	setQuery = e => {
		this.setState({ query: e.target.value });
	};

	setFolder = e => {
		this.props.setFolder(e.value);
	};

	isSelected = contact => this.props.selected.indexOf(getId(contact))!==-1;

	matchesQuery = contact => {
		let ctx = munge([getContactEmail(contact), getName(contact.attributes)].join(' '));
		return ctx.indexOf(munge(this.state.query))!==-1;
	};

	renderContact = contact => (
		<ContactPickerContact
			contact={contact}
			selected={this.props.selected.indexOf(getId(contact))!==-1}
			onClick={this.selectContact}
		/>
	);

	renderFolder = folder => (
		<Option value={String(folder.id)} title={folder.name} iconPosition="right" />
	);

	render({ contacts, field, pending, selected, folder, folders }, { query }) {
		contacts = [].concat(contacts || []).filter(getContactEmail);
		if (query) contacts = contacts.filter(this.matchesQuery);

		// Add any items filtered out by the selection at the bottom:
		let more;
		let diff = selected.length - contacts.filter(this.isSelected).length;
		if (diff>0) {
			let visibleIds = contacts.map(getId);
			more = [
				<div class={style.divider}>
					<Text id="contacts.picker.ADDITIONAL_SELECTED_ITEMS" plural={diff} fields={{ count: diff }} />
				</div>
			].concat(
				selected.filter( id => visibleIds.indexOf(id)===-1 )
					.map( id => this.renderContact({ ...this.getContact(id), inoperable: true }) )
			);
		}

		return (
			<ModalDialog overlayClass={style.backdrop} class={cx(style.dialog, style.scrollable)} onClickOutside={this.close}>
				<div class={style.inner}>
					<header class={style.header}>
						<h2><Text id="contacts.picker.DIALOG_TITLE" /></h2>

						<p class={style.description}>
							<Text id="contacts.picker.DESCRIPTION" fields={{ field }} />
						</p>

						<Button styleType="floating" class={style.actionButton} onClick={this.close} />

						<div class={style.query}>
							<Localizer>
								<input class={style.query} placeholder={<Text id="contacts.picker.SEARCH_PLACEHOLDER" />} value={query} onInput={this.setQuery} />
							</Localizer>
						</div>

						<div class={style.changeFolder}>
							<Select class={style.select} iconPosition="right" anchor="left" value={folder} onChange={this.setFolder}>
								<Option value={false} title={<Text id="contacts.picker.ALL_CONTACTS" />} iconPosition="right" />
								{ (folders || []).map(this.renderFolder) }
							</Select>
						</div>
					</header>

					<div class={style.content}>
						{ contacts.map(this.renderContact) }
						{more}
					</div>

					<footer class={style.footer}>
						<Button styleType="primary" onClick={this.save} disabled={pending}>
							<Text id="contacts.picker.DONE_BUTTON" />
						</Button>
						<Button onClick={this.close}>
							<Text id="buttons.cancel" />
						</Button>

						<span class={style.selectionState}>
							<Text id="contacts.picker.NUM_SELECTED" plural={selected.length} fields={{ count: selected.length }} />
						</span>
					</footer>
				</div>
			</ModalDialog>
		);
	}
}
