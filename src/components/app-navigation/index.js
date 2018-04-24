import { h, Component } from 'preact';
import { Text } from 'preact-i18n';
import ToolbarPortalTarget from './toolbar-portal-target';
import MenuItem from '../menu-item';
import ZimletSlot from '../zimlet-slot';
import AppNavigationTabs from './tabs';
import { configure } from '../../config';

import cx from 'classnames';
import style from './style';
import withMediaQuery from '../../enhancers/with-media-query';
import { minWidth, screenMd } from '../../constants/breakpoints';
import { connect } from 'preact-redux';

const MenuItemView = ( { desktopView, slugs, ...listItem } ) => (
	<MenuItem
		key={listItem.name}
		sidebarEnable={!desktopView}
		responsive
		noBorder={!desktopView}
		icon={listItem.icon}
		iconText={listItem.iconText}
		class={cx(style.navMenuItem, !desktopView && style.sidebarNav )}
		href={listItem.href}
		match={`/${slugs[listItem.name]}/`}
	>
		<Text id={`appNavigation.${listItem.name}`} />
	</MenuItem> );

@withMediaQuery(minWidth(screenMd), 'desktopView')
@configure('routes.slugs')
@connect( state => ({
	url: state.url
}), null )
export default class AppNavigation extends Component {

	getNavList = () => {
		const slugs = this.props.slugs;
		return [{
			name: 'email',
			href: '/',
			match: `/${slugs.email}/`,
			icon: 'envelope',
			iconText: null
		},
		{
			name: 'contacts',
			href: `/${slugs.contacts}`,
			match: `/${slugs.contacts}/`,
			icon: 'address-book',
			iconText: null
		},
		{
			name: 'calendar',
			href: `/${slugs.calendar}`,
			match: `/${slugs.calendar}/`,
			icon: 'calendar-o',
			iconText: new Date().getDate()
		}];
	}

	render({ slugs, desktopView, renderBefore, renderAfter, url }) {

		const navList = this.getNavList();
		let matchedRoute, listView = [];

		for ( let listItem of navList ) {
			if ( renderBefore || renderAfter ) {

				if ( renderBefore && !matchedRoute ) {
					listView.push( <MenuItemView desktopView={desktopView} slugs={slugs} {...listItem} /> );
				}
				else if ( renderAfter && matchedRoute ) {
					listView.push( <MenuItemView desktopView={desktopView} slugs={slugs} {...listItem} /> );
				}

				matchedRoute = listItem.name === url.view || matchedRoute;
			}
			else {
				listView.push( <MenuItemView desktopView={desktopView} slugs={slugs} {...listItem} /> );
			}
		}

		return (
			<div class={style.appMenu}>
				<div class={cx( !( renderBefore || renderAfter ) && style.hideSmDown, style.nav, !desktopView && style.sidebarNavWrapper)}>
					{ listView }
					{ !renderBefore && <ZimletSlot props class={style.slot} name="menu" /> }
					{ desktopView && <AppNavigationTabs /> }
				</div>
				<ToolbarPortalTarget />
			</div>
		);
	}
}
