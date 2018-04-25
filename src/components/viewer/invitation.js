import { h, Component } from 'preact';
import wire from 'wiretie';
import { Button, Icon } from '@zimbra/blocks';
import AddressList from '../address-list';
import cx from 'classnames';
import Recurrence from '../recurrence';
import { isMessageTrashed } from '../../utils/mail-item';
import array from '@zimbra/util/src/array';
import style from './style';


@wire('zimbra', null, (zimbra) => ({
	meetings: zimbra.meetings
}))
export default class Invitation extends Component {

	sendInviteReply = (callback) => {

		this.setState({ inviteReplyInProgress: true });

		return callback(this.props.message);
	}

	accept = () => {
		this.sendInviteReply(this.props.meetings.accept);
	}

	decline = () => {
		this.sendInviteReply(this.props.meetings.decline);
	}

	tentative = () => {
		this.sendInviteReply(this.props.meetings.tentative);
	}

	render({ message, invitation }, { inviteReplyInProgress }) {
		let component = invitation && invitation.components && invitation.components[0];

		if (Object.keys(component || invitation).length===0) {
			return (
				<div class={cx(style.invitation, style.outdated)}>
					<Icon name="alert" />
					{' '}Invitation is not current.
				</div>
			);
		}

		return (
			<div class={style.invitation}>
				<dl>
					<dt>Location:</dt>
					<dd>
						{component.location}
					</dd>

					<dt>Organizer:</dt>
					<dd>
						<AddressList wrap={false} addresses={array(component.organizer)} />
					</dd>

					<dt>Invitees:</dt>
					<dd>
						<AddressList wrap={false} addresses={array(component.attendees)} />
					</dd>

					{ component.recurrence && [
						<dt>Repeats:</dt>,
						<dd>
							{ array(component.recurrence).map( recurrence =>
								<Recurrence recurrence={recurrence} class={style.recurrence} />
							) }
						</dd>
					] }

					{!isMessageTrashed(message) && [
						<dt class={style.rsvpTitle}>Respond:</dt>,
						<dd>
							<div class={style.rsvp}>
								<Button disabled={inviteReplyInProgress} onClick={this.accept} styleType="secondary" brand="success" iconName="check">Accept</Button>
								<Button disabled={inviteReplyInProgress} onClick={this.tentative} styleType="secondary" brand="info" iconName="question-circle">Tentative</Button>
								<Button disabled={inviteReplyInProgress} onClick={this.decline} styleType="secondary" brand="danger" iconName="close">Decline</Button>
							</div>
						</dd>
					]}
				</dl>
			</div>
		);
	}
}

