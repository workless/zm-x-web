import { h } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import { Icon, ModalDialog } from '@zimbra/blocks';
import CalendarEventDetails from './event-details';
import style from './style';

function ModalDrawer({ children, ...props }) {
	return (
		<ModalDialog {...props}>
			<Localizer>
				<button
					class={style.close}
					aria-label={<Text id="buttons.close" />}
					onClick={props.onClickOutside}
				>
					<Icon name="close" />
				</button>
			</Localizer>
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
