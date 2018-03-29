import { h } from 'preact';
import cx from 'classnames';
import { displayAddress } from '../../utils/contacts';

import { Icon } from '@zimbra/blocks';
import Avatar from '../avatar';

import s from './style.less';

const ContactTag = ({ email, contact, fetchingContact, onRemove, focused }) => (
	<div class={cx(s.contactTag, focused && s.focused)}>
		<Avatar
			class={s.contactTagAvatar}
			email={email}
		/>
		<div class={s.contactTagName}>
			{contact ? displayAddress(contact): (fetchingContact ? '' : email)}
		</div>
		<div onClick={onRemove}><Icon name="times" class={s.close} /></div>
	</div>
);

export default ContactTag;
