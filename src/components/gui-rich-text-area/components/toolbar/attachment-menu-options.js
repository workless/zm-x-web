import { PHOTOS, FILES, GIFS, WEB_LINKS } from '../../../../store/media-menu/constants';
import { COMMAND_TYPE } from './index';

export const MY_COMPUTER = 'my_computer';
export const ATTACHMENT_OPTIONS = [
	{
		label: 'attachments.my_computer',
		value: MY_COMPUTER
	},{
		label: 'attachments.photos',
		value: PHOTOS
	},{
		label: 'attachments.files',
		value: FILES
	},{
		label: 'attachments.gifs',
		value: GIFS
	},{
		label: 'attachments.web_links',
		value: WEB_LINKS
	}
];

export function generateAttachmentMenu (cmd) {
	return cmd('paperclip', null, COMMAND_TYPE.MENU, {
		title: 'attachmentsTitle',
		submenu: [
			{
				menuItems: ATTACHMENT_OPTIONS.map(({ label, value }) => cmd(
					null,
					null,
					COMMAND_TYPE.ATTACHMENT,
					{
						label,
						value
					}
				))
			}
		]
	});
}
