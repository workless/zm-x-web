/** Given a HTMLElement, find all the text content from child <li> elements
 *  @param {Element} target     the parent HTMLElement which has list item children.
 *  @returns {String[]}         returns a list of text contents from the list item children.
 */
export default function getListTextContent(target) {
	if (!target || !target.querySelectorAll) { return []; }
	return Array.prototype.slice.call(target.querySelectorAll('ul > li')).map(({ textContent }) => textContent);
}
