import { h, Component } from 'preact';
import { connect } from 'preact-redux';
import { bindActionCreators } from 'redux';
import { Text } from 'preact-i18n';
import wire from 'wiretie';
import { graphql } from 'react-apollo';
import mapValues from 'lodash-es/mapValues';
import isEmpty from 'lodash-es/isEmpty';
import isEqual from 'lodash-es/isEqual';
import findIndex from 'lodash-es/findIndex';
import find from 'lodash-es/find';
import PrefCalendarWorkingHoursMutation from '../../graphql/queries/preferences/calendar/working-hours-mutation.graphql';
import PrefCalendarFirstDayOfWeek from '../../graphql/queries/preferences/calendar/first-day-of-week-mutation.graphql';
import ModifyIdentityMutation from '../../graphql/queries/preferences/identity/modify-identity-mutation.graphql';
import PreferencesQuery from '../../graphql/queries/preferences/preferences.graphql';
import AddSignatureAccountMutation from '../../graphql/queries/accounts/account-add-signature-mutation.graphql';
import ModifySignatureAccountMutation from '../../graphql/queries/accounts/account-modify-signature-mutation.graphql';
import DeleteSignatureAccountMutation from '../../graphql/queries/accounts/account-delete-signature-mutation.graphql';
import AddExternalAccountMutation from '../../graphql/queries/accounts/account-add-external-mutation.graphql';
import ModifyExternalAccountMutation from '../../graphql/queries/accounts/account-modify-external-mutation.graphql';
import accountInfo from '../../graphql-decorators/account-info/normalized-identities';
import {
	FIELD_TYPES,
	VIEWING_EMAIL_SETTINGS,
	WRITING_EMAIL_SETTINGS,
	ACCOUNTS_SETTINGS,
	VACATION_RESPONSE_SETTINGS,
	FILTERS_SETTINGS,
	BLOCKED_ADDRESSES_SETTINGS,
	SECURITY_AND_ACTIVITY_SETTINGS,
	CALENDAR_AND_REMINDERS_SETTINGS,
	FIELD_TYPE_METHODS,
	SETTINGS_ID_TO_CONFIG
} from '../settings/constants';
import { empty, deepClone } from '../../lib/util';
import mailPort from '../../utils/mail-port';
import { toggle, show } from '../../store/settings/actions';
import { loadFolders, createFolder } from '../../store/folders/actions';
import { getFolders } from '../../store/folders/selectors';
import {
	loadMailboxMetadata,
	loadWhiteBlackList,
	loadFilterRules
} from '../../store/email/actions';
import Settings from '../settings';
import { Button, Icon } from '@zimbra/blocks';
import cx from 'classnames';
import style from './style.less';
import withCommandHandlers from '../../keyboard-shortcuts/with-command-handlers';

const settingsConfigs = [
	VIEWING_EMAIL_SETTINGS,
	WRITING_EMAIL_SETTINGS,
	ACCOUNTS_SETTINGS,
	VACATION_RESPONSE_SETTINGS,
	FILTERS_SETTINGS,
	BLOCKED_ADDRESSES_SETTINGS,
	SECURITY_AND_ACTIVITY_SETTINGS,
	CALENDAR_AND_REMINDERS_SETTINGS
];
const mapSettingsFieldConfig = (state, { type, key, defaultValue, toJS }) => {
	const preferenceValue = FIELD_TYPE_METHODS[type].selector(state, key);
	const preferenceValueOrDefault = !empty(preferenceValue)
		? preferenceValue
		: defaultValue;
	return toJS ? toJS(preferenceValueOrDefault) : preferenceValueOrDefault;
};

