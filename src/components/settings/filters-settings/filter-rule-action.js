import { h } from 'preact';

import { FILTER_ACTION_TYPE } from '../../../constants/filter-rules';

export default function FilterRuleAction({ action }) {
	const folderPath = action[FILTER_ACTION_TYPE.FILE_INTO][0].folderPath;
	return (
		<span>Deliver to "<b>{folderPath}</b>"</span>
	);
}
