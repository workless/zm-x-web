import { h } from 'preact';
import { Text } from 'preact-i18n';
import MailTypeTabs from './mail-type-tabs';
import s from './style.less';

export default function SearchToolbar({ items, more, limit, handleSetPane }) {
	let resultCount = items ? (more ? limit : items.length) : 0;

	return (
		<div class={s.toolbar}>
			<MailTypeTabs handleSetPane={handleSetPane} />
			<Text
				id="search.results"
				plural={resultCount}
				fields={{
					count: items && more ? resultCount + '+' : resultCount
				}}
			>
				No results
			</Text>
		</div>
	);
}
