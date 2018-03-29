import path from 'path';
import loaderUtils from 'loader-utils';
import merge from 'deepmerge';
import moduleToJson from '../lib/module-to-json';

const errorDetail = err => err ? ` (${err})` : '';

/** Loads a JSON configuration file and optionally merges it over a default file.
 *	This is done by matching patterns in the filename against a $CLIENT parameter.
 *	Merging configuration at build-time means removed/overridden properties are stripped from the resulting bundle.
 *
 *	@name config-loader
 *	@param {String} [client='default']		The client name alias to fetch and apply overrides for
 *	@param {String} [token]					Pattern to replace with `$CLIENT`. **Overrides find/replace.**
 *	@param {String} [find='default']		Regular expression string to match the filename against
 *	@param {String} [replace='{client}']	Regular expression replacement string to apply to `find` matches
 *  @param {Boolean} [modules=true] 		`true` to export JSON as an ES Module, `false` for CommonJS
 *  @param {Boolean} [json=true] 			If false, JSON parsing/merging will be skipped and only override files will be returned
 *  @param {Object} [merge] 				If defined, object will be merged into JSON resources after overrides are applied
 *  @param {Boolean} [warn=false] 			Set to `true` to show console warnings for missing branded files
 *
 *	@example
 *	// this...
 *	require('config?client=foo!./clients/default/config.json')
 *	// ...produces a result equivalent to:
 *	deepmerge(
 *		require('./clients/default/config.json'),
 *		require('./clients/foo/config.json')
 *	)
 */
export default function configLoader(source, map, data) {

	const options = loaderUtils.getOptions(this);  //this object is read-only

	let isJson = this.resourcePath.match(/\.json$/i);

	let cwd = options.context || process.cwd();

	source = isJson && data || source; //use already JSON parsed results from prior loaders if it exists

	if (!source) {
		throw Error('Unknown file.'); //should return undefined in async mode to avoid ambigious loader results
	}

	if (isJson) {
		try {
			data = moduleToJson(source);
		}
		catch (err) {
			throw Error(`Invalid config: ${this.resourcePath}${errorDetail(err)}`);
		}
	}

	let callback = this.async();

	// once finished, pass the result back to webpack.
	let done = () => {
		if (isJson) {
			let out = `${!options.modules ? 'module.exports =' : 'export default'} ${JSON.stringify(data)}`;
			callback(null, out, map, data, overrides); //data and overrides are passed to downstream loaders for efficiency
		}
		else {
			callback(null, data || source, map);
		}
	};

	// no client provided, no reason to doubly-merge default config
	let client = options.client;
	if (!client) {
		if (options.warn) {
			this.emitWarning('No client specified.');
		}
		client = 'default';
	}

	if (client==='default') {
		if (isJson && options.merge) {
			data = merge(data, options.merge);
		}
		return done();
	}

	let overrides;

	// either provide a token ("what to replace with the client name"):
	if (options.token) {
		overrides = this.resourcePath.replace(options.token, options.client);
	}
	// or provide a the find & replace values (regex + replacer):
	else {
		let reg = options.find || 'default',
			rep = options.rep || options.replace || '{client}';

		// replace {client} with the client passed via options:
		rep = rep.replace(/\{client\}/gi, options.client);

		// be nice and normalize for windows
		if (path.sep==='\\') {
			reg = reg.replace(/(^|[^\\])\\\//g, '$1\\\\');
			rep = rep.replace(/\//g, '\\');
		}

		// actually resolve the client resource path:
		let relativePath = this.resourcePath.replace(cwd, '');
		overrides = loaderUtils.urlToRequest(relativePath.replace(new RegExp(reg), rep), cwd);
	}

	// only relative path should be printed for errors/warnings:
	let prettyPath = path.relative(cwd, overrides);

	// tell webpack about the file:
	if (overrides!==this.resourcePath) {
		this.addDependency(overrides);
	}

	this.fs.stat(overrides, (err, stats) => {

		// file does not exist, bail
		if (err || !stats.isFile()) {
			if (err && err.code==='ENOENT') err = '';
			if (options.warn) {
				this.emitWarning(`Missing ${isJson?'config':'file'}: ${prettyPath}${errorDetail(err)}`);
			}
			if (isJson && options.merge) data = merge(data, options.merge);
			return done();
		}

		this.loadModule(overrides, (err, file) => {
			if (!err) {
				if (isJson) {
					try {
						let overrideConfig = moduleToJson(file);
						data = merge(data, overrideConfig);
					}
					catch (error) {
						err = error;
					}
				}
				else {
					data = file;
				}
			}

			if (isJson && options.merge) {
				data = merge(data, options.merge);
			}

			if (options.warn && err) {
				this.emitWarning(`Invalid config: ${prettyPath}${errorDetail(err)}`);
			}

			done();
		});
	});

	return; //always return undefined in async mode to avoid ambigious loader results
}
