import findIndex from 'lodash/findIndex';
import cloneDeep from 'lodash/cloneDeep';
import head from 'lodash/head';
import tail from 'lodash/tail';
import moment from 'moment';

import { status } from '../constants/calendar-freebusy';

const findInstIndex = (timestamp, instances) =>
	findIndex(instances,
		({ start, end }) => timestamp >= start && timestamp <= end);

const BUSY_STATUSES = [status.BUSY, status.TENTATIVE, status.UNAVAILABLE];

// We render availability as a binary (available, unavailable), so separate
// underlying status may still be considered equal for purposes of building
// up data for display.
const isVisuallyEqual = (statusA, statusB) =>
	BUSY_STATUSES.includes(statusA)
		? BUSY_STATUSES.includes(statusB)
		: !BUSY_STATUSES.includes(statusB);

export const merge = (statuses) => {
	if (!statuses.length) {
		return statuses;
	}

	return tail(statuses).reduce((result, instances) =>
		instances.reduce((memo, inst) => {
			if (BUSY_STATUSES.includes(inst.status)) {
				const startIdx = findInstIndex(inst.start, memo);
				const endIdx = findInstIndex(inst.end, memo);

				// no update necessary, aggregate already reflects this status
				if (isVisuallyEqual(inst.status, memo[startIdx].status) &&
						isVisuallyEqual(inst.status, memo[endIdx].status)) {
					return memo;
				}

				// extend the preceding status instance of the same type to include
				// this instance
				if (isVisuallyEqual(memo[startIdx].status, inst.status)) {
					const updated = cloneDeep(memo);
					updated[startIdx].end = inst.end;
					if (startIdx === endIdx) {
						updated[endIdx].start = inst.end;
					}
					return updated;
				}

				// extend the following status instance of the same type to include
				// this instance
				else if (isVisuallyEqual(memo[endIdx].status, inst.status)) {
					const updated = cloneDeep(memo);
					updated[endIdx].start = inst.start;
					if (endIdx !== startIdx) {
						updated[startIdx].end = inst.start;
					}
					return updated;
				}

				// create a new status in the aggregate status
				const updated = cloneDeep(memo);
				updated.splice(startIdx + 1, 0, inst);
				// update the preceding status to end before the newly insterted status
				updated[startIdx] = {
					...updated[startIdx],
					end: inst.start
				};

				// When we partition a status with a new status, we must insert a new
				// status to patch the "hole" created between the new status and the
				// next status.
				if (startIdx + 2 < updated.length && startIdx === endIdx) {
					const filler = {
						status: updated[startIdx].status,
						start: inst.end,
						end: updated[startIdx + 2].start
					};
					updated.splice(startIdx + 2, 0, filler);
				}
				// If the new status overlaps an existing status, remove the overlapped
				// statuses and adjust the start time of the status at endIdx.
				else if (startIdx !== endIdx) {
					updated.splice(startIdx + 1, (endIdx - startIdx) - 1);
					updated[endIdx] = {
						...updated[endIdx],
						start: inst.end
					};
				}

				return updated;
			}
			return memo;
		}, result), cloneDeep(head(statuses)));
};

export const hoursDecimal = (timestamp) => {
	const momentTime = moment(timestamp);
	return (
		momentTime.hours() +
		(momentTime.minutes() / 60) +
		(momentTime.seconds() / 3600) +
		(momentTime.milliseconds() / (3600 * 1000))
	);
};
