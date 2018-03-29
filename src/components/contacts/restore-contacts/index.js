import { h, Component } from 'preact';
import { ContactsRestoredMessage } from '../../notifications/messages';
import { notify } from '../../../store/notifications/actions';
import { connect } from 'preact-redux';
import { Spinner, Select, Option, Button } from '@zimbra/blocks';
import ModalDialog from '../../modal-dialog';
import style from './style';
import { Text  } from 'preact-i18n';
import wire from 'wiretie';

@wire('zimbra', { restorePoints: 'contacts.getRestorePoints' },
	zimbra => ({
		restoreSnapshot: zimbra.contacts.restoreSnapshot
	}))
@connect(null, { notify })
export default class RestoreContacts extends Component {

	closeDialog = () => {
		if (this.props.onClose) this.props.onClose();
	}

	selectSnapshot = (snapshot) => {
		this.setState({
			snapshot: {
				name: snapshot.title
			}
		});
	}

	restoreSnapshot = () => {
		this.setState({ restoreInProgress: true });

		this.props.restoreSnapshot(this.state.snapshot.name)
			.then( () => {
				this.props.notify({
					message: <ContactsRestoredMessage restorePointName={this.state.snapshot.name} />
				});
				this.closeDialog();
			})
			.catch( () => {
				this.props.notify({
					failure: true,
					message: <ContactsRestoredMessage failure />
				});
				this.setState({ restoreInProgress: false });
			});
	}

	componentWillReceiveProps({ restorePoints }) {
		if (!this.state.snapshot && restorePoints && restorePoints[0]) {
			this.setState({ snapshot: { name: restorePoints[0].name } });
		}
	}
	render({ restorePoints, pending = {}, rejected = {}, refresh }, { snapshot, restoreInProgress }) {
		const empty = restorePoints && restorePoints.length === 0;

		return (
			<ModalDialog
				buttons={!empty && [
					<Button disabled={restoreInProgress || pending.restorePoints || rejected.restorePoints} styleType="primary" brand="primary" onClick={this.restoreSnapshot}>
						<Text id="buttons.restore">Restore</Text>
					</Button>
				]}
				cancelButton={!empty}
				class={style.restoreContacts}
				onClose={this.closeDialog}
				title="contacts.restore.DIALOG_TITLE"
			>
				{!empty && (
					<p>
						<Text id="contacts.restore.RESTORE_TO_TIME">
							Restore address book to how it was at this time:
						</Text>
					</p>
				)}
				{pending.restorePoints ? (
					<Spinner class={style.spinner} block />
				) : rejected.restorePoints ? ([
					<span class={style.rejected}><Text id="contacts.restore.LOAD_FAILED" /></span>,
					' ',
					<a onClick={refresh} href="javascript:"><Text id="contacts.restore.TRY_AGAIN" /></a>
				]) : !empty ? (
					<Select
						value={snapshot && snapshot.name}
						class={style.selectSnapshot}
						anchor="right"
						iconPosition="right"
						onChange={this.selectSnapshot}
					>
						{ restorePoints.map( restorePoint => (
							<Option title={restorePoint.name} value={restorePoint.name} />
						)) }
					</Select>
				) : (
					<p><Text id="contacts.restore.NO_BACKUPS" /></p>
				)}
			</ModalDialog>
		);
	}
}
