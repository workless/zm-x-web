import { h, Component } from 'preact';
import cx from 'classnames';
import moment from 'moment';

import { KeyCodes } from '@zimbra/blocks';

import FixedPopover from '../fixed-popover';
import MiniCal from '../calendar/mini-cal';
import TextInput from '../text-input';

import s from './style.less';

const FORMAT = 'MM/DD/YY';
const DAY_MONTH = /^[0-9]{1,2}\/[0-9]{1,2}$/;
const DAY_MONTH_YEAR = /^[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4}$/;

class DateInput extends Component {
	state = {
		value: ''
	};

	handleInput = ({ target: { value } }) => {
		this.setState({ value });
		const m = moment(value, ['M/D', 'M/D/YY', 'M/D/YY']);

		if (
			(value.match(DAY_MONTH) || value.match(DAY_MONTH_YEAR)) &&
			m.isValid()
		) {
			this.props.onDateChange(m.toDate());
		}
	};

	onMiniCalChange = nextDate => {
		const { dateValue: prevDateValue } = this.props;
		let nextDateValue = moment(nextDate);

		if (prevDateValue) {
			const year = nextDateValue.year();
			const month = nextDateValue.month();
			const date = nextDateValue.date();

			nextDateValue = moment(prevDateValue)
				.clone()
				.set({
					year,
					month,
					date
				});
		}

		this.setState({ value: nextDateValue.format(FORMAT) });
		this.props.onDateChange(nextDateValue.toDate());
	};

	setValue = props => {
		this.setState({
			value: props.dateValue ? moment(props.dateValue).format(FORMAT) : null
		});
	};

	handleKeyPress = (e, close) => {
		if (e.keyCode === KeyCodes.CARRIAGE_RETURN) {
			close();
			this.setValue();
			this.input.blur();
		}
	};

	componentWillMount() {
		this.setValue(this.props);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.dateValue !== this.props.dateValue) {
			this.setValue(nextProps);
		}
	}

	renderInput = ({ close }) => (
		<TextInput
			type="text"
			value={this.state.value}
			{...this.props}
			onInput={this.handleInput}
			onBlur={this.setValue}
			// eslint-disable-next-line
			onKeyPress={e => this.handleKeyPress(e, close)}
			name={this.props.name && this.props.name}
			class={cx(s.input, this.props.class)}
			// eslint-disable-next-line
			inputRef={ref => (this.input = ref)}
			placeholderId="calendar.search.datePlaceholder"
		/>
	);

	render({ disabled, dateValue, enableClear, onClear, ...props }) {
		return (
			<div class={props.class}>
				<FixedPopover
					/* eslint-disable react/jsx-no-bind */
					popover={({ onClose }) =>
						!disabled && (
							<div class={s.popover}>
								<MiniCal date={dateValue} onNavigate={this.onMiniCalChange} />
								{enableClear &&
									dateValue && (
									<div class={s.clearButtonContainer}>
										<button
											class={s.clearButton}
											onClick={() => {
												onClose();
												onClear();
											}}
										>
												Clear
										</button>
									</div>
								)}
							</div>
						)
					}
					render={this.renderInput}
					disableBackdrop
					persistent
					propagateClicks
					useRectPositioning
				/>
			</div>
		);
	}
}
export default DateInput;
