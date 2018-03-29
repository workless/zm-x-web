import { h, Component } from 'preact';
import ToolbarPortalTarget from './toolbar-portal-target';
import MenuItem from '../menu-item';
import ZimletSlot from '../zimlet-slot';
import AppNavigationTabs from './tabs';
import { configure } from '../../config';

import cx from 'classnames';
import style from './style';

@configure('routes.slugs')
export default class AppNavigation extends Component {
	render({ slugs }) {
		return (
			<div class={style.appMenu}>
				<div class={cx(style.hideSmDown, style.nav)}>
					<MenuItem
						responsive
						icon="envelope"
						class={style.navMenuItem}
						href="/"
						match={`/${slugs.email}/`}
					>
						Mail
					</MenuItem>
					<MenuItem
						responsive
						icon="address-book"
						class={style.navMenuItem}
						href={`/${slugs.contacts}`}
						match={`/${slugs.contacts}/`}
					>
						Contacts
					</MenuItem>
					<MenuItem
						responsive
						icon="calendar-o"
						iconText={new Date().getDate()}
						class={style.navMenuItem}
						href={`/${slugs.calendar}`}
						match={`/${slugs.calendar}/`}
					>
						Calendar
					</MenuItem>
					<ZimletSlot props class={style.slot} name="menu" />
					<AppNavigationTabs />
				</div>
				<ToolbarPortalTarget />
			</div>
		);
	}
}
