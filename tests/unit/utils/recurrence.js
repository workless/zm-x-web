import { getFrequency } from 'src/utils/recurrence';

function createRecurrence(frequency, days, intervalCount) {
	return {
		add: [{
			rule: [{
				frequency,
				byday: [{
					wkday: days
				}],
				interval: [{
					intervalCount
				}]
			}]
		}]
	};
}

describe('getFrequency', () => {
	it('should return undefined if there is no frequency', () => {
		const recurrence = createRecurrence(
			undefined,
			[],
			0
		);

		expect(getFrequency(recurrence)).to.equal(undefined);
	});

	it('should print "Every weekday." for events occur on all weekdays', () => {
		const recurrence = createRecurrence(
			'YEA',
			[{ day: 'MO' }, { day: 'TU' }, { day: 'WE' }, { day: 'TH' }, { day: 'FR'}],
			0
		);

		expect(getFrequency(recurrence)).to.equal("Every weekday.");
	});

	it('should print "Every week on Monday." for events occuring every week on Monday', () => {
		const recurrence = createRecurrence(
			'WEE',
			[{ day: 'MO' }],
			0
		);

		expect(getFrequency(recurrence)).to.equal("Every week on Monday.");
	});

	it('should print "Every year on Tuesday." for events occuring every year on Tuesday', () => {
		const recurrence = createRecurrence(
			'YEA',
			[{ day: 'TU' }],
			0
		);

		expect(getFrequency(recurrence)).to.equal("Every year on Tuesday.");
	});

	it('should print "Every month on Friday." for events occuring every month on Friday', () => {
		const recurrence = createRecurrence(
			'MON',
			[{ day: 'FR' }],
			0
		);

		expect(getFrequency(recurrence)).to.equal("Every month on Friday.");
	});
});
