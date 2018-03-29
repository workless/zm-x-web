import { h, Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { connect } from 'preact-redux';
import clipboard from 'clipboard-polyfill';

import { notify } from '../../store/notifications/actions';

import ActionMenu, { DropDownWrapper } from '../action-menu';
import ActionMenuItem from '../action-menu-item';
import ContactEditorModal from '../contact-editor-modal';

import s from './style.less';

@connect(null, { notify })
export default class ContactCardMenu extends Component {
	state = {
		showEditModal: false
	};

	copy(text) {
		clipboard.writeText(text).then(() => {
			this.props.notify({
				message: <Text id="contacts.hoverCard.COPIED_TOAST" />
			});
		});
	}

	handleCopyAddress = () => {
		this.copy(this.props.email);
	};

	handleCopyDetails = () => {
		const { name, email, jobDescription, phone } = this.props;

		this.copy(
			[name, jobDescription, email, phone].filter(Boolean).join('\n')
		);
	};

	toggleEditModal = () => {
		this.setState({ showEditModal: !this.state.showEditModal });
		this.props.afterEdit && this.props.afterEdit();
	};

	render({ contact, enableEdit }, { showEditModal }) {
		return (
			<div>
				<Localizer>
					<ActionMenu
						class={s.actionMenu}
						actionButtonClass={s.menuButton}
						popoverClass={s.menu}
						corners="all"
						icon="ellipsis-h"
						arrow={false}
						monotone
						iconOnly
					>
						<DropDownWrapper>
							{enableEdit && (
								<ActionMenuItem onClick={this.toggleEditModal}>
									<Text id="contacts.hoverCard.EDIT" />
								</ActionMenuItem>
							)}
							<ActionMenuItem onClick={this.handleCopyAddress}>
								<Text id="contacts.hoverCard.COPY_ADDRESS" />
							</ActionMenuItem>
							<ActionMenuItem onClick={this.handleCopyDetails}>
								<Text id="contacts.hoverCard.COPY_DETAILS" />
							</ActionMenuItem>
						</DropDownWrapper>
					</ActionMenu>
				</Localizer>

				{showEditModal && (
					<ContactEditorModal
						contactId={contact.id}
						onClose={this.toggleEditModal}
					/>
				)}
			</div>
		);
	}
}
