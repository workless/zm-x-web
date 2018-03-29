/** Given a character or a character code, return true if it is alphanumeric or false otherwise
 *  @param {String|Number} char    the character or charCode to test
 *  @returns {Boolean}             returns true if the character is alphanumeric.
 */
export default function isAlphanum(char) {
	if (typeof char === 'number') { char = String.fromCharCode(char); }
	return /[a-z0-9]/i.test(char);
}
