import { clean } from './helpers';
import { getSafeHtmlId } from '../../../lib/html-viewer';

export default function EmojiImg({ contentId, url, name }) {
	return clean(`
		<img data-safe-html="${getSafeHtmlId()}" width="18" height="18" data-cid="${contentId}" src="${url}" alt="${name}" emoji>
	`);
}
