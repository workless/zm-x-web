import get from 'lodash-es/get';

/** Given an HTMLElement and an index, focus that child index
 *  @param {Element} target    the HTMLElement with children
 *  @param {Number} index      the index of the child to be focused
 */
export default function focusChildByIndex(target, index = 0) {
	if (!target || !target.childNodes) { return; }
	if (0 <= index && index < target.childNodes.length) {
		let child = get(target, `childNodes.${index}`);
		child && child.focus && child.focus();
	}
}
