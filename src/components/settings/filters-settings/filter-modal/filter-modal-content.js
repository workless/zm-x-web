import { Component, h } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'preact-redux';
import style from './style.less';
import cx from 'classnames';
import get from 'lodash-es/get';
import concat from 'lodash-es/concat';
import set from 'lodash-es/set';
import toPairs from 'lodash-es/toPairs';
import findIndex from 'lodash-es/findIndex';
import merge from 'lodash-es/merge';
import has from 'lodash-es/has';
import cloneDeep from 'lodash-es/cloneDeep';
import { getFolders } from '../../../../store/folders/selectors';
import {
	FILTER_TEST_TYPE,
	FILTER_CONDITION_DISPLAY,
	RULE_PREDICATE_OPTIONS,
	RULE_ACTION_PATH,
	RULE_PATH_PREFIX
} from '../../../../constants/filter-rules';

// Strips the leading  `/` from a folder path if it exists.
const normalizePath = (absFolderPath = '') => (
	absFolderPath.charAt(0) === '/' ? absFolderPath.slice(1) : absFolderPath
);

// Finds the selected option to display that corresponds to the current state
// of the filterTest. If the filter test contains the option update, we know
// that this is the currently selected option.
const findRulePredicateOption = filterTest => {
	// Some predicate keys are optional, set defaults if they do not exist.
	const filterTestWithDefaults = merge(
		{},
		{ negative: false, part: 'all' },
		filterTest
	);

	const predicateOptionKey = Object.keys(RULE_PREDICATE_OPTIONS).find(optionKey => {
		const option = RULE_PREDICATE_OPTIONS[optionKey];
		return toPairs(option.update).every(([key, value]) => (
			filterTestWithDefaults[key] === value
		));
	});
	return RULE_PREDICATE_OPTIONS[predicateOptionKey];
};

const FILTER_CONDITIONS_CONFIG = [
	{
		label: FILTER_CONDITION_DISPLAY.FROM,
		getRulePath: filterTest => {
			const addressTestIdx = findIndex(
				filterTest[FILTER_TEST_TYPE.ADDRESS],
				addressTest => addressTest.header === 'from'
			);
			return [FILTER_TEST_TYPE.ADDRESS, String(addressTestIdx)];
		},
		predicateOptions: [
			RULE_PREDICATE_OPTIONS.MATCHES_EXACTLY,
			RULE_PREDICATE_OPTIONS.DOES_NOT_MATCH_EXACTLY,
			RULE_PREDICATE_OPTIONS.CONTAINS,
			RULE_PREDICATE_OPTIONS.DOES_NOT_CONTAIN,
			RULE_PREDICATE_OPTIONS.MATCHES_WILDCARD,
			RULE_PREDICATE_OPTIONS.DOES_NOT_MATCH_WILDCARD
		]
	},
	{
		label: FILTER_CONDITION_DISPLAY.TO_OR_CC,
		getRulePath: filterTest => {
			const addressTestIdx = findIndex(
				filterTest[FILTER_TEST_TYPE.ADDRESS],
				addressTest => addressTest.header === 'to,cc'
			);
			return [FILTER_TEST_TYPE.ADDRESS, String(addressTestIdx)];
		},
		predicateOptions: [
			RULE_PREDICATE_OPTIONS.MATCHES_EXACTLY,
			RULE_PREDICATE_OPTIONS.DOES_NOT_MATCH_EXACTLY,
			RULE_PREDICATE_OPTIONS.CONTAINS,
			RULE_PREDICATE_OPTIONS.DOES_NOT_CONTAIN,
			RULE_PREDICATE_OPTIONS.MATCHES_WILDCARD,
			RULE_PREDICATE_OPTIONS.DOES_NOT_MATCH_WILDCARD
		]
	},
	{
		label: FILTER_CONDITION_DISPLAY.SUBJECT,
		getRulePath: filterTest => {
			const headerTestIdx = findIndex(
				filterTest[FILTER_TEST_TYPE.HEADER],
				headerTest => headerTest.header === 'subject'
			);
			return [FILTER_TEST_TYPE.HEADER, String(headerTestIdx)];
		},
		predicateOptions: [
			RULE_PREDICATE_OPTIONS.MATCHES_EXACTLY,
			RULE_PREDICATE_OPTIONS.DOES_NOT_MATCH_EXACTLY,
			RULE_PREDICATE_OPTIONS.CONTAINS,
			RULE_PREDICATE_OPTIONS.DOES_NOT_CONTAIN,
			RULE_PREDICATE_OPTIONS.MATCHES_WILDCARD,
			RULE_PREDICATE_OPTIONS.DOES_NOT_MATCH_WILDCARD
		]
	},
	{
		label: FILTER_CONDITION_DISPLAY.BODY,
		getRulePath: () => ([FILTER_TEST_TYPE.BODY, '0']),
		predicateOptions: [
			RULE_PREDICATE_OPTIONS.BODY_CONTAINS,
			RULE_PREDICATE_OPTIONS.BODY_DOES_NOT_CONTAIN
		]
	}
];

