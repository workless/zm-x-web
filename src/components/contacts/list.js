import { h } from 'preact';
import { withAriaId } from '@zimbra/a11y';
import PureComponent from '../../lib/pure-component';
import SmartList from '../smart-list';
import { Popover, Icon } from '@zimbra/blocks';
import Item from '../menu-item';
import cx from 'classnames';
import { DIALOGS_RESTORE, DIALOGS_EXPORT, DIALOGS_IMPORT } from './constants';
import { callWith } from '../../lib/util';
import { setDataTransferJSON } from '@zimbra/util/src/data-transfer-manager';
import { getName, getPrimaryPhone, getPrimaryEmail } from '../../utils/contacts';
import style from './style';

const SORTS = [
	['firstName', 'First Name'],
	['lastName', 'Last Name'],
	['email', 'Email']
];


export default class ContactList extends PureComponent {
	doSort = (a, b) => {
		let field = this.state.sort;
		if (a.attributes[field]===b.attributes[field]) {
			return 0;
		}
		if (a.attributes[field] > b.attributes[field]) {
			return 1;
		}
		return -1;
	};

	setSortField = sort => {
		this.setState({ sort });
	};

	reverseSortDirection = () => {
		this.setState({
			sortDirection: this.state.sortDirection===-1 ? 1 : -1
		});
	};

	renderHeader = props => {
		if (this.props.header===false || this.props.ContactListHeader===false) return null;

		let Child = this.props.ContactListHeader || ContactListHeader;
		return (
			<Child
				{...props}
				sort={this.state.sort}
				sortDirection={this.state.sortDirection}
				setSortField={this.setSortField}
				reverseSortDirection={this.reverseSortDirection}
				showDialog={this.props.showDialog}
			/>
		);
	};

	renderContactListItem = ({ item, ...props }) => {
		let Child = this.props.ContactListItem || ContactListItem;
		if (this.props.renderBadge) props.renderBadge = this.props.renderBadge;
		return <Child {...props} contact={item} />;
	};

	render({ contacts, selected, onSelectionChange, ...props }, { sort, sortDirection }) {
		if (sort || sortDirection) {
			contacts = contacts.slice().sort(this.doSort);
			if (sortDirection===-1) contacts.reverse();
		}

		return (
			<SmartList
				class={props.class}
				items={contacts}
				selected={selected}
				onSelectionChange={onSelectionChange}
				renderItem={this.renderContactListItem}
				header={this.renderHeader}
				virtualized={contacts.length>=500}
				rowHeight={72}
			/>
		);
	}
}


class ContactListHeader extends PureComponent {

	handlePopoverToggle = (active) => {
		this.setState({ active });
	}

	closePopover = () => {
		this.setState({ active: false });
	}

	showRestoreContacts = () => {
		this.closePopover();
		this.props.showDialog(DIALOGS_RESTORE);
	}

	showImportContacts = () => {
		this.closePopover();
		this.props.showDialog(DIALOGS_IMPORT);
	}

	showExportContacts = () => {
		this.closePopover();
		this.props.showDialog(DIALOGS_EXPORT);
	}

	render({ actions, selected, allSelected, sort, sortDirection, setSortField, reverseSortDirection }, { active }) {
		return (
			<header class={style.toolbar}>
				<input type="checkbox" indeterminate={selected.length>0 && !allSelected} checked={allSelected} onClick={actions.toggleSelectAll} />

				{/*
					@TODO This should updated to use `ActionMenu`
				  https://github.com/Zimbra/zm-x-web/issues/82
				 */}
				<Popover
					active={active}
					text={
						<span class={style.inner}>
							<Icon name="ellipsis-h" />
							Actions
							<Icon name="angle-down" size="xs" />
						</span>
					}
					onToggle={this.handlePopoverToggle}
					anchor="end"
					class={style.menu}
					toggleClass={style.toggle}
					popoverClass={style.dropdown}
				>
					{ SORTS.map( ([type, name]) =>
						<Item class={style.item} iconClass={style.icon} icon={sort===type && 'check'} onClick={callWith(setSortField, type)}>Sort by {name}</Item>
					) }
					<Item class={style.item} iconClass={style.icon} icon={sortDirection===-1 && 'check'} onClick={reverseSortDirection}>Reverse Sort Order</Item>
					<hr />
					<Item class={style.item} iconClass={style.icon} onClick={this.showImportContacts}>Import...</Item>
					<Item class={style.item} iconClass={style.icon} onClick={this.showExportContacts}>Export...</Item>
					<hr />
					<Item class={style.item} iconClass={style.icon} href="/fix-duplicate-contacts">Fix Duplicates</Item>
					<Item class={style.item} iconClass={style.icon} onClick={this.showRestoreContacts}>Restore from backup</Item>
					<Item class={style.item} iconClass={style.icon}>Print All</Item>
				</Popover>
			</header>
		);
	}
}


@withAriaId('contact-li')
class ContactListItem extends PureComponent {
	handleClick = event => {
		let { onClick, contact } = this.props;
		onClick({ contact, event });
	};

	handleDragStart = e => {
		let { contact } = this.props;

		if (!this.props.selected) this.handleClick(e);

		setDataTransferJSON(e, {
			data: {
				type: 'contact',
				id: contact.id,
				contact
			},
			itemCount: this.context.store.getState().contacts.selected.length
		});
	};

	toggle = () => {
		this.props.onClick({ action: 'toggle' });
	};

	componentDidUpdate(prevProps) {
		let { selected, allSelected } = this.props,
			el = this.base;
		if (!allSelected && selected && !prevProps.selected) {
			el.focus();
		}
	}

	render({ contact, a11yId, selected, renderBadge }) {
		const tabindex = selected ? '0' : '-1';
		let attrs = contact.attributes || {};
		return (
			<li class={cx(style.contact, selected && style.selected)} tabindex={tabindex} draggable onDragStart={this.handleDragStart}>
				<span>
					<label for={a11yId} />
					<input id={a11yId} type="checkbox" readOnly checked={!!selected} tabindex={tabindex} onChange={this.toggle} />
				</span>
				<div onClick={this.handleClick}>
					<h4>{contact.fileAsStr || getName(attrs)}</h4>
					<h5>{getPrimaryEmail(contact)}</h5>
					<h6>{getPrimaryPhone(contact)}</h6>
					{ renderBadge && renderBadge(contact) }
				</div>
			</li>
		);
	}
}
