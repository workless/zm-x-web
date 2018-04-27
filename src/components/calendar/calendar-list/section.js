import { h, Component } from 'preact';
import { Icon } from '@zimbra/blocks';
import { CALENDAR_TYPE, CALENDAR_IDS } from '../../../constants/calendars';

import style from './style.less';

export default class CalendarListSectionItem extends Component {

	handleToggleExpanded = () => {
		this.setState({ expanded: !this.state.expanded });
	}

	constructor(props) {
		super(props);
		this.state = {
			expanded: props.initialExpanded
		};
	}


	render({
		type,
		items,
		label,
		renderItem,
		renderAction,
		matchesScreenMd
	}, { expanded }) {
		if (type === CALENDAR_TYPE.own) {
			// Bring Primary Calendar to the top of the list.
			items = items.reduce((sortedItems, item) => {
				(item.id === CALENDAR_IDS[CALENDAR_TYPE.own].DEFAULT) ? sortedItems.unshift(item) : sortedItems.push(item);
				return sortedItems;
			}, []);
		}

		return (
			<li class={style.group}>
				{matchesScreenMd &&
					<div class={style.groupHeader}>
						<div
							class={style.groupToggle}
							onClick={this.handleToggleExpanded}
						>
							<Icon
								name={expanded ? 'angle-down' : 'angle-right'}
								size="sm"
							/>
						</div>
						<div class={style.groupName}>
							{label}
						</div>
						{renderAction()}
					</div>
				}

				{(!matchesScreenMd || expanded) && (
					<ul class={style.list}>
						{items.map((item) => renderItem(item))}
					</ul>
				)}
			</li>
		);
	}
}
