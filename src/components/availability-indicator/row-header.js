import { h } from 'preact';

import { Icon } from '@zimbra/blocks';
import Select from '../select';

import flow from 'lodash/flow';

import s from './style.less';

import { ATTENDEE_ROLE } from '../../constants/calendars';

const IS_REQUIRED_OPTIONS = [
	{ label: 'Required', value: ATTENDEE_ROLE.required },
	{ label: 'Not Required', value: ATTENDEE_ROLE.optional }
];

const eventValue = (ev) => ev.target.value;
const displayAttendee = (attendee) =>
	attendee.name
		? attendee.name
		: attendee.address;

export default function RowHeader({
	attendee,
	disableRequiredToggle,
	onChangeIsRequired,
	isRequired
}) {
	return (
		<div class={s.tableRowHeader}>
			{disableRequiredToggle
				? (
					<div>{displayAttendee(attendee)}</div>
				)
				: (
					<div class={s.requiredToggle}>
						<div class={s.selectLabel}>
							<Icon
								name={isRequired ? 'user' : 'user-o'}
								size="md"
							/>
							<Icon
								class={s.downAngleIcon}
								name="angle-down"
								size="sm"
							/>
							<div>{displayAttendee(attendee)}</div>
						</div>
						<div class={s.selectContainer}>
							<Select
								value={isRequired ? ATTENDEE_ROLE.required : ATTENDEE_ROLE.optional}
								onChange={flow(eventValue, onChangeIsRequired)}
							>
								{IS_REQUIRED_OPTIONS.map(({ value, label }) => (
									<option value={value} key={label}>
										{label}
									</option>
								))}
							</Select>
						</div>
					</div>
				)}
		</div>
	);
}
