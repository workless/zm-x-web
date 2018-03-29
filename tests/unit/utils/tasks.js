import * as taskUtils from 'src/utils/tasks';
import get from 'lodash-es/get';
import addDays from 'date-fns/add_days';
import format from 'date-fns/format';
import isTomorrow from 'date-fns/is_tomorrow';
import { COMPLETE_STATUS, NEED_STATUS } from 'src/constants/tasks';

describe('Task Utilities', () => {
	const initialTask = {
		id: '1',
		instances: [{
			dueDate: 1
		}]
	};

	describe('getDueDate', () => {
		const { getDueDate } = taskUtils;
		it('should return task.instances[0].dueDate', () => {
			expect(getDueDate(initialTask)).to.equal(initialTask.instances[0].dueDate);
		});
	});

	describe('setDueDate', () => {
		const { setDueDate } = taskUtils;
		it('should set a timestamp as `instances[0].dueDate`', () => {
			const expectedDate = new Date('2200-12-25T03:14:00');
			const nextTask = setDueDate(initialTask, expectedDate);

			expect(nextTask.instances[0].dueDate).to.equal(expectedDate.getTime());
		});

		it('should set a formatted date string (YYYY-MM-DD) as `dueDate`', () => {
			const expectedDate = new Date('2200-12-25T03:14:00');
			const nextTask = setDueDate(initialTask, expectedDate);

			expect(nextTask.dueDate).to.equal('2200-12-25');
		});
	});

	describe('postponeTask', () => {
		const { postponeTask, getDueDate } = taskUtils;

		it('should return the same task if the task has no dueDate', () => {
			const task = {};
			expect(task).to.equal(postponeTask(task));
		});

		it('should return a new task', () => {
			expect(initialTask).to.not.equal(postponeTask(initialTask));
		});

		it('should return a task with a dueDate that is later than the original task', () => {
			expect(
				getDueDate(initialTask)
			).to.be.below(
				getDueDate(postponeTask(initialTask))
			);
		});

		it('should return a task with a dueDate increased by one day when given default arguments', () => {
			const expectedTime = addDays(getDueDate(initialTask), 1);
			const nextTask = postponeTask(initialTask);

			expect(getDueDate(nextTask)).to.equal(expectedTime.getTime());

		});


		it('should accept a fromTime value to begin postponement from', () => {
			const initialDueDate = getDueDate(initialTask)

			// Starting from five days, add one to get six days.
			const fromTime = addDays(initialDueDate, 5);
			const expectedTime = addDays(initialDueDate, 6);

			const nextTask = postponeTask(initialTask, fromTime);

			expect(getDueDate(nextTask)).to.equal(expectedTime.getTime());
		});

		it('should accept a number of days to postpone', () => {
			const initialDueDate = getDueDate(initialTask);
			const numDays = 6;
			const expectedTime = addDays(initialDueDate, numDays);

			const nextTask = postponeTask(initialTask, undefined, numDays);

			expect(getDueDate(nextTask)).to.equal(expectedTime.getTime());
		});

		it('should accept a both fromTime and a number of days to postpone', () => {
			const initialDueDate = getDueDate(initialTask);
			const numDays = 6;
			const fromTime = new Date('2200-12-25T03:14:00');
			const expectedTime = addDays(fromTime, numDays);

			const nextTask = postponeTask(initialTask, fromTime, numDays);

			expect(getDueDate(nextTask)).to.equal(expectedTime.getTime());
		});
	});
});
