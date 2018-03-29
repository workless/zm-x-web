import { h, Component } from 'preact';

import RowHeader from './row-header';
import RowBody from './row-body';
import Gridlines from './gridlines';
import GridlineLabels, { GridlineLabelSpacer } from './gridline-labels';
import EventOutline from './event-outline';

import s from './style.less';

const CELL_WIDTH = 39;
const CELL_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'NOON', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const CELL_LABEL_HEIGHT = 20;

export default function IndicatorTable({ freeBusy, onChangeIsRequired, event }) {
	return (
		<div class={s.availabilityTable}>
			<div class={s.tableHeader}>
				<GridlineLabelSpacer
					labelHeight={CELL_LABEL_HEIGHT}
				/>
				{freeBusy && freeBusy.map(({
					attendee,
					disableRequiredToggle,
					isRequired
				}) => (
					<IndicatorTableRowHeader attendee={attendee} disableRequiredToggle={disableRequiredToggle} onChangeIsRequired={onChangeIsRequired} isRequired={isRequired} />
				))}
			</div>
			<div class={s.tableBody}>
				<div style={{ width: CELL_WIDTH * CELL_LABELS.length }}>
					<GridlineLabels
						cellWidth={CELL_WIDTH}
						labelHeight={CELL_LABEL_HEIGHT}
						labels={CELL_LABELS}
					/>
					{freeBusy && freeBusy.map(({
						statuses
					}) => (
						<RowBody
							statuses={statuses}
							cellWidth={CELL_WIDTH}
						/>
					))}
					<Gridlines
						labels={CELL_LABELS}
						cellWidth={CELL_WIDTH}
						labelHeight={CELL_LABEL_HEIGHT}
					/>
					<EventOutline
						labelHeight={CELL_LABEL_HEIGHT}
						cellWidth={CELL_WIDTH}
						event={event}
					/>
				</div>
			</div>
		</div>
	);
}

class IndicatorTableRowHeader extends Component {
	partialOnChangeIsRequired = (role) => this.props.onChangeIsRequired(this.props.attendee, role);

	render({ attendee, disableRequiredToggle, isRequired }) {
		return (
			<RowHeader
				attendee={attendee}
				disableRequiredToggle={disableRequiredToggle}
				onChangeIsRequired={this.partialOnChangeIsRequired}
				isRequired={isRequired}
			/>
		);
	}
}
