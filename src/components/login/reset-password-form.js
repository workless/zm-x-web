import { h, Component } from 'preact';
import { Text } from 'preact-i18n';
import { Button } from '@zimbra/blocks';
import PasswordInput from '../password-input';
import { graphql } from 'react-apollo';
import ChangePasswordMutation from '../../graphql/queries/change-password.graphql';
import linkState from 'linkstate';
import style from './style';

@graphql(ChangePasswordMutation, {
	props: ({ mutate }) => ({
		changePassword: (variables) => mutate({ variables })
	})
})
export default class ResetPasswordForm extends Component {
	state = {
		username: this.props.username,
		password: this.props.password
	}

	submit = (e) => {
		this.props.onError && this.props.onError('');

		this.setState({ submitting: true });

		this.props.changePassword(this.state)
			.then(() => {
				const { login } = this.props;
				const { username, loginConfirmNewPassword } = this.state;
				return login({ username, password: loginConfirmNewPassword });
			})
			.then(() => {
				this.props.onLogin();
			})
			.catch((err) => {
				err.message = err.message.replace(/Error: GraphQL error: /, ''); // https://github.com/apollographql/apollo-client/issues/1812
				this.props.onError && this.props.onError(err);
				this.setState({ submitting: false });
			});

		e.preventDefault();
	}

	componentWillReceiveProps({ username, password }) {
		if (username && this.props.username !== username) { this.setState({ username }); }
		if (password && this.props.password !== password) { this.setState({ password }); }
	}

	render({ a11yId, ...props }, { loginNewPassword, loginConfirmNewPassword, submitting }) {
		const newPassInputId = 'loginNewPassword';
		const confirmPassInputId = 'loginConfirmNewPassword';

		return (
			<form {...props} onSubmit={this.submit} action="javascript:">
				<label for={newPassInputId}><Text id="loginScreen.labels.newPass" /></label>
				<PasswordInput
					autofocus
					name={newPassInputId}
					value={loginNewPassword}
					onInput={linkState(this, 'loginNewPassword')}
					disabled={submitting}
				/>

				<label for={confirmPassInputId}><Text id="loginScreen.labels.confirmPass" /></label>
				<PasswordInput
					name={confirmPassInputId}
					value={loginConfirmNewPassword}
					onInput={linkState(this, 'loginConfirmNewPassword')}
					disabled={submitting}
				/>

				<Button disabled={submitting} class={style.continue} type="submit" styleType="primary">
					<Text id="buttons.continue" />
				</Button>
			</form>
		);
	}
}

