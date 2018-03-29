
/**
 * Generate a badge and set it as the drag image. Also set data on the
 * dataTransfer object as JSON.
 */
export function setDataTransferJSON(e, { data, itemCount }) {
	if (e.dataTransfer.setDragImage) {
		let badge = generateBadge(itemCount);
		e.dataTransfer.setDragImage(badge, -15, -5);
	}

	e.dataTransfer.dropEffect = 'none';
	e.dataTransfer.setData('text', JSON.stringify(data));
};

/**
 * Safely attempt to parse the contents of the dataTransfer interface as JSON.
 */
export function getDataTransferJSON(e, type) {
	let text = e.dataTransfer.getData('text'),
		data;

	try {
		data = JSON.parse(text);
	}
	catch (err) {
		console.log('error parsing dataTransfer data:', err); // eslint-disable-line no-console
	}

	if (!data || !type || data.type === type) return data;
};


/**
 * Create a badge containing a number for use in dragging multiple items.
 */
function generateBadge(count) {
	let img = document.createElement('img');
	img.src = 'data:image/svg+xml;base64,' + btoa(`
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 100 100">
			<defs><filter id="a"><feGaussianBlur stdDeviation="1.3"/></filter><radialGradient id="b" cy=".2" r="1" spreadMethod="pad"><stop offset="0" stop-color="#fa4848"/><stop offset="1" stop-color="#ca1818"/></radialGradient></defs>
			<circle cx="50" cy="50" r="47" opacity=".3" filter="url(#a)"/>
			<circle cx="50" cy="49" r="41" fill="url(#b)" stroke="#fff" stroke-width="5"/>
			<text x="50" y="62" fill="#fff" style="text-shadow:0 -1px 0 #000;" text-anchor="middle" font-family="sans-serif" font-size="42">${count}</text>
		</svg>`);
	img.style.cssText = 'position:absolute; left:0; top:0; width:24px; height:24px; z-index:9999;';
	document.body.appendChild(img);
	setTimeout( () => document.body.removeChild(img) );
	return img;
}
