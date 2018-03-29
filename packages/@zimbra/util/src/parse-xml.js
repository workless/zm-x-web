
export default function parseXml(str, asHtml) {
	let doc;
	if (typeof DOMParser==='undefined') {
		// eslint-disable-next-line no-undef
		doc = new ActiveXObject(asHtml ? 'Msxml2.DOMDocument' : 'Microsoft.XMLDOM');
		doc.async = false;
		doc.loadXML(str);
	}
	else {
		let parser = new DOMParser();
		doc = parser.parseFromString(str, asHtml ? 'text/html' : 'text/xml');
	}
	return doc;
}
