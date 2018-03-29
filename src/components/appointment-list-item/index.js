import { h, Component } from 'preact';
import { Icon } from '@zimbra/blocks';
import { format } from 'date-fns';
import ContextMenu from '../context-menu';
import AppointmentPopover from '../appointment-popover';
import colors from '../../constants/colors';
import style from './style.less';

export default class AppointmentListItem extends Component {
	handleClick = e => {
		const { onClick, item } = this.props;
		onClick({ item, loc: { top: e.y, left: e.x } });
	};

	renderItem = ({ openContextMenu }) => {
		const { calendar, startDate, item } = this.props;
		return (
			<div class={style.listItem} onClick={openContextMenu}>
				<p>{!startDate || startDate === '' ? null : format(startDate, 'ddd, D MMM YYYY')}</p>

				{!this.props.isTask ? (
					<p>
						{`${format(startDate, 'h:mm A')} - ${format(
							startDate + item.duration,
							'h:mm A'
						)}`}
					</p>
				) : (
					<p>Task</p>
				)}
				<p>
					{!this.props.isTask && (
						<div class={style.colorInputContainer}>
							<div
								class={style.colorInput}
								style={{
									backgroundColor: calendar
										? colors[calendar.color]
										: colors['0']
								}}
							/>
						</div>
					)}
					{item.name}
				</p>
				{item.alarm === true ? (
					<div class={style.hasAlarmContainer}>
						<Icon class={style.hasAlarmBtn} name="fa:bell" size="sm" />
					</div>
				) : (
					<p />
				)}
			</div>
		);
	};

	render = ({ item, calendar }) => (
		<ContextMenu
			render={this.renderItem}
			menu={
				<AppointmentPopover
					id={item.id}
					calendar={calendar}
					searchResult={item}
				/>
			}
			persistent
			isPopover
		/>
	);
}