@connect(
	(state) => {
		const folders = getFolders(state, 'message') || [];
		return {
			folders: folders
				.filter((folder) => folder.absFolderPath)
				.map(({ absFolderPath }) => normalizePath(absFolderPath))
		};
	}
)
export default class FilterModalContent extends Component {
	onRulePredicateChange = rulePath => ev => {
		const value = cloneDeep(this.props.value);
		const rule = get(value, rulePath);
		const predicateForValue = RULE_PREDICATE_OPTIONS[ev.target.value];
		merge(rule, predicateForValue.update);
		this.props.onChange(set(value, rulePath, rule));
	}

	onRuleValueChange = rulePath => ev => {
		const value = cloneDeep(this.props.value);
		const rule = get(value, rulePath);
		rule.value = ev.target.value;
		this.props.onChange(set(value, rulePath, rule));
	}

	onRuleMatchCaseChange = rulePath => () => {
		const value = cloneDeep(this.props.value);
		const rule = get(value, rulePath);
		rule.caseSensitive = has(rule, 'caseSensitive') ? !rule.caseSensitive : true;
		this.props.onChange(set(value, rulePath, rule));
	}

	onMoveIntoFolderChange = ev => {
		const value = cloneDeep(this.props.value);
		const action = get(value, RULE_ACTION_PATH);
		action.folderPath = ev.target.value;
		this.props.onChange(set(value, RULE_ACTION_PATH, action));
	}

	onRuleNameChange = ev => {
		const value = cloneDeep(this.props.value);
		value.name = ev.target.value;
		this.props.onChange(value);
	}

	render({ value, folders }) {
		const moveIntoFolderAction = get(value, RULE_ACTION_PATH);
		const selectedFolderPath = folders.find(folderPath => (
			moveIntoFolderAction.folderPath === folderPath
		));
		return (
			<div class={style.filterModalContent}>
				<div class={cx(style.subsection, style.filterNameSubsection)}>
					<div class={style.subsectionTitle}>
						<Text id="settings.filterRuleModal.filterNameLabel">
							Filter Name
						</Text>
					</div>
					<div class={style.subsectionBody}>
						<input
							class={style.textInput}
							type="text"
							onChange={this.onRuleNameChange}
							value={value.name}
						/>
					</div>
				</div>
				<Text id="settings.filterRuleModal.rulePrompt">
					If an incoming message meets all of these conditions
				</Text>
				<div class={style.ruleSection}>
					{FILTER_CONDITIONS_CONFIG.map(({ label, getRulePath, predicateOptions }) => {
						const rulePath = concat(RULE_PATH_PREFIX, getRulePath(get(value, RULE_PATH_PREFIX)));
						const rule = get(value, rulePath, {});
						const selectedPredicateOption = findRulePredicateOption(rule);
						return (
							<div class={style.subsection}>
								<div class={style.subsectionTitle}>
									{label}
								</div>
								<div class={style.subsectionBody}>
									<select
										class={cx(style.select, style.half)}
										value={selectedPredicateOption.value}
										onChange={this.onRulePredicateChange(rulePath)}
									>
										{predicateOptions.map(option => (
											<option value={option.value}>
												{option.label}
											</option>
										))}
									</select>
									<input
										class={style.textInput}
										type="text"
										onChange={this.onRuleValueChange(rulePath)}
										value={rule.value}
									/>
									<label
										class={rule.caseSensitive
											? cx(style.checkbox, style.checked)
											: style.checkbox}
									>
										<input
											type="checkbox"
											onChange={this.onRuleMatchCaseChange(rulePath)}
											checked={rule.caseSensitive}
										/>
										<Text id="settings.filterRuleModal.caseSensitive">
											Match case
										</Text>
									</label>
								</div>
							</div>
						);
					})}
				</div>
				<div class={style.subsection}>
					<div class={cx(style.subsectionTitle, style.moveIntoFolderLabel)}>
						<Text id="settings.filterRuleModal.moveIntoFolderLabel">
							Then move the messages to this folder
						</Text>
					</div>
					<div class={style.subsectionBody}>
						<select
							class={cx(style.select, style.half)}
							value={selectedFolderPath}
							onChange={this.onMoveIntoFolderChange}
						>
							{folders.map((folderPath) => (
								<option value={folderPath}>
									{folderPath}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>
		);
	}
}
