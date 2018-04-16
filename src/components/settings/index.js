import { h } from 'preact';
import { Spinner } from '@zimbra/blocks';
import { Text } from 'preact-i18n';
import values from 'lodash-es/values';
import set from 'lodash-es/set';
import get from 'lodash-es/get';
import cloneDeep from 'lodash-es/cloneDeep';
import PureComponent from '../../lib/pure-component';
import { pluck, callWith } from '../../lib/util';
import SettingsToolbar from '../settings-toolbar';
import ZimletSlot from '../zimlet-slot';
import cx from 'classnames';
import style from './style';
import {
	VIEWING_EMAIL_SETTINGS,
	WRITING_EMAIL_SETTINGS,
	ACCOUNTS_SETTINGS,
	VACATION_RESPONSE_SETTINGS,
	FILTERS_SETTINGS,
	BLOCKED_ADDRESSES_SETTINGS,
	SECURITY_AND_ACTIVITY_SETTINGS,
	CALENDAR_AND_REMINDERS_SETTINGS
} from './constants';
import { minWidth, screenSm } from '../../constants/breakpoints';
import withMediaQuery from '../../enhancers/with-media-query/index';

const settingsConfig = [
	VIEWING_EMAIL_SETTINGS,
	WRITING_EMAIL_SETTINGS,
	ACCOUNTS_SETTINGS,
	VACATION_RESPONSE_SETTINGS,
	FILTERS_SETTINGS,
	BLOCKED_ADDRESSES_SETTINGS,
	SECURITY_AND_ACTIVITY_SETTINGS,
	CALENDAR_AND_REMINDERS_SETTINGS
];

@withMediaQuery(minWidth(screenSm), 'matchesScreenSm')
export default class Settings extends PureComponent {
	openItem = id => {
		this.setState({ activeId: id });

		if (this.activeScreenAfterNavigation) {
			this.activeScreenAfterNavigation(id);
		}
	};

	registerAfterNavigation = (fn) => {
		this.activeScreenAfterNavigation = fn;
	}

	onFieldChange = fieldName => e => {
		const fieldPath = `${this.state.activeId}.${fieldName}`;
		let fieldValue;

		if (e instanceof Array) {
			fieldValue = e;
		}
		else {
			fieldValue =
				e.target.tagName === 'INPUT' && e.target.type === 'checkbox'
					? !get(this.props.value, fieldPath)
					: e.target.value;
		}

		const update = set(cloneDeep(this.props.value), fieldPath, fieldValue);
		return this.props.onChange(update);
	};

	// Re-use the cached closed-over field change handler if one exists. Immediately
	// invoke the proxy returned by `callWith` as we want the underlying event handler
	// fn.
	callWithOnFieldChange = fieldName =>
		callWith(this.onFieldChange, fieldName)();

	constructor(props) {
		super();
		this.state = {
			activeId: props.matchesScreenSm
				? VIEWING_EMAIL_SETTINGS.id
				: null
		};
	}

	render(
		{
			value,
			updateAccountSettings,
			accounts,
			accountInfoQuery,
			onSubmitNewAccount,
			matchesScreenSm,
			onSave,
			onCancel
		},
		{ activeId }
	) {
		if (!value) {
			return (
				<Spinner block />
			);
		}

		const settingsTab = pluck(values(settingsConfig), 'id', activeId);
		return (
			<div class={cx(style.settings)}>
				<SettingsToolbar
					onOpenItem={this.openItem}
					onClickSave={onSave}
					onClickCancel={onCancel}
					matchesScreenSm={matchesScreenSm}
					activeId={activeId}
				/>
				<div class={cx(style.sidebar, activeId && style.activePanel)}>
					<nav class={style.sidebarMenu}>
						{settingsConfig.map(({ id, title, hideOnScreenXs }) => (
							<div
								class={cx(style.sidebarItem, activeId === id && style.active, hideOnScreenXs && style.hideOnScreenXs)}
								onClick={callWith(this.openItem, id)}
							>
								<Text id={`settings.${id}.title`}>{title}</Text>
							</div>
						))}
						<ZimletSlot name="settings-nav" />
					</nav>
				</div>
				{activeId && (
					<div class={cx(style.settingsWrapper, style.remainderWidthColumn, activeId && style.activePanel)}>
						{activeId === 'accounts'
							? h(settingsTab.component, {
								onFieldChange: this.callWithOnFieldChange,
								onSubmitNewAccount,
								value: value[activeId],
								updateAccountSettings,
								accounts,
								accountInfoQuery,
								afterNavigation: this.registerAfterNavigation
							})
							: h(settingsTab.component, {
								onFieldChange: this.callWithOnFieldChange,
								value: value[activeId]
							})}
					</div>
				)}
			</div>
		);
	}
}
