import { h } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import { Icon, ModalDialog } from '@zimbra/blocks';
import CalendarEventDetails from './event-details';
import { ToolbarContainer } from '../../toolbar';
import style from './style';
import cx from 'classnames';

function ModalDrawer({ children, ...props }) {
	return (
		<ModalDialog {...props} class={cx(style.modal, props.class)}>
			<ToolbarContainer>
				<Localizer>
					<button
						class={style.close}
						aria-label={<Text id="buttons.close" />}
						onClick={props.onClickOutside}
					>
						<Icon name="fa:arrow-left" />
					</button>
				</Localizer>
			</ToolbarContainer>
			{children}
		</ModalDialog>
	);
}

export default function CalendarEventDetailsModal(props) {
	return (
		<ModalDrawer onClickOutside={props.onClose}>
			<CalendarEventDetails {...props} />
		</ModalDrawer>
	);
}
