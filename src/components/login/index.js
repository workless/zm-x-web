import { h, Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { Button, Spinner, Popover } from '@zimbra/blocks';
import { withAriaId } from '@zimbra/a11y';
import { configure } from '../../config';
import PasswordInput from '../password-input';
import TextInput from '../text-input';
import ClientLogo from '../client-logo';
import ResetPasswordForm from './reset-password-form';
import RegisterAccountForm from './register-account-form';
import wire from 'wiretie';
import linkState from 'linkstate';
import cx from 'classnames';
import style from './style';

function ForgotPasswordButton() {
	return (
		<Localizer>
			<Popover
				text={<Text id="loginScreen.forgotPass.button" />}
				class={style.forgotPassPopoverButton}
				titleClass={style.forgotPassPopoverTitle}
				popoverClass={style.forgotPassPopover}
			>
				<h4 class={style.forgotPassHeader}>
					<Text id="loginScreen.forgotPass.header" />
				</h4>
				<p class={style.forgotPassParagraph}>
					<Text id="loginScreen.forgotPass.paragraph" />
					&nbsp;
					<a href="mailto:jennifer.goodwin@synacor.com">jennifer.goodwin@synacor.com</a>
				</p>
			</Popover>
		</Localizer>
	);
}

function RegisterAccountButton({ onClick }) {
	return (
		<Button class={style.registerAccountButton} styleType="text" onClick={onClick}>
			<span class={style.registerAccountButtonText}>
				<Text id="loginScreen.registerAccount.button" />
			</span>
		</Button>
	);
}

@configure('clientName')
@withAriaId('login-form')
@wire('zimbra', {}, zimbra => ({
	login: zimbra.login,
	endSession: zimbra.endSession
}))
export default class Login extends Component {

	state = {
		validity: {
			username: true,
			password: true
		}
	}

	handleError = (error) => {
		this.setState({ error: String(error || '') });
	}

	shakeLoginButton = () => {
		this.setState({ shake: true });

		setTimeout(() => { this.setState({ shake: false }); }, 250);
	}

	submit = () => {
		let { login, onLogin } = this.props,
			{ username, password } = this.state;
		this.setState({ error: '', loading: true });

		let validity = {
			username: username && username.length > 2,
			password: password && password.length > 2
		};

		if (!validity.username || !validity.password) {
			this.shakeLoginButton();
			this.setState({
				loading: false,
				validity
			});
			return;
		}

		login({ username, password })
			.then(() => onLogin())
			.catch( ({ message }) => {
				this.shakeLoginButton();

				if (message.match(/must change password/)) {
					this.setState({ showChangePassword: true });
				}

				this.setState({ error: String(message), loading: false });
			});
		return false;
	};

	registerAccountClick = () => {
		this.setState({ showRegisterAccountForm: true });
	};

	registerAccountSubmit = ({ firstName, lastName, userName, recoveryEmail }) => {
		console.log('*** registering account', firstName, lastName, userName, recoveryEmail);

		const newAccount = new URLSearchParams();
		newAccount.append('firstName', firstName);
		newAccount.append('lastName', lastName);
		newAccount.append('userName', userName);
		newAccount.append('recoveryEmail', recoveryEmail);

		return fetch('https://bc.lonni.me/__account/register', {
			method: 'POST',
			redirect: 'follow',
			body: newAccount
		}).then((resp) => {
			console.log('**** register account success', resp);
			this.setState({ showRegisterAccountForm: false });
			return resp;
		});
	};

	componentWillMount() {
		//invalidate any session that the user might have
		this.props.endSession();
	}

	render({ a11yId, clientName, login, onLogin }, { showRegisterAccountForm, showChangePassword, error, loading, username, password, validity, shake }) {
		if (error && error.match) {
			if (error.match(/(authorization|authentication failed)/i)) {
				error = <Text id="loginScreen.errors.invalidCredentials" />;
			}
			else if (error.match(/must change password/)) {
				error = <Text id="loginScreen.errors.chooseNewPass" />;
			}
			else if (error.match(/maintenance mode/)) {
				error = <Text id="loginScreen.errors.inMaintainance" />;
			}
			else if (error.match(/registration/)) {
				error = <Text id="loginScreen.errors.registrationFailed" />;
			}
			else if (error.match(/^Error: /)) {
				error = error.replace(/^Error: /, '');
			}
		}

		const emailInputId = `${a11yId}-email`;
		const passInputId = `${a11yId}-password`;

		const renderHeader = () => {
			if (showRegisterAccountForm) {
				return (<Text id="loginScreen.registerAccount.header" />);
			}
			else if (showChangePassword) {
				return (<Text id="loginScreen.resetPass.header" />);
			}
			return (<Text id="loginScreen.header.title" />);
		};

		const renderForm = () => {
			if (showRegisterAccountForm) {
				return (
					<RegisterAccountForm
						onSubmit={this.registerAccountSubmit}
						onError={this.handleError}
					/>
				);
			}
			else if (showChangePassword) {
				return (
					<ResetPasswordForm
						username={username}
						password={password}
						class={style.form}
						login={login}
						onLogin={onLogin}
						onError={this.handleError}
					/>
				);
			}
			return (
				<form onSubmit={this.submit} action="javascript:">
					<div class={style.form}>

						<label
							for={emailInputId}
							class={cx(!validity.username && style.invalid)}
						>
							<Text id="loginScreen.labels.email" />
						</label>
						<TextInput
							autofocus
							disabled={loading}
							id={emailInputId}
							class={cx(!validity.username && style.invalid)}
							value={username}
							onInput={linkState(this, 'username')}
						/>

						<label
							for={passInputId}
							class={cx(!validity.password && style.invalid)}
						>
							<Text id="loginScreen.labels.pass" />
						</label>
						<PasswordInput
							disabled={loading}
							id={passInputId}
							class={cx(!validity.password && style.invalid)}
							value={password}
							onInput={linkState(this, 'password')}
						/>

						<div class={style.buttons}>
							<Button class={cx(shake && style.shakeHorizontal)} styleType="primary" brand="primary" disabled={loading} type="submit">
								<Text id="loginScreen.header.title" />
								{ loading && (
									<Spinner dark class={style.icon} />
								)}
							</Button>
							<RegisterAccountButton onClick={this.registerAccountClick} />
						</div>
					</div>
				</form>
			);
		};

		return (
			<div class={style.container}>
				<div class={style.login}>
					<ClientLogo class={style.logo} />

					<h1>
						{renderHeader()}
					</h1>

					{!error && !showChangePassword && (
						<p><Text id="loginScreen.header.tagline" fields={{ name: clientName }} /></p>
					)}

					<div class={cx(style.error, error && style.showing)}>
						<div class={style.inner}>
							{error}
						</div>
					</div>
					{renderForm()}
				</div>
				<footer class={style.footer}>
					{/*
					Unfinished - Will be finished in another Login ticket
					<h6><Text id="loginScreen.switchToBasic" /></h6>
					<ol>
						<li>
							<Text id="loginScreen.privacyPolicy" />
						</li>
						<li>
							<Text id="loginScreen.acceptableUsePolicy" />
						</li>
						<li>
							<Text id="loginScreen.contact" />
						</li>
					</ol>
					*/}
					<small>
						<Text id="loginScreen.copyright" />
					</small>
				</footer>
			</div>
		);
	}
}