@wire('zimbra', null, zimbra => ({
	importExternalAccountData: zimbra.mailbox.importExternalAccountData
}))
@connect(
	state => ({
		allFolders: getFolders(state, 'all'),
		visible: state.settings.visible,
		persistedSettings: settingsConfigs.reduce(
			(memo, settingsConfig) => ({
				...memo,
				[settingsConfig.id]: mapValues(
					settingsConfig.fields,
					mapSettingsFieldConfig.bind(null, state)
				)
			}),
			{}
		)
	}),
	dispatch => ({
		dispatch,
		...bindActionCreators({ createFolder, loadFolders }, dispatch)
	})
)
@graphql(PrefCalendarWorkingHoursMutation, {
	props: ({ mutate }) => ({
		setWorkingHours: value =>
			mutate({
				variables: { value },
				optimisticResponse: {
					__typename: 'Mutation',
					prefCalendarWorkingHours: value
				},
				update: (cache, { data: { prefCalendarWorkingHours } }) => {
					const data = cache.readQuery({ query: PreferencesQuery });
					data.preferences.zimbraPrefCalendarWorkingHours = prefCalendarWorkingHours;

					cache.writeQuery({
						query: PreferencesQuery,
						data
					});
				}
			})
	})
})
@graphql(PrefCalendarFirstDayOfWeek, {
	props: ({ mutate }) => ({
		setFirstDayOfWeek: value =>
			mutate({
				variables: { value },
				optimisticResponse: {
					__typename: 'Mutation',
					prefCalendarFirstDayOfWeek: value
				},
				update: (cache, { data: { prefCalendarFirstDayOfWeek } }) => {
					const data = cache.readQuery({ query: PreferencesQuery });
					data.preferences.zimbraPrefCalendarFirstDayOfWeek = prefCalendarFirstDayOfWeek;

					cache.writeQuery({
						query: PreferencesQuery,
						data
					});
				}
			})
	})
})
@accountInfo()
@graphql(ModifyIdentityMutation, {
	props: ({ mutate, ownProps: { denormalizeIdentity } }) => ({
		modifyIdentity: displayIdentity =>
			mutate({
				variables: {
					id: displayIdentity.id,
					attrs: denormalizeIdentity(displayIdentity)
				}
			})
	})
})
@graphql(AddSignatureAccountMutation, {
	props: ({ mutate }) => ({
		addSignature: ({ contentType, name, value }) =>
			new Promise(resolve =>
				mutate({
					variables: {
						contentType,
						value,
						name
					}
				}).then(({ data: { addSignature: { id } } }) => {
					if (id !== undefined) {
						resolve(id);
					}
				})
			)
	})
})
@graphql(ModifySignatureAccountMutation, {
	props: ({ mutate }) => ({
		modifySignature: ({ id, contentType, value }) =>
			mutate({
				variables: {
					id,
					contentType,
					value
				}
			})
	})
})
@graphql(DeleteSignatureAccountMutation, {
	props: ({ mutate }) => ({
		deleteSignature: ({ id }) =>
			mutate({
				variables: {
					id
				}
			})
	})
})
@graphql(AddExternalAccountMutation, {
	props: ({
		ownProps: {
			accountInfoQuery,
			loadFolders: loadFoldersProp,
			importExternalAccountData
		},
		mutate
	}) => ({
		addExternalAccount: externalAccount =>
			mutate({
				variables: { externalAccount }
			})
				.then(
					({ data: { addExternalAccount } }) =>
						addExternalAccount !== undefined
							? importExternalAccountData(
								externalAccount.accountType,
								addExternalAccount
							)
							: Promise.resolve()
				)
				.then(() => {
					accountInfoQuery.refetch();
					loadFoldersProp();
				})
	})
})
@graphql(ModifyExternalAccountMutation, {
	props: ({ ownProps: { accountInfoQuery, denormalizeDataSource }, mutate }) => ({
		modifyExternalAccount: dataSource =>
			mutate({
				variables: {
					id: dataSource.id,
					type: dataSource.accountType,
					attrs: denormalizeDataSource(dataSource)
				}
			}).then(() => {
				accountInfoQuery.refetch();
			})
	})
})
@withCommandHandlers(props => [
	{
		context: 'all',
		command: 'GO_TO_PREFERENCES',
		handler: () => props.dispatch(show())
	}
])
export default class SettingsModal extends Component {
	state = {
		settings: null,
		accountsSettings: [],
		signature: ''
	};

