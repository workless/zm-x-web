import { h } from 'preact';
import PureComponent from '../../lib/pure-component';
import { Text } from 'preact-i18n';
import { Button, ModalDialog, Spinner } from '@zimbra/blocks';
import ContactEditor from '../contacts/editor';
import wire from 'wiretie';
import style from './style';

// FIXME: move to GraphQL, which requires removing `contact` prop
// mutations from `ContactEdtior` and migrating it to GraphQL.
@wire('zimbra', ({ contactId }) => ({
	contact:
		contactId
			? ['contacts.read', contactId]
			: null
}))
export default class ModalContactEditor extends PureComponent {
	cancel = () => {
		let { onClose } = this.props;
		if (onClose) onClose();
		else this.setState({ closed: true });
	};

	beforeSave = () => {
		this.setState({ saving: true });
	};

	afterSave = () => {
		this.setState({ saving: false });
		this.cancel();
	};

	render({ contact }, { closed, saving }) {
		if (closed) return null;

		if (contact) {
			delete contact[0];
		}

		let address = contact && contact.attributes && contact.attributes.email;

		return (
			<ModalDialog
				overlayClass={style.backdrop}
				class={style.modalContactEditor}
			>
				<div class={style.inner}>
					<header class={style.header}>
						<h2>
							<Text id="contacts.modalEdit.TITLE" />
						</h2>

						<p class={style.description}>
							<Text id="contacts.modalEdit.DESCRIPTION" fields={{ address }} />
						</p>

						<Button
							styleType="floating"
							class={style.actionButton}
							onClick={this.cancel}
						/>
					</header>

					<div class={style.content}>
						{contact && (
							<ContactEditor
								class={style.editor}
								contact={contact}
								showCard={false}
								showHeader={false}
								showTitle={false}
								showFooter
								skipMissing={false}
								allowMove
								disabled={saving}
								onBeforeSave={this.beforeSave}
								onSave={this.afterSave}
								onCancel={this.cancel}
								isNew={false}
								footerClass={style.footer}
							/>
						)}
					</div>

					{saving && <Spinner block />}
				</div>
			</ModalDialog>
		);
	}
}
