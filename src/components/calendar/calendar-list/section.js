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
		let itemsList = items;

		if (type === CALENDAR_TYPE.own) {
			let defaultCalendarItems = [], otherCalendarItems = [];

			items.forEach(item => {
				(item.id === CALENDAR_IDS[CALENDAR_TYPE.own].DEFAULT) ? defaultCalendarItems.push(item) : otherCalendarItems.push(item);
			});

			itemsList = [ ...defaultCalendarItems, ...otherCalendarItems ];
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
						{itemsList.map((item) => renderItem(item))}
					</ul>
				)}
			</li>
		);
	}
}
