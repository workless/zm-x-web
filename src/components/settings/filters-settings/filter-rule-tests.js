import { h } from 'preact';
import flatMap from 'lodash-es/flatMap';
import { FILTER_TEST_TYPE } from '../../../constants/filter-rules';

import style from '../style';

function formatTestPredicate (stringComparison, negative) {
	if (stringComparison === 'is' && !negative) return 'is';
	if (stringComparison === 'is' && negative) return 'is not';
	if (stringComparison === 'contains' && !negative) return 'contains';
	if (stringComparison === 'contains' && negative) return 'does not contain';
	if (stringComparison === 'matches' && !negative) return 'matches wildcard condition';
	if (stringComparison === 'matches' && negative) return 'does not match wildcard condition';
}

function formatTestHeader (header) {
	if (header === 'to,cc') return 'To/CC';
	return header.charAt(0).toUpperCase() + header.slice(1);
}


/**
 * Creates human-readable displays of filter rule test conditions.
 *
 */
export default function FilterRuleTests({ test }) {
	return (
		<ul class={style.filterRuleTestsList}>
			{flatMap(Object.keys(test), filterTestKey => {
				if (FILTER_TEST_TYPE.BODY === filterTestKey) {
					return test[filterTestKey].map(({ value, negative, caseSensitive }) => {
						const pred = negative ? 'does not contain' : 'contains';
						return (
							<li>
								Body {pred} <b>"{value}"</b> {caseSensitive && '(match case)'}
							</li>
						);
					});
				}
				if (FILTER_TEST_TYPE.ADDRESS === filterTestKey) {
					return test[filterTestKey]
						.map(({ header, value, stringComparison, negative, caseSensitive }) => {
							const pred = formatTestPredicate(stringComparison, negative);
							const part = formatTestHeader(header);
							return (
								<li>
									{part} {pred} <b>"{value}"</b> {caseSensitive && '(match case)'}
								</li>
							);
						});
				}

				if (FILTER_TEST_TYPE.HEADER === filterTestKey) {
					return test[filterTestKey]
						.map(({ header, value, stringComparison, negative, caseSensitive }) => {
							const pred = formatTestPredicate(stringComparison, negative);
							const part = formatTestHeader(header);
							return (
								<li>
									{part} {pred} <b>"{value}"</b> {caseSensitive && '(match case)'}
								</li>
							);
						});
				}
			})}
		</ul>
	);
}
