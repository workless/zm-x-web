import { h, Component } from 'preact';
import wire from 'wiretie';
import { Button, Icon } from '@zimbra/blocks';
import get from 'lodash-es/get';
import AddressList from '../address-list';
import cx from 'classnames';
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
								<Repeats recurrence={recurrence} invite={component} />
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


// @TODO use <Text /> pluralization
const FREQS = {
	SEC: ['seconds', 'secondly'],
	MIN: ['minutes', 'minutely'],
	HOU: ['hours', 'hourly'],
	DAI: ['days', 'daily'],
	WEE: ['weeks', 'weekly'],
	MON: ['months', 'monthly'],
	YEA: ['years', 'yearly']
};

const DAYS = {
	MO: 'Monday',
	TU: 'Tuesday',
	WE: 'Wednesday',
	TH: 'Thursday',
	FR: 'Friday',
	SA: 'Saturday',
	SU: 'Sunday'
};

const Repeats = ({ recurrence }) => {
	let freq = FREQS[getRecurrenceField(recurrence, 'freq')],
		slots = array(getRecurrenceField(recurrence, 'byday')),
		interval = getRecurrenceField(recurrence, 'interval');

	freq = interval===1 ? freq[1] : `Every ${interval} ${freq[0]}`;

	if (slots.join(',')==='MO,TU,WE,TH,FR') {
		freq = 'Every weekday';
	}
	else {
		freq += ' on ' + slots.map(s => DAYS[s.day || s] || s).join(', ') + '.';
	}

	// console.log(recurrence, invite);

	return <span class={style.recurrence}>{freq}</span>;
};

/**
 * Recurrence can look like { freq: "WEE", byday: ["MO", "TU"], interval: 1 } or if there are exceptions to the recurence, like
 * { add: { [ {freq: "WEE", byday: ["MO", "TU"], interval: [1] ] }, exclude: [ "20170601T140000Z", { dtval: ["20171123T100000", tz: "America/New_York"} ] },
 */
function getRecurrenceField(recurrence, field) {
	return get(recurrence, field, get(recurrence, `add.0.${field}`));
}
