export const FILTER_TEST_TYPE = {
	BODY: 'bodyTest',
	ADDRESS: 'addressTest',
	HEADER: 'headerTest'
};

export const FILTER_ACTION_TYPE = {
	FILE_INTO: 'actionFileInto'
};

export const FILTER_CONDITION_DISPLAY = {
	FROM: 'From',
	TO_OR_CC: 'To/CC',
	SUBJECT: 'Subject',
	BODY: 'Body'
};

export const RULE_PATH_PREFIX = ['filterTests', '0'];
export const RULE_ACTION_PATH = ['filterActions', '0', FILTER_ACTION_TYPE.FILE_INTO, '0'];

export const	RULE_PREDICATE_OPTIONS = {
	MATCHES_EXACTLY: {
		label: 'matches exactly',
		update: { stringComparison: 'is', negative: false, part: 'all' },
		value: 'MATCHES_EXACTLY'
	},
	DOES_NOT_MATCH_EXACTLY: {
		label: 'does not match exactly',
		update: { stringComparison: 'is', negative: true, part: 'all' },
		value: 'DOES_NOT_MATCH_EXACTLY'
	},
	DOES_NOT_CONTAIN: {
		label: 'does not contain',
		value: 'DOES_NOT_CONTAIN',
		update: { stringComparison: 'contains', negative: true, part: 'all' }
	},
	CONTAINS: {
		label: 'contains',
		value: 'CONTAINS',
		update: { stringComparison: 'contains', negative: false, part: 'all' }
	},
	MATCHES_WILDCARD: {
		label: 'matches wildcard condition',
		value: 'MATCHES_WILDCARD',
		update: { stringComparison: 'matches', negative: false, part: 'all' }
	},
	DOES_NOT_MATCH_WILDCARD: {
		label: 'does not match wildcard condition',
		value: 'DOES_NOT_MATCH_WILDCARD',
		update: { stringComparison: 'matches', negative: true, part: 'all' }
	},
	BODY_CONTAINS: {
		label: 'contains',
		value: 'BODY_CONTAINS',
		update: { negative: false }
	},
	BODY_DOES_NOT_CONTAIN: {
		label: 'does not contain',
		value: 'BODY_DOES_NOT_CONTAIN',
		update: { negative: true }
	}
};

export const NEW_FILTER_RULE = {
	name: '',
	active: true,
	filterActions: [{
		[FILTER_ACTION_TYPE.FILE_INTO]: [{
			index: 0,
			folderPath: 'Inbox'
		}]
	}],
	filterTests: [{
		condition: 'allof',
		[FILTER_TEST_TYPE.ADDRESS]: [
			{
				...RULE_PREDICATE_OPTIONS.CONTAINS.update,
				index: 0,
				header: 'from',
				value: ''
			},
			{
				...RULE_PREDICATE_OPTIONS.CONTAINS.update,
				index: 1,
				header: 'to,cc',
				value: ''
			}
		],
		[FILTER_TEST_TYPE.HEADER]: [{
			...RULE_PREDICATE_OPTIONS.CONTAINS.update,
			index: 2,
			header: 'subject',
			value: ''
		}],
		[FILTER_TEST_TYPE.BODY]: [{
			...RULE_PREDICATE_OPTIONS.BODY_CONTAINS.update,
			value: '',
			index: 3
		}]
	}]
};
