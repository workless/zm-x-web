import { h, Component } from 'preact';
import { Text } from 'preact-i18n';
import linkstate from 'linkstate';
import cloneDeep from 'lodash/cloneDeep';

import { getEmail, isValidEmail } from '../../lib/util';
import {
	getEmailGrants,
	removeEmailGrant,
	addEmailGrants,
	addKeyGrant,
	updateGrant
} from '../../utils/acl';

import ModalDialog from '../modal-dialog';
import ModalToast from '../modal-toast';
import ShareMain from './main';
import ShareAccessSettings from './access-settings';

import s from './style.less';

function publicURL(calendar, accountInfoData) {
	return accountInfoData.accountInfo
		? `${accountInfoData.accountInfo.rest}/${encodeURIComponent(
			calendar.absFolderPath.replace('/', '')
		)}.html`
		: '';
}

export default class CalendarShareDialog extends Component {
	state = {
		acl: null,
		showAccessSettings: false,
		saveError: null,
		emailsToInvite: [],
		invitePermissions: 'r',
		notification: null,
		enableLinks: false
	};

	aclWithNewInvites = () => {
		const { accountInfoData } = this.props;
		const { acl, emailsToInvite, invitePermissions } = this.state;

		const emails = emailsToInvite
			.filter(c => isValidEmail(c.address))
			.map(c => c.address);
		return addEmailGrants(
			acl,
			emails,
			invitePermissions,
			accountInfoData.accountInfo.publicURL
		);
	};

	handleACLChange = nextACL => {
		this.setState({
			acl: nextACL
		});
	};

	handleRemoveEmailGrant = grant => {
		this.setState({
			acl: removeEmailGrant(this.state.acl, grant)
		});
	};

	handleUpdateGrant = nextGrant => {
		this.setState({
			acl: updateGrant(this.state.acl, nextGrant)
		});
	};

	handleEmailsToInviteChange = e => {
		this.setState({ emailsToInvite: e.value });
	};

	handleToggleAccessSettings = () => {
		this.setState({ showAccessSettings: !this.state.showAccessSettings });
	};

	handleSave = () => {
		const acl = this.aclWithNewInvites();

		this.setState({ pendingSave: true, saveError: null });
		this.props
			.onUpdateACL(this.props.calendar, acl)
			.then(() => {
				if (this.state.emailsToInvite.length > 0) {
					this.notify(
						`Shared with ${this.state.emailsToInvite.filter(c =>
							isValidEmail(c.address)
						).length} contacts.`
					);
				}

				this.setState({
					pendingSave: false,
					saveError: null,
					emailsToInvite: []
				});
			})
			.catch(e => {
				this.setState({ saveError: e });
				this.setState({ pendingSave: false });
			});
	};

	handleChangeEnableLinks = e => {
		if (e.target.checked) {
			this.setState(
				{
					acl: addKeyGrant(this.state.acl)
				},
				this.handleSave
			);
		}
		this.setState({ enableLinks: e.target.checked });
	};

	notify = notification => {
		this.setState({ notification });

		this.notificationTimeout = setTimeout(() => {
			this.setState({
				notification: null
			});
		}, 10000);
	};

	update(props) {
		const acl = props.calendar.acl
			? cloneDeep({
				...props.calendar.acl,
				grant: props.calendar.acl.grant || []
			})
			: { grant: [] };

		this.setState({ acl });
	}

	componentWillMount() {
		this.update(this.props);
	}

	componentWillReceiveProps(nextProps) {
		this.update(nextProps);
	}

	componentWillUnmount() {
		clearTimeout(this.notificationTimeout);
	}

	render(
		{ calendar, accountInfoData, onClose },
		{
			acl,
			showAccessSettings,
			pendingSave,
			saveError,
			emailsToInvite,
			invitePermissions,
			notification,
			enableLinks
		}
	) {
		const emailGrants = getEmailGrants(acl);
		const aclEmails = emailGrants.map(g => getEmail(g.address || g.zimbraId));
		const enableEmail = emailGrants && emailGrants.length > 0;

		return (
			<ModalDialog
				class={s.modal}
				title={
					showAccessSettings ? (
						<Text id="calendar.dialogs.share.settingsTitle" />
					) : (
						<Text
							id="calendar.dialogs.share.title"
							fields={{ name: calendar.name }}
						/>
					)
				}
				onAction={this.handleSave}
				onClose={onClose}
				actionLabel="buttons.save"
				cancelLabel="buttons.close"
				pending={pendingSave}
				disableEscape
			>
				{saveError ? (
					<ModalToast error>
						<Text id="error.genericInvalidRequest" />
					</ModalToast>
				) : (
					notification && <ModalToast>{notification}</ModalToast>
				)}
				{showAccessSettings ? (
					<ShareAccessSettings
						aclEmails={aclEmails}
						emailGrants={emailGrants}
						emailsToInvite={emailsToInvite}
						invitePermissions={invitePermissions}
						onEmailsToInviteChange={this.handleEmailsToInviteChange}
						onInvitePermissionsChange={linkstate(this, 'invitePermissions')}
						onRemoveEmailGrant={this.handleRemoveEmailGrant}
						onUpdateGrant={this.handleUpdateGrant}
						notify={this.notify}
					/>
				) : (
					<ShareMain
						accountInfoData={accountInfoData}
						acl={acl}
						aclEmails={aclEmails}
						emailGrants={emailGrants}
						emailsToInvite={emailsToInvite}
						enableLinks={enableLinks}
						invitePermissions={invitePermissions}
						enableEmail={enableEmail}
						onACLChange={this.handleACLChange}
						onEmailsToInviteChange={this.handleEmailsToInviteChange}
						onInvitePermissionsChange={linkstate(this, 'invitePermissions')}
						onChangeEnableLinks={this.handleChangeEnableLinks}
						onManageAccess={this.handleToggleAccessSettings}
						publicURL={publicURL(calendar, accountInfoData)}
						notify={this.notify}
					/>
				)}
			</ModalDialog>
		);
	}
}
