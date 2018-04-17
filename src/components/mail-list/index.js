import { h, Component } from 'preact';
import cx from 'classnames';
import debounce from 'lodash/debounce';
import { groupByList } from '../../constants/mailbox-metadata';

import { getMailboxMetadata } from '../../graphql-decorators/mailbox-metadata';

import MailListItem from '../mail-list-item';
import orderedGroupByPairs from '../../utils/ordered-group-by-pairs';
import { getDateKey } from '../../lib/util';

import s from './style.less';

const SCROLL_BUFFER = 500;

@getMailboxMetadata()
export default class MailList extends Component {
	static defaultProps = {
		viewingId: null,
		wide: true,
		selectedIds: new Set()
	};

	listRef = c => {
		this.list = c;
	};

	groupItems = () => {
		const { items, sortBy, groupByList: groupBy } = this.props;

		if (groupBy === groupByList.values.date && (!sortBy || sortBy.match(/^date/))) {
			return orderedGroupByPairs(items.data, m => getDateKey(m.date));
		}

		return [[null, items.data]];
	};

	handleSubScroll = () => {
		const offset = this.list.scrollTop;
		const max = this.list.scrollHeight - this.list.offsetHeight;

		if (offset === 0) {
			this.props.toggleInlineSearchVisibility(true);
		}
		else {
			this.props.toggleInlineSearchVisibility(false);
		}

		if (offset > max - window.innerHeight / 2 - SCROLL_BUFFER) {
			this.props.onScroll();
		}
	};

	componentWillReceiveProps = nextProps => {
		if (nextProps.clicked) {
			this.list.scrollTop = 0;
			this.props.setClicked();
		}
	};

	render() {
		const {
			items,
			folderName,
			handleItemClick,
			handleItemDblClick,
			handleItemCheckboxSelect,
			onSpam,
			onArchive,
			onBlock,
			onAddToContacts,
			selectedIds,
			showSnippets,
			viewingId,
			sortBy,
			messageListDensity,
			...rest
		} = this.props;

		return (
			<div
				{...rest}
				class={cx(s.scrollableList, rest.class)}
				ref={this.listRef}
				onScroll={debounce(this.handleSubScroll, 200)}
				tabIndex="0"
				scrollbar
			>
				{items.data &&
					this.groupItems().map(([label, itemsByDate]) => (
						<div class={s.messageGroup}>
							{label && (
								<div
									class={cx(s.dateRowLabel, s.hideSmDown, rest.wide && s.wideDateRowLabel)}
								>
									{label}
								</div>
							)}
							<div>
								{itemsByDate.map(i => (
									<MailListItem
										{...rest}
										item={i}
										isViewing={
											selectedIds.size === 0 && viewingId === i.id.toString()
										}
										isSelected={selectedIds.has(i.id)}
										selectedIds={selectedIds}
										onClick={handleItemClick}
										onDblClick={handleItemDblClick}
										onMarkSpam={onSpam}
										onArchive={onArchive}
										onAddToContacts={onAddToContacts}
										onBlock={onBlock}
										onCheckboxSelect={handleItemCheckboxSelect}
										showSnippet={showSnippets}
										density={messageListDensity}
										showSize={sortBy.indexOf('size') === 0}
									/>
								))}
							</div>
						</div>
					))}
			</div>
		);
	}
}
