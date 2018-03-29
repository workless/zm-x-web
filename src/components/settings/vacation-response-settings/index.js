import { h } from 'preact';
import { Text, withText } from 'preact-i18n';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { connect } from 'preact-redux';
import moment from 'moment';
import { Button } from '@zimbra/blocks';
import DateInput from '../../date-input';
import Textarea from '../../textarea';
import AlignedForm from '../../aligned-form';
import AlignedLabel from '../../aligned-form/label';
import FormGroup from '../../form-group';
import style from '../style';
import cx from 'classnames';
import { notify } from '../../../store/notifications/actions';
import PureComponent from '../../../lib/pure-component';
import SendMsgMutation from '../../../graphql/queries/preferences/out-of-office/send-msg-mutation.graphql';

class VacationResponseSettings extends PureComponent {
	updateOooReplyEnabled = () => {
		const toggledValue = !this.props.value.enableOutOfOfficeReply;
		this.props.onFieldChange('enableOutOfOfficeReply')({
			target: { value: toggledValue }
		}).then(() => {
			this.props.onFieldChange('enableOutOfOfficeAlertOnLogin')({
				target: { value: toggledValue }
			});
		});
	};

	handleSendMsg = () => {
		this.props.sendMsg(this.props.value.outOfOfficeReply).then(() => {
			this.props.notify({
				message: this.props.sampleSent
			});
		});
	};

	handleFromOnDateChange = date => {
		const fromDate = moment(date);
		const untilDate = moment(this.props.value.defaultUntilDate);
		if (fromDate.isValid() && untilDate.isValid()) {
			if (moment(untilDate).isBefore(fromDate)) {
				this.props.onFieldChange('defaultFromDate')({
					target: { value: date }
				}).then(() => {
					this.props.onFieldChange('defaultUntilDate')({
						target: { value: moment(date).endOf('day').toDate() }
					});
				});
			}
			else {
				this.props.onFieldChange('defaultFromDate')({
					target: { value: date }
				});
			}
		}
	};

	handleUntilDateOnChange = date => {
		const untilDate = moment(date).endOf('day');
		const fromDate = moment(this.props.value.defaultFromDate);
		if (fromDate.isValid() && untilDate.isValid()) {
			if (moment(untilDate).isBefore(fromDate)) {
				this.props.onFieldChange('defaultUntilDate')({
					target: { value: untilDate.toDate() }
				}).then(() => {
					this.props.onFieldChange('defaultFromDate')({
						target: { value: date }
					});
				});
			}
			else {
				this.props.onFieldChange('defaultUntilDate')({
					target: { value: untilDate.toDate() }
				});
			}
		}
	};

	render({ value, onFieldChange }) {
		return (
			<div>
				<div class={cx(style.sectionTitle, style.hideMdUp)}>
					<Text id="settings.vacationResponse.title" />
				</div>
				<div class={style.subsection}>
					<div class={style.subsectionBody}>
						<ul class={style.list}>
							<li>
								<label>
									<input
										onChange={this.updateOooReplyEnabled}
										type="checkbox"
										checked={value.enableOutOfOfficeReply}
									/>
									<Text id="setings.vacationResponse.enableOutOfOfficeReply">
										Enable automatic response during these dates (inclusive)
									</Text>
								</label>
							</li>
						</ul>
					</div>
				</div>
				<AlignedForm>
					<FormGroup compact>
						<AlignedLabel width="60px" id="settings.vacationResponse.fromDate">
							From
						</AlignedLabel>
						<DateInput
							onDateChange={this.handleFromOnDateChange}
							class={style.inlineField}
							dateValue={
								value.enableOutOfOfficeReply ? value.defaultFromDate : ''
							}
							disabled={!value.enableOutOfOfficeReply}
						/>
					</FormGroup>
					<FormGroup compact>
						<AlignedLabel width="60px" id="settings.vacationResponse.untilDate">
							Until
						</AlignedLabel>
						<DateInput
							onDateChange={this.handleUntilDateOnChange}
							class={style.inlineField}
							dateValue={
								value.enableOutOfOfficeReply ? value.defaultUntilDate : ''
							}
							disabled={!value.enableOutOfOfficeReply}
						/>
					</FormGroup>
				</AlignedForm>
				<Textarea
					rows="5"
					wide
					class={style.vacationResponseTextArea}
					value={value.outOfOfficeReply}
					disabled={!value.enableOutOfOfficeReply}
					onChange={onFieldChange('outOfOfficeReply')}
				/>
				<Button
					class={style.buttonNoMargin}
					id="settings.vacationResponse.sendMeCopy"
					disabled={!value.enableOutOfOfficeReply}
					onClick={this.handleSendMsg}
				>
					Send sample copy to me
				</Button>
			</div>
		);
	}
}

export default compose(
	connect(
		({ email = {} }) => ({
			email
		}),
		{ notify }
	),
	withText({
		sampleSent: 'settings.vacationResponse.sampleSent',
		vacationResponseSample: 'settings.vacationResponse.vacationResponseSample'
	}),
	graphql(SendMsgMutation, {
		props: ({ ownProps: { email, vacationResponseSample }, mutate }) => ({
			sendMsg: oooResponse => {
				const mutationObj = {
					variables: {
						to: {
							email: email.account.name,
							name: email.account.attrs.displayName,
							shortName: email.account.attrs.displayName
						},
						subject: vacationResponseSample,
						text: oooResponse.trim()
					}
				};

				return mutate(mutationObj);
			}
		})
	})
)(VacationResponseSettings);
