import { h } from 'preact';
import SidebarPrimaryButton from '../sidebar-primary-button';
import Sidebar from '../sidebar';
import RefinerList from '../refiner-list';
import style from './style';

export default function CalendarSidebar({
	after,
	before,
	filterItems,
	items,
	onNavigateBack,
	setDateValue,
	types
}) {
	return (
		<Sidebar header={false}>
			<div class={style.sidebarHeader}>
				<SidebarPrimaryButton text="Back to Calendar" onClick={onNavigateBack} />
			</div>
			<RefinerList
				after={after}
				before={before}
				filterItems={filterItems}
				items={items}
				setDateValue={setDateValue}
				types={types}
			/>
		</Sidebar>
	);
}