	updateAccountSettings = (info, accountId) => {
		const accountsSettingsCopy = deepClone(this.state.accountsSettings);
		const modifiedIndex = findIndex(
			accountsSettingsCopy,
			account => account.id === accountId
		);
		let modifiedAccount = accountsSettingsCopy.splice(modifiedIndex, 1)[0];
		modifiedAccount = Object.assign({}, modifiedAccount, ...info);
		accountsSettingsCopy.splice(modifiedIndex, 0, modifiedAccount);
		this.setState({
			accountsSettings: accountsSettingsCopy
		});
	};

	saveAccount = accountSettings => {
		const action =
			accountSettings.accountType === undefined
				? this.props.modifyIdentity
				: this.props.modifyExternalAccount;
		return action(accountSettings);
	};

	handleChange = settings =>
		new Promise(resolve => {
			this.setState({ settings }, resolve);
		});

	handleSave = () => {
		const { addSignature, modifySignature, deleteSignature } = this.props;
		let updatePromises = [];

		this.state.accountsSettings.map(accountSettings => {
			const {
				id,
				defaultSignature,
				signatureValue,
				showSignatureEditor
			} = accountSettings;
			const prevAccount = find(this.props.accounts, a => a.id === id) || {};

			if (showSignatureEditor && prevAccount.signatureValue) {
				if (signatureValue !== prevAccount.signatureValue) {
					updatePromises.push(
						modifySignature({
							id: defaultSignature,
							contentType: 'text/html',
							value: signatureValue
						})
					);
				}
				updatePromises.push(this.saveAccount(accountSettings));
			}
			else if (!showSignatureEditor && prevAccount.signatureValue) {
				updatePromises.push(
					deleteSignature({ id: defaultSignature }).then(() =>
						this.saveAccount({
							...accountSettings,
							defaultSignature: null,
							forwardReplySignature: null
						})
					)
				);
			}
			else if (showSignatureEditor && !isEmpty(signatureValue)) {
				updatePromises.push(
					addSignature({
						name: `Default Signature - ${accountSettings.name} - ${new Date()}`,
						contentType: 'text/html',
						value: signatureValue
					}).then(sigId =>
						this.saveAccount({
							...accountSettings,
							defaultSignature: sigId,
							forwardReplySignature: sigId
						})
					)
				);
			}
			else {
				updatePromises.push(this.saveAccount(accountSettings));
			}
		});

		const defaultUpdates = Object.values(FIELD_TYPES).reduce((memo, type) => {
			memo[type] = {};
			return memo;
		}, {});

		// Build a map of settings type to its keyed changed values. We aggregate
		// across all tabs as keys of the same field type might live across multiple
		// tabs and we want to make a single update with all changed values.
		const updates = settingsConfigs.reduce((memo, settingsConfig) => {
			const settingsTab = this.state.settings[settingsConfig.id];
			Object.keys(settingsTab).forEach(fieldName => {
				const persistedSetting = this.props.persistedSettings[
					settingsConfig.id
				][fieldName];
				const { type, key, fromJS } = SETTINGS_ID_TO_CONFIG[
					settingsConfig.id
				].fields[fieldName];
				if (!isEqual(settingsTab[fieldName], persistedSetting)) {
					const updatedSetting = settingsTab[fieldName];
					memo[type][key] = fromJS ? fromJS(updatedSetting) : updatedSetting;
				}
			});
			return memo;
		}, defaultUpdates);
		this.onToggle();

		updatePromises.push(
			...Object.values(FIELD_TYPES).reduce((memo, fieldType) => {
				const update = updates[fieldType];
				if (!isEmpty(update)) {
					memo.push(
						this.props.dispatch(
							FIELD_TYPE_METHODS[fieldType].updateAction(update)
						)
					);
				}
				return memo;
			}, [])
		);
		return Promise.all(updatePromises).then(() => {

			/**
			 * Apollo is the source of truth for calendar related prefs, we can can remove this special case
			 * logic once rest of settings modal is transitioned from Redux to Apollo.
			 * i.e. Actually merge all pref-related setters into one.
			 */
			if (updates.userPref.zimbraPrefCalendarFirstDayOfWeek) {
				this.props.setFirstDayOfWeek(
					updates.userPref.zimbraPrefCalendarFirstDayOfWeek.toString()
				);
			}
			if (updates.userPref.zimbraPrefCalendarWorkingHours) {
				this.props.setWorkingHours(
					updates.userPref.zimbraPrefCalendarWorkingHours
				);
			}

			this.props.accountInfoQuery.refetch();
		});
	};

