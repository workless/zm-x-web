import { h, Component } from 'preact';
import { withText, Text } from 'preact-i18n';
import linkstate from 'linkstate';
import { graphql } from 'react-apollo';
import isNil from 'lodash-es/isNil';
import some from 'lodash-es/some';
import { errorMessage } from '../../../utils/errors';

import CalendarCreateMutation from '../../../graphql/queries/calendar/calendar-create.graphql';

import ModalDialog from '../../modal-dialog';
import ColorPicker from '../../color-picker';
import TextInput from '../../text-input';

import style from './style';

@withText({
	duplicateCalendarError:
		'calendar.dialogs.newCalendar.ERROR_DUPLICATE_CALENDAR',
	inputPlaceholder: 'calendar.dialogs.newCalendar.INPUT_PLACEHOLDER'
})
@graphql(CalendarCreateMutation, {
	props: ({
		ownProps: { refetchCalendars, calendarType, onClose },
		mutate
	}) => ({
		createCalendar: (name, color, url) =>
			mutate({
				variables: {
					name,
					color,
					url
				}
			}).then(() => {
				switch (calendarType) {
					case 'Holidays': {
						onClose('Holidays');
						break;
					}
					default: {
						onClose();
						break;
					}
				}
				refetchCalendars();
			})
	})
})
export default class CreateCalendarModal extends Component {
	state = {
		calendarName: '',
		calendarColor: 1,
		loading: false,
		error: null
	};

	validate = (calendarName, calendars) => {
		const nameExists = some(calendars, ({ name }) => name === calendarName);
		if (nameExists) {
			return this.props.duplicateCalendarError;
		}
	};

	onChangeColor = value => {
		this.setState({ calendarColor: value });
	};

	onAction = () => {
		const error = this.validate(
			this.state.calendarName,
			this.props.calendarsData.calendars
		);
		if (!error) {
			this.setState(
				{ loading: true },
				() =>
					this.props.createCalendar !== undefined &&
					this.props
						.createCalendar(
							this.state.calendarName,
							this.state.calendarColor,
							this.props.predefinedUrl || undefined
						)
						.catch(e => {
							this.setState({ loading: false, error: errorMessage(e) });
						})
			);
		}
		else {
			this.setState({ error });
		}
	};

	componentWillMount = () => {
		if (!isNil(this.props.predefinedName)) {
			this.setState({
				calendarName: this.props.predefinedName
			});
		}
	};

	render(
		{ onClose, inputPlaceholder },
		{ calendarName, calendarColor, error, loading }
	) {
		return (
			<ModalDialog
				title="calendar.dialogs.newCalendar.DIALOG_TITLE"
				actionLabel="buttons.save"
				onAction={this.onAction}
				onClose={onClose}
				class={style.createCalendarModal}
				contentClass={style.createCalendarModalContent}
				disablePrimary={calendarName.length === 0 || isNil(calendarColor)}
				pending={loading}
				error={error}
			>
				<TextInput
					value={calendarName}
					onInput={linkstate(this, 'calendarName')}
					placeholder={inputPlaceholder}
					wide
				/>
				<div class={style.colorPickerContainer}>
					<div>
						<Text id="calendar.dialogs.newCalendar.COLOR_LABEL">Color</Text>
					</div>
					<div class={style.colorPicker}>
						<ColorPicker onChange={this.onChangeColor} value={calendarColor} />
					</div>
				</div>
			</ModalDialog>
		);
	}
}
