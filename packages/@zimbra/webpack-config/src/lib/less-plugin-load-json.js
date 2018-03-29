/** support loading JSON files containing key-value variable pairs.
 *	@name less-plugin-load-json
 *	@example
 *	// example.less
 *	@import './vars.json';
 *	a { color: @link-fg-color; }  // #FF0
 *
 *	// vars.json
 *	{
 *		"brand-primary": "#FF0",
 *		"link-fg-color": "@brand-primary"
 *	}
 */
export default {
	minVersion: [2, 1, 1],

	install(less, pluginManager) {
		pluginManager.addPreProcessor(new JsonPreProcessor());
	}
};

class JsonPreProcessor {
	process(str, { fileInfo }) {
		//if not a js or json file, return untouched
		if (!fileInfo.filename.match(/\.js(?:on)?$/)) return str;

		try {
			let json = JSON.parse(str);
			return Object.keys(json).map( key => `@${key}: ${json[key]};` ).join('\n');
		}
		catch (err) {
			// noop if we aren't able to parse the file
			console.warn(`Failed to parse ${fileInfo.filename}:\n${err}`);
			return str;
		}
	}
}
