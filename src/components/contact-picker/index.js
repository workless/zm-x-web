import { h, Component } from 'preact';
import { getId } from '../../lib/util';
import array from '@zimbra/util/src/array';
import ContactPickerDialog from './dialog';


/** Convert a GAL-style address to an emulated Contact entry (with composite generated ID) */
function addressToContact(addr) {
	// already a Contact entity
	if (addr.attributes) return addr;

	let { type, name, shortName, address } = addr;
	let id = `${type}::${shortName}::${address}`,
		fullName = name || shortName || address.split('@')[0],
		parts = fullName.split(' ');
	return {
		id,
		attributes: {
			email: address,
			fullName,
			firstName: parts[0],
			lastName: parts.slice(1).join(' ')
		}
	};
}


export default class ContactPicker extends Component {
	state = {
		selected: [],
		additionalContacts: [],
		folder: false
	};

	setSelected = selected => {
		this.setState({ selected });
	};

	setFolder = folder => {
		this.setState({ folder });
	};

	componentWillMount() {
		let contacts = array(this.props.contacts).map(addressToContact);
		this.setState({
			additionalContacts: contacts,
			selected: contacts.map(getId)
		});
	}

	render(props, { selected, additionalContacts, folder }) {
		return (
			<ContactPickerDialog
				{...props}
				additionalContacts={additionalContacts}
				selected={selected}
				setSelected={this.setSelected}
				folder={folder}
				setFolder={this.setFolder}
			/>
		);
	}
}
