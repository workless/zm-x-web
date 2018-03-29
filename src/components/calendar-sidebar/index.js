import { h } from 'preact';
import SidebarPrimaryButton from '../sidebar-primary-button';
import Sidebar from '../sidebar';
import RefinerList from '../refiner-list';
import style from './style';

export default function CalendarSidebar({
	after,
	before,
	accountInfoData,
	calendarsAndAppointmentsData,
	filterItems,
	items,
	onNavigateBack,
	openModal,
	setDateValue,
	types
}) {
	return (
		<Sidebar header={false}>
			<div class={style.sidebarHeader}>
				<SidebarPrimaryButton
					icon="fa:angle-left"
					text="Back to Calendar"
					onClick={onNavigateBack}
					openModal={openModal}
					calendarsAndAppointmentsData={calendarsAndAppointmentsData}
					accountInfoData={accountInfoData}
				/>
			</div>
			<RefinerList
				after={after}
				before={before}
				filterItems={filterItems}
				items={items}
				openModal={openModal}
				setDateValue={setDateValue}
				types={types}
			/>
		</Sidebar>
	);
}
