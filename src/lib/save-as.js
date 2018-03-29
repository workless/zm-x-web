
export default function saveAs(url, filename) {
	if (typeof url === 'string') {
		// Hack for https://bugzilla.mozilla.org/show_bug.cgi?id=1237226
		//   If the URL responds with `Content Disposition: inline;` Firefox
		//   will not download the resource.
		if (/\/service\/home\/(?!.*\?.*disp=a)/i.test(url)) {
			url += `${url.indexOf('?') === -1 ? '?' : '&'}disp=a`;
		}
	}
	else {
		// Blob support
		url = URL.createObjectURL(url);
	}

	let link = document.createElement('a');

	if ('download' in link) {
		link.href = url;
		link.download = filename;

		link.dispatchEvent(new MouseEvent('click', { view: window }));
	}
	else {
		// fallback, open resource in new tab.
		window.open(url, '_blank', '');
	}
}
