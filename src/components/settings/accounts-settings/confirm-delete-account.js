import { h } from 'preact';
import { Text } from 'preact-i18n';
import { graphql } from 'react-apollo';
import { Button } from '@zimbra/blocks';
import { callWith } from '../../../lib/util';
import DeleteExternalAccountMutation from '../../../graphql/queries/accounts/account-delete-external-mutation.graphql';
import style from '../style';

const ConfirmDeleteAccountView = ({
	id,
	accountName,
	deleteExternalAccount,
	switchView
}) => (
	<div>
		<p class={style.confirmationMessage}>
			<Text
				id="settings.accounts.editAccount.confirmation"
				fields={{
					accountName
				}}
			/>
		</p>
		<p class={style.confirmationSpan}>
			<Text id="settings.accounts.editAccount.additionalConfirmationInfo" />
		</p>
		<div>
			<Button
				styleType="primary"
				brand="danger"
				onClick={callWith(deleteExternalAccount, { id })}
				alignLeft
			>
				<Text id="buttons.removeMailbox" />
			</Button>
			<Button onClick={callWith(switchView, ['edit'])}>
				<Text id="buttons.cancel" />
			</Button>
		</div>
	</div>
);

export default graphql(DeleteExternalAccountMutation, {
	props: ({ mutate, ownProps: { switchView, accountInfoQuery } }) => ({
		deleteExternalAccount: ({ id }) => {
			mutate({
				variables: {
					id
				}
			}).then(() => {
				accountInfoQuery.refetch();
				switchView(['active']);
			});
		}
	})
})(ConfirmDeleteAccountView);
