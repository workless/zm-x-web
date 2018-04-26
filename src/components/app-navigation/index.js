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

	getMatchedItemIndex( list ) {
		return list.findIndex( ( item ) => (item.name === this.props.url.view));
	}

	getPreItems ( list ) {
		return list.slice( 0, this.getMatchedItemIndex( list ) + 1 );
	}

	getPostItems( list ) {
		return list.slice( this.getMatchedItemIndex( list ) + 1, list.lenght );
	}

	render({ slugs, desktopView, renderBefore, renderAfter }) {

		const navList = this.getNavList();
		const listItems = renderBefore ? this.getPreItems( navList ) : ( renderAfter ? this.getPostItems( navList ) : navList );

		return (
			<div class={style.appMenu}>
				<div class={cx( !( renderBefore || renderAfter ) && style.hideSmDown, style.nav, !desktopView && style.sidebarNavWrapper)}>
					{ listItems.map( ( listItem ) => (<MenuItemView desktopView={desktopView} slugs={slugs} {...listItem} />) ) }
					{ !renderBefore && <ZimletSlot props class={style.slot} name="menu" /> }
					{ desktopView && <AppNavigationTabs /> }
				</div>
				<ToolbarPortalTarget />
			</div>
		);
	}
}
