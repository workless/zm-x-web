/** Fire an arbitrary event
 *	@param {Element} target		The event target
 *	@param {String} type		Any event type to fire (eg "mousedown")
 *	@param {Object} [props]		Additional properties to copy onto the custom event
 */
export default function fireEvent(target, type, props) {
	let e = document.createEvent('Event');
	e.initEvent(type, true, true);
	for (let i in props) if (i!=='target') e[i] = props[i];
	target.dispatchEvent(e);
}
