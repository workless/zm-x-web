import { h, Component } from 'preact';
import { getName } from '../../utils/contacts';
import cx from 'classnames';
import style from './style';

export default class ContactPickerContact extends Component {
	select = () => {
		let { contact, onClick } = this.props;
		onClick(contact);
	};

	render({ contact, selected }) {
		let attrs = contact.attributes || {};

		return (
			<div class={cx(style.contact, selected && style.selected, contact.inoperable && style.inoperable)} onClick={this.select}>
				<input type="checkbox" checked={selected} readOnly />
				<strong>{getName(attrs)}</strong>
				<em>{attrs.email}</em>
			</div>
		);
	}
}
