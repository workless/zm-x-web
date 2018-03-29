/** Unwraps and parses JSON files that have been wrapped as CommonJS modules.
 *	This is much cleaner and faster than evaluating the module in an isolated context.
 */
export default source => {
	if (typeof source==='object') {
		return source;
	}
	else if (typeof source==='string') {
		// strip json-loader wrapping if present:
		source = source.replace(/(^\s*module.exports\s*=\s*|;[\r\n\s]*$)/g, '').trim();

		// parse as JSON
		return JSON.parse(source);
	}
};
