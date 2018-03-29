import { h } from 'preact';
import { Text } from 'preact-i18n';
import { callWith } from '../../lib/util';
import ActionMenu, { DropDownWrapper } from '../action-menu';
import ActionMenuGroup from '../action-menu-group';
import ActionMenuItem from '../action-menu-item';

import {
	PHOTOS,
	FILES,
	GIFS,
	WEB_LINKS,
	TABS
} from '../../store/media-menu/constants';

export default function ActionMenuComposeAttachments({
	onOpenMediaMenu,
	onChooseAttachment,
	actionButtonClass,
	popoverClass,
	iconClass,
	arrow,
	monotone,
	iconOnly
}) {
	return (
		<ActionMenu
			actionButtonClass={actionButtonClass}
			icon="paperclip"
			iconClass={iconClass}
			iconOnly={iconOnly}
			monotone={monotone}
			arrow={arrow}
			popoverClass={popoverClass}
		>
			<DropDownWrapper>
				<ActionMenuGroup>
					<ActionMenuItem
						onClick={onChooseAttachment}
					>
						<Text id="compose.toolbar.attachments.my_device" />
					</ActionMenuItem>
					<ActionMenuItem
						onClick={callWith(onOpenMediaMenu, TABS.indexOf(PHOTOS))}
					>
						<Text id="compose.toolbar.attachments.photos" />
					</ActionMenuItem>
					<ActionMenuItem
						onClick={callWith(onOpenMediaMenu, TABS.indexOf(FILES))}
					>
						<Text id="compose.toolbar.attachments.files" />
					</ActionMenuItem>
					<ActionMenuItem
						onClick={callWith(onOpenMediaMenu, TABS.indexOf(GIFS))}
					>
						<Text id="compose.toolbar.attachments.gifs" />
					</ActionMenuItem>
					<ActionMenuItem
						onClick={callWith(onOpenMediaMenu, TABS.indexOf(WEB_LINKS))}
					>
						<Text id="compose.toolbar.attachments.web_links" />
					</ActionMenuItem>
				</ActionMenuGroup>
			</DropDownWrapper>
		</ActionMenu>
	);
}