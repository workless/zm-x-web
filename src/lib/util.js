import moment from 'moment-timezone';
import findIndex from 'lodash-es/findIndex';
import isNil from 'lodash-es/isNil';
import array from '@zimbra/util/src/array';
import { calendarDateFormat } from '../utils/calendar';
import saveAs from './save-as';
import CALENDAR_FORMATS from '../constants/calendar-formats';

const HOP = Object.prototype.hasOwnProperty;

export function pluck(arr, key, value) {
	// eslint-disable-next-line
	for (let i = arr.length; i--; ) if (arr[i][key] == value) return arr[i];
}

export function getId(obj) {
	if (!obj) return;
	if (typeof obj === 'object') obj = obj.id;
	if (typeof obj === 'number') obj = String(obj);
	return obj;
}

export function notFlagged(messages, flag) {
	return messages && messages.filter(m => !hasFlag(m, flag));
}

export function last(arr) {
	return arr[arr.length - 1];
}

export function getEmail(address) {
	let m = address && address.match(/<\s*(.+?)\s*>\s*$/);
	return m ? m[1] : address;
}

export function parseAddress(str) {
	str = str.trim();
	let parts = str.match(/\s*(['"]?)(.*?)\1\s*<(.+)>/);
	if (parts) {
		return { address: parts[3], name: parts[2] };
	}
	return { address: str };
}

/** Get the domain portion of an email address
 * @example getEmailDomain("foo@my.bar.com") === "my.bar.com"
 *
 * @param {string} address the email address
 * @returns {string} the domain portion of the email address.  Returns a falsey value if no domain is found
 */
export function getEmailDomain(address) {
	let m = address && address.match(/@([^@]+)$/);
	return m && m[1];
}

/** Determine if an email address is an exact match or has a domain that matches a (sub)domain of the list of trusted addresses/domains
 * @param {string} emailAddress the email address to check
 * @param {string|string[]} trustedList a single or list of email addresses and/or domains to check against
 * @returns {boolean} true if domain is a (sub)domain of one of the domains in inDomains, false otherwise
 *
 * @example isAddressTrusted("joe@foo.bar.com", ["joe@foo.bar.com"]) === true //exact email match
 * @example isAddressTrusted("joe@foo.bar.com", "bar.com") === true //domain match against string
 * @example isAddressTrusted("joe@foo.bar.com", ["example.org", "bar.com"]) === true //subdomain match against array
 * @example isAddressTrusted("joe@bar.com", ["foo.bar.com"]) === false //no match
 */
export function isAddressTrusted(emailAddress, trustedList) {
	//TODO match email address
	trustedList = array(trustedList);
	if (!(emailAddress && trustedList.length)) return false;
	emailAddress = emailAddress.toLowerCase();
	let domain = getEmailDomain(emailAddress);
	return trustedList
		.map(d => d.toLowerCase())
		.some(d => d === emailAddress || d === domain || domain.endsWith(`.${d}`));
}

export function serializeAddress(address, name) {
	return name ? `"${name.replace(/"/g, '\\"')}" <${address}>` : address;
}

export function filterDuplicates(arr) {
	let out = [];
	for (let i = 0; i < arr.length; i++) {
		if (arr.indexOf(arr[i]) === i) {
			out.push(arr[i]);
		}
	}
	return out;
}

/** weeks = reduce(toGroups(7), []) */
export const toGroups = size => (acc, item, index) => {
	let group = (index / size) | 0;
	if (group === acc.length) acc.push([item]);
	else acc[group].push(item);
	return acc;
};

export function deepClone(obj) {
	if (typeof obj !== 'object' || !obj) return obj;
	let out = Array.isArray(obj) ? [] : {};
	for (let i in obj)
		if (obj.hasOwnProperty(i)) {
			out[i] = deepClone(obj[i]);
		}
	return out;
}

export function empty(obj) {
	return obj === undefined || obj === null;
}

/** Returns only word characters from a string, in lowercase (useful for loose string comparison) */
export function munge(str) {
	if (typeof str !== 'string') str = String(str);
	return str.toLowerCase().replace(/[^a-z]/g, '');
}

// TODO: Migrate consumers of `callWith`
export { callWith } from '@zimbra/util/src/call-with';

const FLAGS = {
	unread: 'u',
	flagged: 'f',
	replied: 'r',
	sentByMe: 's',
	forwarded: 'w',
	calendarInvite: 'v',
	draft: 'd',
	deleted: 'x',
	notificationSent: 'n',
	attachment: 'a',
	urgent: '!',
	lowPriority: '?',
	priority: '+'
};

export function hasFlag(message, flag) {
	const flags = message.flag || message.flags;
	return flags ? flags.indexOf(FLAGS[flag] || flag) > -1 : false;
}

export function isValidEmail(email) {
	let re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}

export function replaceAttributes(object, originalAttr, newAttr) {
	let originalValue = object[originalAttr];
	delete object[originalAttr];
	object[newAttr] = originalValue;
	return object;
}

export function queryToString(queryObj) {
	let str = '',
		key;

	for (key in queryObj)
		if (HOP.call(queryObj, key)) {
			str += `${str ? '&' : ''}${encodeURIComponent(key)}=${encodeURIComponent(
				queryObj[key]
			)}`;
		}

	return str;
}

export function parseQueryString(str) {
	let query = {},
		parts = str.split('&'),
		i;
	for (i = 0; i < parts.length; i++) {
		let [, key, value] = parts[i].match(/^([^=]+)(?:=(.*))?/);
		query[decodeURIComponent(key)] = decodeURIComponent(value);
	}
	return query;
}

export function removeNode(node) {
	if (!node) return;
	node.parentNode.removeChild(node);
}

/**
 * Returns `true` if any word in `keywords` is found in `target`.
 * @param {String} keywords            A word or space delimeted sentence for searching the `target`.
 * @param {String} target              The target to be search on.
 * @param {Boolean} [caseSensitive]    If true, the search will be case sensitive. Ignore case otherwise.
 * @return {Boolean}                   If any word from `keywords` is found in `target`, return true.
 */
export function hasCommonSubstr(keywords, target, caseSensitive) {
	let i;
	if (!keywords || !target) {
		return false;
	}
	if (!caseSensitive) {
		keywords = keywords.toLowerCase();
		target = target.toLowerCase();
	}

	if (target.indexOf(keywords) !== -1) {
		return true;
	}
	keywords = keywords.split(' ');
	for (i = 0; i < keywords.length; ++i) {
		if (target.indexOf(keywords[i]) !== -1) {
			return true;
		}
	}

	return false;
}

function decimalToHex(decimal) {
	let BGRString = decimal.toString(16); //this is in brg format instead of rgb
	if (BGRString.length < 6) {
		BGRString = `${Array(6 - BGRString.length + 1).join('0')}` + BGRString;
	}

	let colorParts = BGRString.match(/.{1,2}/g);
	return '#' + colorParts.reverse().join('');
}

// color => Decimal in IE, rgb()/rgba() in modern browsers
export function colorCodeToHex(color) {
	if (!isNaN(color)) return decimalToHex(color);

	let rgb = color.toString().match(/\d+/g);
	if (rgb && rgb.length === 4 && parseInt(rgb[3], 10) === 0) {
		return 'transparent';
	}

	return rgb && rgb.length > 2
		? '#' +
			('0' + parseInt(rgb[0], 10).toString(16)).slice(-2) +
			('0' + parseInt(rgb[1], 10).toString(16)).slice(-2) +
			('0' + parseInt(rgb[2], 10).toString(16)).slice(-2)
		: 'transparent';
}


export function hexToRgb(hex) {
	// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		}
		: null;
}

// Parse the string into a valid url
export function parseUrl(url) {
	if (!url) return '';
	// url => //test.com
	url = url.indexOf('//') === 0 ? 'http:' + url : url;
	// url => test.com
	url = url.indexOf(':') === -1 ? 'http://' + url : url;
	url = encodeURI(url);

	let parsedUrl = url.toLowerCase();

	return parsedUrl.substr(0, 7) === 'http://' ||
		parsedUrl.substr(0, 8) === 'https://' ||
		parsedUrl.substr(0, 7) === 'mailto:' ||
		parsedUrl.substr(0, 6) === 'ftp://'
		? parsedUrl
		: '';
}

export function isValidPort(port) {
	return parseInt(port, 10) > 0 && parseInt(port, 10) <= 65535;
}

export function isValidURL(url) {
	let pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/;
	return pattern.test(url);
}

/**
 * Given a URI, resolve it to a URL against the current document.
 * @param {String} uri       A URI, e.g. '/news/article/1'
 * @return {String}          A URL, e.g. 'http://localhost:8080/news/article/1'
 */
export function absoluteUrl(uri) {
	const a = document.createElement('a');
	a.href = uri;
	return a.href;
}

export function isSameOrigin(uri) {
	return window.location.origin === new URL(absoluteUrl(uri)).origin;
}

export function parseURI(uri) {
	const parser = document.createElement('a');
	parser.href = uri;

	return {
		protocol: parser.protocol,
		hostname: parser.hostname,
		port: parser.port,
		pathname: parser.pathname,
		search: parser.search,
		hash: parser.hash,
		host: parser.host
	};
}

/**
 * Returns a clone of {@param obj} without the keys listed in {@param properties}
 * @param {Object} obj             the object to be transformed
 * @param {String[]} properties    the properties to be deleted from {@param obj}
 * @returns {Object}               the {@param obj} object without the properties listed in {@param properties}
 */
export function objectWithoutProperties({ ...obj }, properties) {
	if (!properties || !properties.length) {
		return obj;
	}

	for (let property of properties)
		if (obj.hasOwnProperty(property)) {
			delete obj[property];
		}

	return obj;
}

/**
 * @desc returns A collection of time values formatted using {@param format} and distant an amount in seconds defined by {@param interval}
 * @param {number} interval
 * @param {String} format
 * @returns {String[]}
 */
export function timeRange(interval = 900, format = 'LT') {
	const start = moment('00:00:00', 'HH:mm:ss');
	const end = start.clone().add(1, 'days');
	let result = [];

	while (start.isBefore(end)) {
		result.push(start.format(format));
		start.add(interval, 'seconds');
	}

	return result;
}

/**
 * Converts from a time format to another
 * @param {String} sourceFormat
 * @param {String} targetFormat
 * @param {String} time
 */
export function switchTimeFormat(
	time,
	sourceFormat = 'h:mm A',
	targetFormat = 'HHmm'
) {
	return moment(time, sourceFormat).format(targetFormat);
}

export function circularIndex(n, len) {
	return (n + len) % len;
}

/**
 * Takes in an input of type 'file' and sends back a resolved Promise once the file has been read as Text.
 * @param {*} file
 * @param {String[]} supportedFormats
 */
export function getFileContent(file = {}, supportedFormats = ['ics']) {
	return new Promise((resolve, reject) => {
		if (
			findIndex(
				supportedFormats,
				format => format === file.name.match(/\.(\w+)$/)[1]
			) === -1
		) {
			reject(new Error('Unsupported File Format'));
		}
		const reader = new FileReader();
		reader.onload = (() => e => resolve(e.target.result))(file);
		reader.readAsText(file);
	});
}

/**
 * returns the number equivalent of the Day String supplied as parameter
 * @param {String} dayStr
 * @returns {number}
 */
export function getDayNumber(dayStr) {
	return moment()
		.day(dayStr)
		.day();
}

/**
 * Saves the downloaded calendar as a file given the format.
 * @param {*} result
 * @param {String} format
 */
export function saveCalendarAs(result, format = 'ics') {
	let blob = new Blob([].concat(result), {
		type: 'text/calendar'
	});
	let filename = `${result.match(/X-WR-CALNAME:(\w+)/)[1]}-${moment()
		.format('YYYY-MM-DD-hhmmss')
		.toString()}.${format}`;
	const url = window.URL.createObjectURL(blob);
	saveAs(url, filename);
}

export const getFolder = (folders, ident) =>
	folders.filter(
		// eslint-disable-next-line eqeqeq
		f => f.absFolderPath == ident || f.name == ident || f.id == ident
	)[0];

export const computeEmail = (name, host) => {
	if (!isNil(host.match(/(imap|pop)\.(\w+\.\w+)/))) {
		return `${name}@${host.match(/(imap|pop)\.(\w+\.\w+)/)[2]}`;
	}
	return '';
};

export function dirname(dir) {
	return dir && dir.replace(/\/(.*)\/.*$/, '/$1');
}

export function basename(dir) {
	return dir && dir.replace(/.*\/(.*)$/, '$1');
}

export function camelcase(str) {
	return str && str.replace(/-(.)/g, (m, $1) => `${$1.toUpperCase()}`);
}

export function uncamelcase(str) {
	return str && str.replace(/[A-Z]/g, m => ` ${m.toLowerCase()}`);
}

/**
 * Given a path, return the first parent directory in camelCase
 * @example assert(pathToSliceName('/a/b/camel-case/foo.js') === 'camelCase'))
 */
export function pathToSliceName(dir) {
	return camelcase(basename(dirname(dir)));
}

export function uriSegment(pathname, index = 0) {
	const segment = pathname && pathname.split('/')[index + 1];
	return segment !== '' ? segment : null;
}

/**
 * Extracts value out of an `input`'s event according to the `input`'s type
 * @param {*} e the input event
 */
export const getInputValue = e =>
	e.target
		? e.target.type === 'checkbox' ? e.target.checked : e.target.value
		: e;

export function getDateKey(date) {
	return calendarDateFormat(date, CALENDAR_FORMATS);
}

export function formatBytes(bytes, decimals) {
	if (bytes === 0) return '0 Bytes';
	let k = 1024,
		dm = decimals || 2,
		sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
		i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

