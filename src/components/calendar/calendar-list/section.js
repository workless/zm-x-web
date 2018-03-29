import { h, Component } from 'preact';
import { Icon } from '@zimbra/blocks';

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
		items,
		label,
		renderItem,
		renderAction,
		matchesScreenMd
	}, { expanded }) {
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
