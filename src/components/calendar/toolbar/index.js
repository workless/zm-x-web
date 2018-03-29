import { h, Component } from 'preact';
import { callWith } from '../../../lib/util';
import { Text } from 'preact-i18n';
import ActionButton from '../../action-button';
import ActionMenu, { DropDownWrapper } from '../../action-menu';
import ActionMenuItem from '../../action-menu-item';
import ActionMenuGroup from '../../action-menu-group';
import isToday from 'date-fns/is_today';
import format from 'date-fns/format';
import { VIEW_AGENDA, VIEW_YEAR } from '../constants';
import withMediaQuery from '../../../enhancers/with-media-query';
import { minWidth, screenMd } from '../../../constants/breakpoints';
import cx from 'classnames';
import style from './style';

const VIEWS = ['day', 'week', 'month', 'year', 'agenda'];

@withMediaQuery(minWidth(screenMd), 'matchesScreenMd')
class CalendarToolbar extends Component {
	handleAction = actionType => {
		switch (actionType) {
			case 'NEW_CALENDAR':
				this.props.openModal('createCalendar');
				break;
			case 'ADD_SHARED_CALENDAR':
				this.props.openModal('createSharedCalendar');
				break;
			default:
				// @TODO implement actions.
				//eslint-disable-next-line no-console
				console.log('unhandled calendar toolbar action: ' + actionType);
		}
	};

	render({ view, date, label, onNavigate, onViewChange, matchesScreenMd }) {
		if (view === VIEW_AGENDA) {
			label = format(date, 'MMMM YYYY');
		}
		else if (view === VIEW_YEAR) {
			label = date.getFullYear();
		}

		return (
			<div class={style.toolbar}>
				<div class={style.toolbarTop}>
					{matchesScreenMd &&
						<ActionButton
							class={style.viewButton}
							monotone
							disabled={isToday(date)}
							onClick={callWith(onNavigate, 'TODAY')}
						>
							<Text id="calendar.today" />
						</ActionButton>
					}
					<span class={style.buttons}>
						{VIEWS.map(viewName => (
							<ActionButton
								class={cx(style.viewButton, view === viewName && style.current)}
								disabled={view === viewName}
								onClick={callWith(onViewChange, viewName)}
							>
								<Text id={'calendar.views.' + viewName}>{viewName}</Text>
							</ActionButton>
						))}
					</span>
					<ActionsMenuButton onAction={this.handleAction} />
				</div>
				<div class={style.toolbarBottom}>
					<ActionButton
						icon="angle-left"
						monotone
						onClick={callWith(onNavigate, 'PREV')}
					/>
					<ActionButton
						icon="angle-right"
						monotone
						onClick={callWith(onNavigate, 'NEXT')}
					/>
					<h3>{label}</h3>
				</div>
			</div>
		);
	}
}

export default CalendarToolbar;

const ActionsMenuButton = ({ onAction }) => (
	<ActionMenu
		class={style.actionsMenuButton}
		icon="cog"
		label={<Text id="calendar.actions.BUTTON" />}
	>
		<DropDownWrapper>
			<ActionMenuGroup>
				<ActionMenuItem onClick={callWith(onAction, 'print')}>
					<Text id="calendar.actions.PRINT" />
				</ActionMenuItem>
			</ActionMenuGroup>
			<ActionMenuGroup>
				<ActionMenuItem onClick={callWith(onAction, 'NEW_CALENDAR')}>
					<Text id="calendar.actions.NEW_CALENDAR" />
				</ActionMenuItem>
				<ActionMenuItem onClick={callWith(onAction, 'NEW_TASKS')}>
					<Text id="calendar.actions.NEW_TASK_LIST" />
				</ActionMenuItem>
				<ActionMenuItem onClick={callWith(onAction, 'SHARE')}>
					<Text id="calendar.actions.SHARE" />
				</ActionMenuItem>
			</ActionMenuGroup>
			<ActionMenuGroup>
				<ActionMenuItem onClick={callWith(onAction, 'SHOW TASKS')}>
					<Text id="calendar.actions.SHOW_TASKS" />
				</ActionMenuItem>
			</ActionMenuGroup>
			<ActionMenuGroup>
				<ActionMenuItem onClick={callWith(onAction, 'ADD_HOLIDAYS')}>
					<Text id="calendar.actions.ADD_HOLIDAYS" />
				</ActionMenuItem>
				<ActionMenuItem onClick={callWith(onAction, 'ADD_SHARED_CALENDAR')}>
					<Text id="calendar.actions.ADD_SHARED_CALENDAR" />
				</ActionMenuItem>
			</ActionMenuGroup>
			<ActionMenuGroup>
				<ActionMenuItem onClick={callWith(onAction, 'SYNC_HELP')}>
					<Text id="calendar.actions.SYNC_HELP" />
				</ActionMenuItem>
			</ActionMenuGroup>
		</DropDownWrapper>
	</ActionMenu>
);
