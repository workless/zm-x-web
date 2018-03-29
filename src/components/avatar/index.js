import { h } from 'preact';
import { Icon } from '@zimbra/blocks';
import { memoize } from 'decko';
import md5 from 'tiny-js-md5';
import { getEmail } from '../../lib/util';
import { getName } from '../../utils/contacts';
import cx from 'classnames';
import style from './style';

const getAvatar = memoize(email => `https://www.gravatar.com/avatar/${md5(email.toLowerCase())}?s=200&d=blank`);

const EMPTY = {};

export default function Avatar({ showInitials=false, email, contact, mode, ...props }) {
	let attrs = contact && (contact.attributes || contact._attrs) || EMPTY,
		name = getName(attrs),
		initials = name && (name.match(/\b[A-Z]/g) || []).join('');

	email = getEmail(email || attrs.email);

	return (
		<div {...props} class={cx(style.avatar, mode==='contain' && style.contain, props.class)}>
			{ showInitials && initials ? (
				<span class={style.initials}>{initials}</span>
			) : (
				<Icon name="user" class={style.default} />
			) }
			<div class={style.inner} style={email ? { backgroundImage: `url(${getAvatar(email)})` } : {}} />
		</div>
	);
}
