import { h, Component } from 'preact';
import { Text } from 'preact-i18n';
import { Button } from '@zimbra/blocks';
import TextInput from '../text-input';
import linkState from 'linkstate';
import style from './style';

export default class RegisterAccountForm extends Component {
	static defaultProps = {
		onSubmit: () => Promise.resolve(),
		onError: () => Promise.resolve()
	};

	state = {
		firstName: this.props.firstName,
		lastName: this.props.lastName,
		userName: this.props.userName,
		recoveryEmail: this.props.recoveryEmail
	}

	submit = (e) => {
		this.props.onError && this.props.onError('');

		this.setState({ submitting: true });

		this.props.onSubmit(this.state)
			.catch((err) => {
				err.message = 'Error registering new account';
				this.props.onError(err);
				this.setState({ submitting: false });
			});

		e.preventDefault();
	}

	componentWillReceiveProps({ firstName, lastName, userName, recoveryEmail }) {
		if (firstName && this.props.firstName !== firstName) { this.setState({ firstName }); }
		if (lastName && this.props.lastName !== lastName) { this.setState({ lastName }); }
		if (userName && this.props.userName !== userName) { this.setState({ userName }); }
		if (recoveryEmail && this.props.recoveryEmail !== recoveryEmail) { this.setState({ recoveryEmail }); }
	}

	render({ a11yId, ...props }, { firstName, lastName, userName, recoveryEmail, submitting }) {
		const firstNameInputId = 'firstName';
		const lastNameInputId = 'lastName';
		const userNameInputId = 'userName';
		const recoveryEmailInputId = 'recoveryEmail';

		return (
			<form
				{...props}
				onSubmit={this.submit}
				action="javascript:"
			>
				<div class={style.form}>
					<label for={firstNameInputId}>
						<Text id="loginScreen.labels.firstName" />
					</label>
					<TextInput
						autofocus
						name={firstNameInputId}
						value={firstName}
						onInput={linkState(this, 'firstName')}
						disabled={submitting}
						type="text"
						required
					/>
					<label for={lastNameInputId}>
						<Text id="loginScreen.labels.lastName" />
					</label>
					<TextInput
						name={lastNameInputId}
						value={lastName}
						onInput={linkState(this, 'lastName')}
						disabled={submitting}
						type="text"
						required
					/>
					<label for={userNameInputId}>
						<Text id="loginScreen.labels.userName" />
					</label>
					<TextInput
						name={userNameInputId}
						value={userName}
						onInput={linkState(this, 'userName')}
						disabled={submitting}
						type="text"
						required
					/>
					<label for={recoveryEmailInputId}>
						<Text id="loginScreen.labels.recoveryEmail" />
					</label>
					<TextInput
						name={recoveryEmailInputId}
						value={recoveryEmail}
						onInput={linkState(this, 'recoveryEmail')}
						disabled={submitting}
						type="email"
						required
					/>
					<div class={style.buttons}>
						<Button
							disabled={submitting}
							styleType="primary"
							brand="primary"
							type="submit"
						>
							<Text id="buttons.register" />
						</Button>
					</div>
				</div>
			</form>
		);
	}
}
