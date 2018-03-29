import { h, Component } from 'preact';
import wire from 'wiretie';
import linkState from 'linkstate';
import { Text } from 'preact-i18n';
import { graphql } from 'react-apollo';
import { connect } from 'preact-redux';

import CalendarCreateSharedMutation from '../../../graphql/queries/calendar/calendar-create-shared.graphql';

import ModalDialog from '../../modal-dialog';
import OwnerEmailInput from './owner-email-input';
import SharedCalendarInput from './shared-calendar-input';

import { notify } from '../../../store/notifications/actions';
import { isValidEmail } from '../../../lib/util';

import style from './style.less';

const activePanelType = {
	EMAIL: 'email',
	CALENDAR_DETAILS: 'calendar-details'
};

@wire('zimbra', null, (zimbra) => ({
	getShareInfo: zimbra.share.getInfo
}))
@connect(null, { notify })
@graphql(CalendarCreateSharedMutation, {
	props: ({ ownProps: { onRefetchCalendars, notify: displayNotification }, mutate }) => ({
		createSharedCalendar: (variables) => (
			mutate({ variables })
				.then(() => onRefetchCalendars())
				.then(() => {
					displayNotification({
						message: (
							<Text
								id="calendar.dialogs.newSharedCalendar.CALENDAR_LINKED_TOAST"
								fields={{ calendarName: variables.sharedCalendar.name }}
							/>
						)
					});
				})
		)
	})
})
export default class CreateSharedCalendarModal extends Component {
	state = {
		calendar: {
			ownerId: '',
			ownerCalendarId: '',
			name: '',
			color: '1',
			reminder: false
		},
		ownerCalendarTitleOptions: [],
		ownerEmailAddress: '',
		error: '',
		activePanel: activePanelType.EMAIL,
		activePanelPending: false
	}

	handleAction = () => {
		if (this.state.activePanel === activePanelType.EMAIL) {
			const [name] = this.state.ownerEmailAddress.split('@');
			this.setState({ activePanelPending: true }, () => {
				this.props.getShareInfo(name)
					.then((shares) => {
						if (shares.length) {
							const ownerCalendarOptions =  shares.map(({ folderPath, folderId }) => ({
								// truncate leading "/" of abs path
								label: folderPath.slice(1),
								value: folderId
							}));
							this.setState({
								error: null,
								activePanelPending: false,
								activePanel: activePanelType.CALENDAR_DETAILS,
								calendar: {
									...this.state.calendar,
									ownerCalendarId: ownerCalendarOptions[0].value,
									// ownerId is constant across share options
									ownerId: shares[0].ownerId
								},
								ownerCalendarOptions
							});
						}
						else {
							this.setState({
								activePanelPending: false,
								error: {
									id: 'calendar.dialogs.newSharedCalendar.NO_SHARES_FOR_EMAIL_ERROR',
									fields: {
										providerName: this.props.providerName,
										email: this.state.ownerEmailAddress
									}
								}
							});
						}
					});
			});
		}
		else {
			const isValid = this.props.validateNewSharedCalendar(this.state.calendar);
			if (isValid) {
				this.setState({
					error: null,
					activePanelPending: true
				}, () => {
					this.props
						.createSharedCalendar({ sharedCalendar: this.state.calendar })
						.then(() => {
							this.setState({ activePanelPending: false });
							this.props.onClose();
						});
				});
			}
			else {
				this.setState({
					error: {
						id: 'calendar.dialogs.newSharedCalendar.ERROR_DUPLICATE_CALENDAR'
					}
				});
			}
		}
	}

	handleCalendarDetailsChange = (calendarDetails) => {
		this.setState({
			calendar: {
				...this.state.calendar,
				...calendarDetails
			}
		});
	}

	disableActionForPanel = (activePanel) => (
		activePanel === activePanelType.EMAIL
			? !isValidEmail(this.state.ownerEmailAddress)
			: this.state.calendar.name.length === 0
	)

	render (
		{ onClose, providerName },
		{ activePanel, activePanelPending, calendar, error, ownerCalendarOptions, ownerEmailAddress }
	) {
		return (
			<ModalDialog
				title="calendar.dialogs.newSharedCalendar.DIALOG_TITLE"
				actionLabel="buttons.save"
				onAction={this.handleAction}
				onClose={onClose}
				class={style.createSharedCalendarModal}
				contentClass={style.createSharedCalendarModalContent}
				disablePrimary={this.disableActionForPanel(activePanel)}
				pending={activePanelPending}
				error={error}
			>
				{activePanel === activePanelType.EMAIL
					? (
						<OwnerEmailInput
							value={ownerEmailAddress}
							onChange={linkState(this, 'ownerEmailAddress')}
							providerName={providerName}
						/>
					)
					: (
						<SharedCalendarInput
							value={calendar}
							onChange={this.handleCalendarDetailsChange}
							ownerCalendarOptions={ownerCalendarOptions}
							ownerEmailAddress={ownerEmailAddress}
						/>
					)}
			</ModalDialog>
		);
	}
}
