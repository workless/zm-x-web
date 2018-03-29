import { h } from 'preact';
import { Icon } from '@zimbra/blocks';

/**
 * Map of full mimetypes/types to icon names. Full mimetypes are
 * given precidence over plain types.
 **/
const ICONS = {
	image: 'file-image-o',
	audio: 'file-audio-o', // 'music-note',
	video: 'file-video-o', // 'ios-film',
	application: 'file-o', // 'document',
	text: 'file-text-o',
	'text/calendar': 'calendar-o'
};

export default function FileIcon({ type, ...props }) {
	return <Icon name={ICONS[type] || ICONS[type.split('/')[0]]} {...props} />;
}
