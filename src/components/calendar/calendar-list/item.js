import { h, Component } from 'preact';
import cx from 'classnames';
import { Text } from 'preact-i18n';

import { callWith } from '../../../lib/util';
import { hasFlag } from '../../../utils/folders';
import colorForCalendar from '../../../utils/color-for-calendar';
import withDialog from '../../../enhancers/with-dialog';
import {
	CALENDAR_TYPE
} from '../../../constants/calendars';
import { calendarType as getCalendarType } from '../../../utils/calendar';

import { Icon } from '@zimbra/blocks';
import ContextMenu from '../../context-menu';
import ShareDialog from '../../share-dialog';
import {
	OtherCalendarContextMenu,
	CalendarContextMenu
} from '../../context-menus';

import s from './style.less';

@withDialog('showShareDialog', <ShareDialog />)
export default class CalendarListItem extends Component {

	onChangeColor = value =>
		this.props.changeCalendarColor(this.props.calendar.id, value);

	onDeleteLinkedCalendar = () => {
		let name = this.props.calendar.name;
		this.props
			.folderAction({ op: 'delete', id: this.props.calendar.id })
			.then(() => this.props.calendarsAndAppointmentsData.refetch())
			.then(() => {
				this.props.notify({
					message: (
						<Text
							id="calendar.contextMenu.unlinkShared"
							fields={{ calendarName: name }}
						/>
					)
				});
			});
	}

	openImportModal = (calendar) =>
		this.props.openModal('importCalendarModal', {
			calendarName: calendar.name
		});

	openExportModal = (calendar) =>
		this.props.openModal('exportCalendarModal', {
			calendarName: calendar.name
		});

	renderItem = ({ openContextMenu, matchesScreenMd }) => (
		<div class={s.itemInner}>
			<label class={s.name}>
				{matchesScreenMd &&
					<Icon
						class={s.dropdownToggle}
						name="angle-down"
						size="sm"
						onClick={openContextMenu}
					/>
				}
				<input
					checked={hasFlag(this.props.calendar, 'checked')}
					class={cx(s.checkbox, 'checkbox--empty')}
					onClick={callWith(this.props.checkCalendar, this.props.calendar.id)}
					type="checkbox"
					style={{ backgroundColor: colorForCalendar(this.props.calendar) }}
				/>
				{this.props.calendar.name}
			</label>
		</div>
	)

	renderContextMenu = () => {
		const { calendar, showShareDialog } = this.props;
		const calendarType = getCalendarType(calendar);
		if (CALENDAR_TYPE.own === calendarType ||
				CALENDAR_TYPE.holiday === calendarType) {

			return (
				<CalendarContextMenu
					colorValue={calendar.color}
					onShare={showShareDialog}
					onImport={callWith(this.openImportModal, calendar)}
					onExport={callWith(this.openExportModal, calendar)}
					onChangeColor={this.onChangeColor}
					calendar={calendar}
				/>
			);
		}
		if (CALENDAR_TYPE.other === calendarType) {
			return (
				<OtherCalendarContextMenu
					colorValue={calendar.color}
					onChangeColor={this.onChangeColor}
					onUnlink={this.onDeleteLinkedCalendar}
				/>
			);
		}
	};

	render() {
		const menu = this.renderContextMenu();
		return (
			<li class={s.item}>
				<ContextMenu
					class={s.contextMenu}
					menu={menu}
					render={this.renderItem}
				/>
			</li>
		);
	}
}
