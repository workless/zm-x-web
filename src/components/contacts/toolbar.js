import { h } from 'preact';

import Toolbar from '../toolbar';
import ToolbarSidebarButton from '../toolbar/sidebar-button';
import ToolbarActionButton from '../toolbar/action-button';
import ToolbarTitle from '../toolbar/title';

import s from './style.less';

export default function ContactsToolbar({ onCompose }) {
	return (
		<Toolbar>
			<ToolbarSidebarButton
				className={s.actionButton}
			/>
			<ToolbarTitle
				text="contacts.title"
			/>
			<div class={s.actionButtons}>
				<ToolbarActionButton
					icon="search"
				/>
				<ToolbarActionButton
					onClick={onCompose}
					icon="plus"
					className={s.composeButton}
				/>
			</div>
		</Toolbar>
	);
}
