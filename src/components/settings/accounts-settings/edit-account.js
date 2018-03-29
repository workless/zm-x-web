import { h, Component } from 'preact';
import cx from 'classnames';
import { Text } from 'preact-i18n';
import get from 'lodash/get';

import { callWith } from '../../../lib/util';

import { Button } from '@zimbra/blocks';
import Select from '../../select';
import MiniComposer from '../../mini-composer';
import ErrorAlert from '../../error-alert';

import style from '../style';

class EditAccountView extends Component {
	saveTempSignature = e => {
		this.props.updateAccountSettings(
			{
				signatureValue: e.value
			},
			this.props.selectedAccountId
		);
	};

	triggerUpdateAccountSettings = property => e => {
		if (e.target.type === 'checkbox') {
			this.props.updateAccountSettings(
				{ [property]: e.target.checked },
				this.props.selectedAccountId
			);
		}
		else {
			this.props.updateAccountSettings(
				{
					[property]: e.target.value
				},
				this.props.selectedAccountId
			);
		}
	};

	render = ({
		selectedAccount: {
			name,
			fromDisplay,
			replyToAddress,
			replyToDisplay,
			replyToEnabled,
			isPrimaryAccount,
			showSignatureEditor,
			signatureValue,
			emailAddress,
			failingSince,
			lastError
		},
		mailForwardingAddress,
		mailLocalDeliveryDisabled,
		mailForwardingExampleAddress,
		handleMailForwardingActiveChange,
		showMailForwardingAddress,
		onFieldChange,
		switchView
	}) => (
		<div>
			<div class={cx(style.subsectionBody, style.accountSubsection)}>
				{failingSince && (
					<ErrorAlert>
						{get(lastError, '0') || <Text id="settings.accounts.errors.existingIsFailing" />}
					</ErrorAlert>
				)}
				<div class={style.editAccountTitle}>
					{emailAddress}
				</div>
				<div class={style.sectionTitle}>
					<Text id="settings.accounts.editAccount.fromDisplay" />
				</div>
				<label class={style.addAccountLabel}>
					<input
						type="text"
						onChange={callWith(
							this.triggerUpdateAccountSettings,
							'fromDisplay'
						)()}
						value={fromDisplay}
						class={cx(style.textInput, style.addAccountInput)}
					/>
					<div class={style.helperText}>
						<Text id="settings.accounts.editAccount.fromDisplayHelper" />
					</div>
				</label>
				<div class={style.sectionTitle}>
					<Text id="settings.accounts.editAccount.description" />
				</div>
				<label class={style.addAccountLabel}>
					<input
						type="text"
						onChange={callWith(this.triggerUpdateAccountSettings, 'name')()}
						value={name}
						class={cx(style.textInput, style.addAccountInput)}
					/>
					<div class={style.helperText}>
						<Text id="settings.accounts.editAccount.descriptionHelper" />
					</div>
				</label>
				<div class={style.addAccountSubsection}>
					<div class={style.sectionTitle}>
						<Text id="settings.accounts.editAccount.replyToAddressSection" />
					</div>
					<label class={style.compactCheckboxSection}>
						<input
							onChange={callWith(
								this.triggerUpdateAccountSettings,
								'replyToEnabled'
							)()}
							type="checkbox"
							checked={replyToEnabled}
						/>
						<Text id="settings.accounts.editAccount.replyToAddressEnabled" />
					</label>
					{replyToEnabled &&
						<div>
							<div class={cx(style.subsection, style.compact)}>
								<div class={cx(style.subsectionTitle, style.infoLabel)}>
									<Text id="settings.accounts.editAccount.replyToAddress" />
								</div>
								<div class={style.subsectionBody}>
									<input
										type="email"
										onChange={callWith(this.triggerUpdateAccountSettings, 'replyToAddress')()}
										value={replyToAddress}
										class={cx(style.textInput, style.infoInput)}
									/>
								</div>
							</div>
							<div class={style.subsection}>
								<div class={cx(style.subsectionTitle, style.infoLabel)}>
									<Text id="settings.accounts.editAccount.replyToDisplay" />
								</div>
								<div class={style.subsectionBody}>
									<input
										type="email"
										onChange={callWith(this.triggerUpdateAccountSettings, 'replyToDisplay')()}
										value={replyToDisplay}
										class={cx(style.textInput, style.infoInput)}
									/>
								</div>
							</div>
						</div>
					}
				</div>
				<div class={style.sectionTitle}>
					<Text id="settings.accounts.editAccount.editSignatures" />
				</div>
				<div class={style.addAccountLabel} style={{ fontSize: '13px' }}>
					<label class={style.compactCheckboxSection}>
						<input
							onChange={callWith(
								this.triggerUpdateAccountSettings,
								'showSignatureEditor'
							)()}
							type="checkbox"
							checked={showSignatureEditor}
						/>
						<Text id="settings.accounts.editAccount.append" />
					</label>
					{showSignatureEditor && (
						<MiniComposer
							message={signatureValue || ''}
							onChange={this.saveTempSignature}
							onInput={this.saveTempSignature}
						/>
					)}
				</div>
				{isPrimaryAccount && (
					<div class={cx(style.subsectionBody, style.primaryAccountSection)}>
						<div class={style.sectionTitle}>
							<Text id="settings.accounts.mailForwardingTitle" />
						</div>
						<label class={style.compactCheckboxSection}>
							<input
								onChange={handleMailForwardingActiveChange}
								type="checkbox"
								checked={showMailForwardingAddress}
							/>
							<Text id="settings.accounts.mailForwardingLabel" />
						</label>
						{showMailForwardingAddress && (
							<input
								type="text"
								class={cx(style.textInput, style.block)}
								placeholder={mailForwardingExampleAddress}
								value={mailForwardingAddress}
								onChange={onFieldChange('mailForwardingAddress')}
							/>
						)}
						{showMailForwardingAddress &&
							<Select
								value={mailLocalDeliveryDisabled}
								onChange={onFieldChange('mailLocalDeliveryDisabled')}
								fullWidth
								style={{ marginTop: '8px' }}
							>
								<option value="false">
									<Text id="settings.accounts.editAccount.storeAndForward" />
								</option>
								<option value="true">
									<Text id="settings.accounts.editAccount.deleteAndForward" />
								</option>
							</Select>
						}
					</div>
				)}
				{!isPrimaryAccount && (
					<div>
						<Button
							styleType="primary"
							brand="danger"
							onClick={callWith(switchView, ['confirmRemoval'])}
							alignLeft
						>
							<Text id="buttons.removeMailbox" />
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}

export default EditAccountView;
