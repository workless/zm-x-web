import { h, Component } from 'preact';
import { withText, Text } from 'preact-i18n';
import linkstate from 'linkstate';

import {
	getPublicGrant,
	getEmailGrants,
	addPublicGrant,
	removePublicGrant
} from '../../utils/acl';
import toSentence from '../../utils/to-sentence';
import { parseAddress } from '../../lib/util';

import NakedButton from '../naked-button';
import FormGroup from '../form-group';
import ShareInfoCard from '../share-info-card';
import EmailShareInfoCard from './email-share-info-card';

import s from './style.less';

function grantName(grant) {
	if (grant.address) {
		return grant.address;
	}
	if (grant.zimbraId) {
		const parsed = parseAddress(grant.zimbraId);
		return parsed.name || parsed.address;
	}
	return '<Unknown User>';
}

const ShareList = ({ grants, onManage }) => (
	<div class={s.shareList}>
		Shared with {toSentence(grants.map(grantName), { expandedLimit: 2 })} |{' '}
		<NakedButton onClick={onManage} linkColor>
			<Text id="buttons.change" />
		</NakedButton>
	</div>
);

@withText({
	notifyCopy: 'calendar.dialogs.share.notifyCopy'
})
export default class CalendarShareDialog extends Component {
	state = {
		enableEmail: false
	};

	handlePublicToggle = ({ target: { checked } }) => {
		const action = checked ? addPublicGrant : removePublicGrant;
		this.props.onACLChange(action(this.props.acl));
	};

	handleCopyLinkSuccess = () => {
		this.props.notify(this.props.notifyCopy);
	};

	componentWillMount() {
		this.setState({
			enableEmail: this.props.emailGrants && this.props.emailGrants.length > 0
		});
	}

	render(
		{
			acl,
			aclEmails,
			publicURL,
			onManageAccess,
			emailsToInvite,
			invitePermissions,
			onEmailsToInviteChange,
			onInvitePermissionsChange
			// onChangeEnableLinks,
			// enableLinks
		},
		{ enableEmail }
	) {
		const publicGrant = getPublicGrant(acl);
		const emailGrants = getEmailGrants(acl);

		return (
			<div>
				<FormGroup rows compact={!publicGrant}>
					<label>
						<input
							type="checkbox"
							onChange={this.handlePublicToggle}
							checked={!!publicGrant}
						/>{' '}
						<Text id="calendar.dialogs.share.enablePublicLabel" />
					</label>
					{publicGrant && (
						<ShareInfoCard
							title={<Text id="calendar.dialogs.share.publicSelectLabel" />}
							url={publicURL}
							onCopySuccess={this.handleCopyLinkSuccess}
						/>
					)}
				</FormGroup>
				{/*<FormGroup rows compact={!enableLinks}>
					<label>
						<input
							type="checkbox"
							onChange={onChangeEnableLinks}
							checked={enableLinks}
						/>{' '}
						<Text id="calendar.dialogs.share.generateLinksLabel" />
					</label>
					{enableLinks && (
						<div class={s.cardGroup}>
							<ShareInfoCard
								title={<Text id="calendar.dialogs.share.linksBrowserLabel" />}
								url={publicURL}
								resetable
							/>
						</div>
					)}
				</FormGroup>*/}
				<FormGroup rows compact={!enableEmail}>
					<label>
						<input
							type="checkbox"
							onChange={linkstate(this, 'enableEmail')}
							checked={enableEmail}
							disabled={emailGrants && emailGrants.length > 0}
						/>{' '}
						<Text id="calendar.dialogs.share.inviteEmailsLabel" />
					</label>
					{enableEmail && (
						<div class={s.cardGroup}>
							<EmailShareInfoCard
								aclEmails={aclEmails}
								emailsToInvite={emailsToInvite}
								invitePermissions={invitePermissions}
								onEmailsToInviteChange={onEmailsToInviteChange}
								onInvitePermissionsChange={onInvitePermissionsChange}
							/>
							{emailGrants &&
								emailGrants.length > 0 && (
								<ShareList grants={emailGrants} onManage={onManageAccess} />
							)}
						</div>
					)}
				</FormGroup>
			</div>
		);
	}
}
