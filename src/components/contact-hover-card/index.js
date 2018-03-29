import { h } from 'preact';
import PureComponent from '../../lib/pure-component';
import { Text } from 'preact-i18n';
import { configure } from '../../config';
import { Icon, Tooltip, ClickOutsideDetector } from '@zimbra/blocks';
import ZimletSlot from '../zimlet-slot';
import ContactCardMenu from '../contact-card-menu';
import Avatar from '../avatar';
import { serializeAddress } from '../../lib/util';
import { getPrimaryPhone, getPrimaryEmail, getJobDescription } from '../../utils/contacts';
import cx from 'classnames';
import wire from 'wiretie';
import style from './style';

const displayName = value => value.fullName || value.full || value.name || (value.address || value.email || '').split('@')[0];

@configure('routes.slugs')
export default class ContactHoverCard extends PureComponent {
	dismiss = () => {
		let { onDismiss } = this.props;
		if (onDismiss) onDismiss();
		else this.setState({ show: false });
	};

	showEdit = () => {
		this.setState({ edit: true });
	};

	hideEdit = () => {
		this.setState({ show: false, edit: false });
	};

	updateNow = () => {
		clearTimeout(this.timer);
		let show = this.props.visible===true;
		if (show!==this.state.show) {
			this.setState({ show });
		}
	};

	update({ immediate }) {
		clearTimeout(this.timer);
		if (immediate) {
			if (this.state.edit) {
				this.setState({ edit: false });
			}
			this.updateNow();
		}
		else {
			this.timer = setTimeout(this.updateNow, 300);
		}
	}

	componentDidMount() {
		this.update(this.props);
	}

	componentWillReceiveProps(props) {
		for (let i in props) if (props[i]!==this.props[i]) {
			this.update(props);
			break;
		}
	}

	componentWillUnmount() {
		clearTimeout(this.timer);
	}

	render({ immediate, visible, ...props }, { show, edit }) {
		return (immediate && visible || show || edit) ? (
			<ContactHoverCardDetails
				edit={edit}
				showEdit={this.showEdit}
				hideEdit={this.hideEdit}
				onDismiss={this.dismiss}
				{...props}
			/>
		) : null;
	}
}

@wire('zimbra', ({ address }) => ({
	results: ['search', {
		query: address,
		types: 'contact',
		limit: 1
	}]
}))
class ContactHoverCardDetails extends PureComponent {
	dismiss = () => {
		let { onDismiss } = this.props;
		if (onDismiss) onDismiss();
	};

	getInfo() {
		let { results, address, name } = this.props,
			contact = results && results[0],
			isEmpty = false;
		if (!contact) {
			isEmpty = true;
			contact = {};
		}

		let attrs = contact.attributes = contact.attributes || contact._attrs || {
			email: address,
			name: name || address.split('@')[0]
		};

		return {
			isEmpty,
			contact,
			name: displayName(attrs),
			email: getPrimaryEmail(contact),
			jobDescription: getJobDescription(attrs),
			phone: getPrimaryPhone(contact)
		};
	}

	// Prevent 2 cards from showing at once by dismissing any current open card:
	componentDidMount() {
		let prev = ContactHoverCard.current;
		if (prev && prev!==this && prev.dismiss) {
			prev.dismiss();
		}
		ContactHoverCard.current = this;
	}

	componentWillReceiveProps({ address }) {
		if (address!==this.props.address && this.state.showEdit) {
			this.setState({ showEdit: false });
		}
	}

	componentWillUnmount() {
		if (ContactHoverCard.current===this) {
			ContactHoverCard.current = null;
		}
	}

	render({ pending, results, slugs }) {
		pending = pending && !results;

		let { contact, isEmpty, name, email, jobDescription, phone } = this.getInfo();

		return (
			<ClickOutsideDetector onClickOutside={this.dismiss}>
				<Tooltip class={cx(style.contactCard, pending && style.loading)} visible position="bottom" anchor="left">
					<div class={style.details}>
						<h3>{name}</h3>
						<h4>{jobDescription}</h4>
						<dl>
							<dt><Icon name="envelope" /></dt>
							<dd><a href={'mailto:'+serializeAddress(email, name)}>{email}</a></dd>
						</dl>
						{ phone && (
							<dl>
								<dt><Icon name="mobile-phone" /></dt>
								<dd><a href={'tel:'+phone}>{phone}</a></dd>
							</dl>
						) }
						<dl>
							<dt><Icon name="search" /></dt>
							<dd>
								<a href={`/search/${slugs.email}?q=${encodeURIComponent(`to:${email} OR from:${email}`)}`}>
									<Text id="contacts.hoverCard.SEARCH">Search Emails</Text>
								</a>
							</dd>
						</dl>
						<ZimletSlot name="contact-hover-card-details" email={email} />
					</div>

					<Avatar class={style.avatar} email={email} contact={contact} />

					<footer class={style.footer}>
						<ContactCardMenu
							contact={contact}
							email={email}
							jobDescription={jobDescription}
							name={name}
							phone={phone}
							enableEdit={!isEmpty}
						/>
					</footer>
				</Tooltip>
			</ClickOutsideDetector>
		);
	}
}
