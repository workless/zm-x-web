import { h } from 'preact';
import format from 'date-fns/format';
import {
	getName,
	groupBy,
	printAddress,
	getAddressArray
} from '../../utils/contacts';
import Avatar from '../avatar';
import style from './style';
import cx from 'classnames';
import { Text } from 'preact-i18n';

export default function ContactCard({ contact }) {
	let attrs = (contact && contact.attributes) || {},
		isNew = contact && !contact.id;

	return (
		<div class={style.card}>
			<Avatar class={style.avatar} contact={contact} />
			<h2 class={style.name}>
				{getName(attrs) || (isNew && 'New Contact')}
				{attrs.nickname && (
					<sub class={cx(style.type, style.nickname)}>{attrs.nickname}</sub>
				)}
			</h2>
			<h4 class={style.work}>
				{attrs.jobTitle} {attrs.jobTitle && attrs.company && 'at'}{' '}
				{attrs.company}
			</h4>
			<section class={style.primaryContactInfo}>
				{['email', 'workEmail', 'homeEmail'].map(key =>
					groupBy(attrs, key).map(value => (
						<div class={style.email}>
							<a href={'mailto:' + value}>{value}</a>
							<span class={style.type}>
								<Text id={`contacts.edit.dropdown.email.${key}`} />
							</span>
						</div>
					))
				)}

				{[
					'phone',
					'mobile',
					'homePhone',
					'workPhone',
					'fax',
					'pager'
				].map(key =>
					groupBy(attrs, key).map(value => (
						<div class={style.phone}>
							<a href={'tel:' + value}>{value}</a>
							<span class={style.type}>
								<Text id={`contacts.edit.dropdown.phone.${key}`} />
							</span>
						</div>
					))
				)}

				{groupBy(attrs, 'im').map(value => (
					<div class={style.im}>
						<span>{value}</span>
						<span class={style.type}>
							<Text id={`contacts.edit.dropdown.chat`} />
						</span>
					</div>
				))}
			</section>

			{getAddressArray(contact).map(address => (
				<section class={style.addressInfo}>
					<span class={style.address}>{printAddress(address)}</span>
					<span class={style.type}>
						<Text id={`contacts.edit.dropdown.${address.type}`} />
					</span>
				</section>
			))}

			<section class={style.secondaryContactInfo}>
				{['birthday', 'anniversary'].map(key =>
					groupBy(attrs, key).map(value => (
						<div>
							<DateDisplay date={value} />
							<span class={style.type}>
								<Text id={`contacts.edit.dropdown.${key}`} />
							</span>
						</div>
					))
				)}

				{attrs.website && (
					<div class={style.website}>
						<a href={attrs.website} target="_blank" rel="noopener noreferrer">
							{attrs.website}
						</a>
						<span class={style.type}>
							<Text id={`contacts.edit.dropdown.website`} />
						</span>
					</div>
				)}
			</section>

			{attrs.notes && <section class={style.notes}>{attrs.notes}</section>}
		</div>
	);
}

function DateDisplay({ date }) {
	let parsed = new Date(date.replace(/-/g, '/'));
	return <time datetime={date}>{format(parsed, 'MMMM D, YYYY')}</time>;
}
