import { h, Component } from 'preact';
import get from 'lodash-es/get';
import { Icon } from '@zimbra/blocks';
import { connect } from 'preact-redux';
import withLogout from '../../graphql-decorators/logout';
import { compose } from 'recompose';
import { toggle as toggleSettings } from '../../store/settings/actions';
import { hide as hideSidebar } from '../../store/sidebar/actions';
import { Text } from 'preact-i18n';
import ActionMenu from '../action-menu';
import ActionMenuItem from '../action-menu-item';
import ActionMenuSettings from '../action-menu-settings';
import withMediaQuery from '../../enhancers/with-media-query/index';
import { minWidth, screenMd } from '../../constants/breakpoints';

import s from './style.less';

@compose(
	withMediaQuery(minWidth(screenMd), 'matchesScreenMd'),
	withLogout(),
	connect((state) => ({
		name: (get(state, 'email.account.attrs.displayName') || '').split(' ')[0] || (get(state, 'email.account.name') || '').split('@')[0]
	}), (dispatch, { matchesScreenMd }) => ({
		toggleSettings: () => {
			dispatch(toggleSettings());
			if (!matchesScreenMd) {
				dispatch(hideSidebar());
			}
		}
	}))
)
export default class HeaderActions extends Component {
	handleLogout = () => {
		this.props.logout()
			.then(() => {
				window.location.href = '/?loginOp=logout';
			});
	}

	render({ name, ...props }) {
		return (
			<div class={s.headerActions}>
				<ActionMenu
					actionButtonClass={s.headerActionButton}
					anchor="end"
					arrow={false}
					label={
						<span class={s.headerAction}>
							{props.matchesScreenMd ? (
								<span class={s.headerActionTitle}>
									<Icon class={s.headerActionIcon} name="user-circle-o" />
									{name || <Text id="header.DEFAULT_ACCOUNT" />}
									<Icon class={s.headerActionArrow} name="fa:caret-down" size="xs" />
								</span>
							) : (
								<Icon class={s.headerActionIcon} name="user-circle-o" />
							)}
						</span>
					}
				>
					<ActionMenuItem onClick={this.handleLogout}>
						<Text id="header.LOGOUT" />
					</ActionMenuItem>
				</ActionMenu>
				<span class={s.headerAction}>
					{props.matchesScreenMd
						? (
							<Icon
								class={s.headerActionIcon}
								name="cog"
								onClick={props.toggleSettings}
							/>
						)
						: (
							<ActionMenuSettings
								onClickSettings={props.toggleSettings}
								actionButtonClass={s.settingsActionButton}
								iconClass={s.settingsIcon}
							/>
						)}
				</span>
			</div>
		);
	}
}
