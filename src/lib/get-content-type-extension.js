
// For Office filetypes, see http://filext.com/faq/office_mime_types.php
const MIME_LOOKUP = [{
	test: subtype => /(x-)?zip(-compressed)?$/.test(subtype),
	value: 'zip'
}, {
	test: subtype => /pdf/.test(subtype),
	value: 'pdf'
}, {
	test: subtype => /ms-?word|wordprocessingml/.test(subtype),
	value: 'doc'
}, {
	test: subtype => /ms-?excel|spreadsheetml/.test(subtype),
	value: 'xls'
}, {
	test: subtype => /ms-?powerpoint|presentationml/.test(subtype),
	value: 'ppt'
}];

export default function getContentTypeExtension(contentType) {
	let [ , subtype ] = contentType.split('/');

	for (let index = 0; index < MIME_LOOKUP.length; index++) {
		let { test, value }= MIME_LOOKUP[index];
		if (test(subtype)) { return typeof value === 'function' ? value(subtype) : value; }
	}
}

