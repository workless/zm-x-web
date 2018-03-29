import { h, Component } from 'preact';
import InlineModalDialog from '../../../inline-modal-dialog';
import FilterModalContent from './filter-modal-content';
import flatten from 'lodash-es/flatten';
import cloneDeep from 'lodash-es/cloneDeep';
import get from 'lodash-es/get';
import set from 'lodash-es/set';
import concat from 'lodash-es/concat';
import unset from 'lodash-es/unset';
import uniqBy from 'lodash-es/uniqBy';
import mergeWith from 'lodash-es/mergeWith';
import {
	NEW_FILTER_RULE,
	FILTER_TEST_TYPE
} from '../../../../constants/filter-rules';

import cx from 'classnames';
import style from './style.less';

const validate = filterRule => {
	if (!filterRule.name) {
		return 'Filter name is invalid.';
	}
	const testPrefixPath = ['filterTests', '0'];
	const tests = flatten(
		Object
			.keys(get(filterRule, testPrefixPath))
			.filter(testKey => testKey !== 'condition')
			.map(ruleKey => get(filterRule, concat(testPrefixPath, ruleKey)))
	);
	// If a rule has a value it is valid, the predicate must exist.
	const hasAtLeastOneTest = tests.some(({ value }) => Boolean(value));
	if (!hasAtLeastOneTest) {
		return 'You must specify at least one filter rule';
	}
};

// Removes conditions without a value from the filter rule.
const normalize = filterRule => {
	const testPrefixPath = ['filterTests', '0'];
	return Object
		.keys(get(filterRule, testPrefixPath))
		.filter(testKey => testKey !== 'condition')
		.reduce((output, testKey) => {
			const testPath = concat(testPrefixPath, testKey);
			const conditions = get(output, testPath)
				.filter(({ value }) => Boolean(value));
			conditions.length ? set(output, testPath, conditions) : unset(output, testPath);
			return output;
		}, cloneDeep(filterRule));
};

export default class FilterModal extends Component {

	state = {
		uncommittedValue: null,
		error: null
	}

	handleChange = (newUncommittedValue) => {
		this.setState({
			uncommittedValue: newUncommittedValue
		});
	}

	handleSave = () => {
		const error = validate(this.state.uncommittedValue);
		if (!error) {
			this.setState({ error: null });
			const normalized = normalize(this.state.uncommittedValue);
			this.props.onSave(normalized);
		}
		else {
			this.setState({ error });
		}
	}

	handleClose = () => {
		this.setState({ error: null });
		this.props.onClose();
	}

	componentWillMount() {
		this.setState({
			uncommittedValue: this.props.value
				? mergeWith({}, NEW_FILTER_RULE, this.props.value, (objValue, srcValue, key) => {
					if (key === FILTER_TEST_TYPE.ADDRESS && srcValue && objValue)	{
						// We want all filter test rules, not duplicates due to shifted indices.
						return uniqBy([...srcValue, ...objValue], ({ header }) => header);
					}
				})
				: NEW_FILTER_RULE
		});
	}

	render(_, { uncommittedValue, error }) {
		return (
			<InlineModalDialog
				dialogClassName={style.settings}
				wrapperClassName={style.filterModalWrapper}
				innerClassName={style.filterModalInner}
				title="settings.filterRuleModal.title"
				actionLabel="settings.filterRuleModal.saveLabel"
				onAction={this.handleSave}
				onClose={this.handleClose}
			>
				<div>
					{error && (
						<div class={cx(style.error, style.visible)}>{error}</div>
					)}
					<FilterModalContent
						value={uncommittedValue}
						onChange={this.handleChange}
					/>
				</div>
			</InlineModalDialog>
		);
	}
}
