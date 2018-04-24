import moment from 'moment';
import { h, Component } from 'preact';
import Portal from 'preact-portal';
import linkstate from 'linkstate';

import { Button, ClickOutsideDetector } from '@zimbra/blocks';
import FormGroup from '../../form-group';
import TextInput from '../../text-input';
import AlignedForm from '../../aligned-form';
import AlignedLabel from '../../aligned-form/label';

import s from './style.less';

export default class QuickAddEventPopover extends Component {
	state = {
		event: null
	};

	setEvent = props => {
		this.setState({
			event: props.event
		});
	};

	handleSubmit = e => {
		e.preventDefault();
		this.props.onSubmit(this.state.event);
	};

	handleAddMoreDetails = () => {
		this.props.onAddMoreDetails(this.state.event);
	};

	handleClose = () => {
		this.props.onClose();
	};

	handleClickOutside = () => {
		if (this.mounted) {
			this.handleClose();
		}
	};

	componentWillMount() {
		this.setEvent(this.props);
	}

	componentWillReceiveProps(nextProps) {
		this.setEvent(nextProps);
	}

	componentDidUpdate() {
		// Ignore any click-outside-events until after the first call to componentDidUpdate
		// Solves a problem when this component is mounted in the middle of an ongoing click event
		this.mounted = true;
	}

	render({ style }, { event }) {
		return (
			<Portal into="body">
				<ClickOutsideDetector onClickOutside={this.handleClickOutside}>
					<div class={s.container} style={style}>
						<Button
							styleType="floating"
							class={s.closeButton}
							onClick={this.handleClose}
						/>

						<form onSubmit={this.handleSubmit}>
							<AlignedForm>
								<FormGroup compact>
									<AlignedLabel width="60px">Title</AlignedLabel>
									<TextInput
										value={event.name}
										onInput={linkstate(this, 'event.name')}
										wide
										autofocus
									/>
								</FormGroup>
								<FormGroup compact>
									<AlignedLabel width="60px">Location</AlignedLabel>
									<TextInput
										value={event.location}
										onInput={linkstate(this, 'event.location')}
										wide
									/>
								</FormGroup>
								<FormGroup>
									<AlignedLabel width="60px">Date</AlignedLabel>
									<div class={s.dateField}>
										{moment(event.start).format('llll')} -{' '}
										{moment(event.end).format('LT')}
									</div>
								</FormGroup>

								<div>
									<Button
										type="submit"
										class={s.button}
										styleType="primary"
										brand="primary"
									>
										Save
									</Button>
									<Button
										type="button"
										class={s.button}
										onClick={this.handleAddMoreDetails}
									>
										Add More Details
									</Button>
								</div>
							</AlignedForm>
						</form>
					</div>
				</ClickOutsideDetector>
			</Portal>
		);
	}
}