	createFolderByName = (baseFolderName, duplicateCount = 0) => {
		const folderName =
			duplicateCount > 0
				? `${baseFolderName} - ${duplicateCount + 1}`
				: baseFolderName;
		const folder = find(this.props.allFolders, [
			'absFolderPath',
			`/${folderName}`
		]);

		return folder
			? this.createFolderByName(baseFolderName, duplicateCount + 1)
			: this.props.createFolder({
				name: folderName,
				fetchIfExists: '1'
			});
	};

	handleCreateNewAccount = data => {
		const { addExternalAccount } = this.props;
		const {
			formData: {
				accountType,
				emailAddress,
				host,
				leaveOnServer,
				password,
				port: customPort,
				useCustomFolder,
				username,
				useCustomPort,
				useSSL
			}
		} = data;
		const folderName = useCustomFolder ? username : 'Inbox';
		const port = useCustomPort ? customPort : mailPort(accountType, useSSL);

		return this.createFolderByName(folderName).then(folder =>
			addExternalAccount({
				accountType,
				emailAddress,
				host,
				password,
				port,
				username,
				connectionType: useSSL ? 'ssl' : 'cleartext',
				isEnabled: true,
				l: folder.id,
				leaveOnServer: accountType === 'pop3' ? leaveOnServer : true,
				name: username
			})
		);
	};

	onToggle = () => this.props.dispatch(toggle());

	componentDidMount() {
		this.props.dispatch(loadMailboxMetadata());
		this.props.dispatch(loadWhiteBlackList());
		this.props.dispatch(loadFilterRules());
		this.props.loadFolders();
	}

	componentWillReceiveProps(nextProps) {
		if (!this.state.settings || (!this.props.visible && nextProps.visible)) {
			this.setState({ settings: nextProps.persistedSettings });
		}

		if (nextProps.accounts.length !== this.state.accountsSettings.length) {
			this.setState({
				accountsSettings: nextProps.accounts
			});
		}
	}

	render(props, { settings, accountsSettings }) {
		return (
			<div class={cx(style.wrapper, props.visible && style.showing)}>
				{props.visible && (
					<div class={style.inner}>
						<div class={cx(style.header, style.hideSmDown)}>
							<Text id="settings.modal.title">Settings</Text>
							<Icon
								class={style.close}
								name="close"
								onClick={this.onToggle}
							/>
						</div>
						<div class={style.contentWrapper}>
							{props.visible && (
								<Settings
									value={settings}
									updateAccountSettings={this.updateAccountSettings}
									onChange={this.handleChange}
									onSubmitNewAccount={this.handleCreateNewAccount}
									accounts={accountsSettings}
									accountInfoQuery={props.accountInfoQuery}
									onSave={this.handleSave}
									onCancel={this.onToggle}
								/>
							)}
						</div>
						<div class={cx(style.footer, style.hideSmDown)}>
							<Button
								onClick={this.handleSave}
								styleType="primary"
								brand="primary"
								disabled={!settings}
							>
								<Text id="settings.modal.saveLabel">Save</Text>
							</Button>
							<Button onClick={this.onToggle} >
								<Text id="settings.modal.cancelLabel">Cancel</Text>
							</Button>
						</div>
					</div>
				)}
			</div>
		);
	}
}
