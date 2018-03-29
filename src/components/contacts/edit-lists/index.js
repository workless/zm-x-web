import { h, Component } from 'preact';
import { Button, ModalDialog } from '@zimbra/blocks';
import { Text } from 'preact-i18n';
import { callWith, pluck } from '../../../lib/util';
import CreateList from './create-list';
import wire from 'wiretie';
import style from './style';

@wire('zimbra', ({ selectedContacts, lastUpdated }) => ({
	contactGroups: ['contacts.listOnlyGroups', { lastUpdated } ],
	contactMembership: ['contacts.memberOf', (selectedContacts || []).map( ({ id }) => id), lastUpdated ]
}))
export default class EditLists extends Component {
	state = {
		newContactGroups: [],
		selected: []
	};

	save = () => {
		let contactGroups = this.state.selected.slice();
		this.props.onSave({ contactGroups });
	};

	close = () => {
		let { onClose } = this.props;
		if (onClose) onClose();
	};

	toggleItem = id => {
		let selected = this.state.selected.slice(),
			index = selected.indexOf(String(id));
		if (index<0) selected.push(String(id));
		else selected.splice(index, 1);
		this.setState({ selected });
	};

	addItem = (contactGroup) => {
		this.setState({
			newContactGroups: this.state.newContactGroups.concat(contactGroup)
		});
	};

	/**
	 * Get the intersection of groups that the selected contacts are all members of
	 */
	contactGroupsFromContacts = (selectedContacts=[], contactMembership=[]) => {
		let selectedGroups = (selectedContacts.length &&
			Object.keys((pluck(contactMembership, 'id', selectedContacts[0].id) || {}).memberOf || {}));

		for (let i=1; i < selectedContacts.length && selectedGroups.length; i++) {
			let memberOf = (pluck(contactMembership, 'id', selectedContacts[i].id) || {}).memberOf;
			selectedGroups = selectedGroups.filter( groupId => memberOf[groupId]);
		}

		return selectedGroups;
	}

	componentWillReceiveProps({ contactMembership, selectedContacts }) {
		if (contactMembership !== this.props.contactMembership || selectedContacts !== this.props.selectedContacts) {
			this.setState({ selected: this.contactGroupsFromContacts(selectedContacts, contactMembership) });
		}
	}

	render({ contactGroups }, { selected, newContactGroups }) {
		contactGroups = newContactGroups.concat(contactGroups || []);

		return (
			<ModalDialog overlayClass={style.backdrop} class={style.editLists} onClickOutside={this.close}>
				<div class={style.inner}>
					<header class={style.header}>
						<h2>
							<Text id="contacts.editLists.DIALOG_TITLE" />
						</h2>
						<Button styleType="floating" class={style.actionButton} onClick={this.close} />
					</header>

					<div class={style.content}>
						<div class={style.createItem}>
							<CreateList onCreate={this.addItem} />
						</div>
						{ contactGroups.map( ({ fileAsStr: name, id }) =>
							(<label class={style.item}>
								<input type="checkbox" checked={selected.indexOf(String(id))!==-1} onChange={callWith(this.toggleItem, id)} />
								<span>{name}</span>
							</label>)
						) }
					</div>

					<footer class={style.footer}>
						<Button styleType="primary" onClick={this.save}>
							<Text id="buttons.done">Done</Text>
						</Button>
						<Button onClick={this.close}>
							<Text id="buttons.cancel">Cancel</Text>
						</Button>
					</footer>
				</div>
			</ModalDialog>
		);
	}
}
