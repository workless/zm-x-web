import { h, Component } from 'preact';
import { Text, withText } from 'preact-i18n';
import includes from 'lodash/includes';
import { getEmail } from '../../lib/util';

import ShareInfoCard from '../share-info-card';
import AddressField from '../address-field';
import PermissionsSelect from './permissions-select';

import s from './style.less';

@withText('calendar.dialogs.share.emailAddressesPlaceholder')
export default class EmailShareInfoCard extends Component {
	isSelected = suggestion => {
		const email = getEmail(suggestion.email);
		return includes(this.props.aclEmails, email);
	};

	render({
		onEmailsToInviteChange,
		onInvitePermissionsChange,
		emailsToInvite,
		invitePermissions,
		emailAddressesPlaceholder
	}) {
		return (
			<ShareInfoCard
				title={
					<span>
						<Text id="calendar.dialogs.share.emailSelectLabel" />{' '}
						<PermissionsSelect
							value={invitePermissions}
							onChange={onInvitePermissionsChange}
							bold
							inline
							collapseLabel
						/>
					</span>
				}
			>
				<AddressField
					class={s.emailInput}
					placeholder={emailAddressesPlaceholder}
					value={emailsToInvite}
					onChange={onEmailsToInviteChange}
					wasPreviouslySelected={this.isSelected}
					previouslySelectedLabel="calendar.dialogs.share.addressFieldPreviouslySelected"
					formSize
				/>
			</ShareInfoCard>
		);
	}
}
