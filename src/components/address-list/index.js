import { h, Component } from 'preact';
import ZimletSlot from '../zimlet-slot';
import cx from 'classnames';
import ContactHoverCard from '../contact-hover-card';
import style from './style';

export default function AddressList({ type, addresses, showEmail, bold, wrap = true, className }) {
	if (!addresses || !addresses.length) return;

	let list = (
		<span class={cx(style.addresses, bold && style.bold)}>
			{addresses.map(address => <Sender type={type} address={address} showEmail={showEmail} />)}
		</span>
	);

	if (wrap !== false) {
		return (
			<div class={cx(style.addressList, style['addresses-' + type], className)}>
				{type !== 'from' && <span class={style.addressType}>{type}</span>}
				{list}
			</div>
		);
	}

	return list;
}

class Sender extends Component {
	handleMouseOver = () => {
		this.setState({ hover: true });
	};

	handleMouseOut = () => {
		this.setState({ hover: false });
	};

	render({ address, showEmail }, { hover }) {
		let email = address.address || address.email,
			name = address.name || address.shortName || String(email).split('@')[0];

		return (
			<span
				class={style.address}
				onMouseOver={this.handleMouseOver}
				onMouseOut={this.handleMouseOut}
			>
				<ZimletSlot name="sender-list-item" email={email} />
				<span class={style.addressName} title={address.address}>
					{name}
				</span>
				{showEmail && (
					<span class={style.addressDetail}>&lt;{address.address}&gt;</span>
				)}

				{hover != null && (
					<ContactHoverCard
						address={address.address || address.email || address}
						name={name}
						visible={hover}
					/>
				)}
			</span>
		);
	}
}
