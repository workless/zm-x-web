import { h } from 'preact';
import SidebarPrimaryButton from '../../sidebar-primary-button';
import MiniCal from '../mini-cal';
import Sidebar from '../../sidebar';
import CalendarList from '../calendar-list';
import style from './style';

export default function CalendarSidebar({
	date,
	view,
	onNavigate,
	openModal,
	onCreateNew,
	calendarsAndAppointmentsData,
	accountInfoData,
	matchesScreenMd
}) {
	return (
		<Sidebar header={!matchesScreenMd}>
			{matchesScreenMd
				? (
					<div class={style.sidebarHeader}>
						<SidebarPrimaryButton
							text="New Event"
							onClick={onCreateNew}
						/>
					</div>
				)
				: (
					<div class={style.sidebarSectionHeader}>
						<span class={style.sidebarSectionHeaderIcon} />
						Calendar
					</div>
				)
			}
			{matchesScreenMd &&
				<MiniCal calendarView={view} date={date} onNavigate={onNavigate} />
			}
			<CalendarList
				openModal={openModal}
				calendarsAndAppointmentsData={calendarsAndAppointmentsData}
				accountInfoData={accountInfoData}
				matchesScreenMd={matchesScreenMd}
			/>
		</Sidebar>
	);
}
