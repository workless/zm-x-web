import path from 'path';
import { parallel } from 'praline';
import loaderUtils from 'loader-utils';
import moduleToJson from '../lib/module-to-json';

const errorDetail = err => err ? ` (${err})` : '';

const identity = i => i;

/** Parses a JSON file and generates a named require mapping.
 *	The JSON file defines an Object or Array, where the values are the module names/paths to import.
 *	Arrays will produce an Object keyed on the module name/path, Objects export the modules as their corresponding keys.
 *
 *	@name require-config-loader
 *	@param {String} [prop]	Generate requires from a given property in the JSON
 *
 *	@example
 *	// file: config.json
 *	{
 *		"modules": {
 *			"one": "npm-module-to-require",
 *			"two": "./some/local-module"
 *		}
 *	}
 *
 *	// file: index.js
 *	require('require-config?prop=modules!./config.json');
 *	// ^ is equivalent to:
 *	{
 *		one: require('npm-module-to-require'),
 *		two: require('./some/local-module')
 *	}
 */
export default function requireConfigLoader(source, map, data, overrides) {

	const query = loaderUtils.getOptions(this);

	source = data || source;

	if (!source) throw Error('Unknown file.');

	try {
		data = moduleToJson(source);
	}
	catch (err) {
		throw Error(`Invalid config: ${this.resourcePath}${errorDetail(err)}`);
	}

	let callback = this.async();

	// once finished, pass the result back to webpack.
	let done = out => {
		callback(null, out || '', map);
		return;
	};

	let prop = query.prop || query.property;
	let config = prop ? data[prop] : data;

	// no config for components provided
	if (!config) {
		this.emitWarning('No require config found.');
		return done();
	}

	//turn ['foo', 'bar'] into {foo: foo, bar: bar}
	if (Array.isArray(config)) {
		config = config.reduce( (acc, item) => {
			acc[item] = item;
			return acc;
		}, {});
	}

	let keys = [],
		modules = [];
	for (let key in config) {
		if (config.hasOwnProperty(key)) {
			let module = config[key];
			if (module===true) module = key;
			keys.push(key);
			modules.push(module);
		}
	}

	// Array of module directory resolution contexts, in order of INCREASING precidence
	let contexts = [this.context];
	if (overrides) {
		contexts.push(path.dirname(overrides));
	}

	// resolve a module, ignoring errors
	let createContextResolver = module => context => next => {
		let p = module.split('!');
		this.resolve(context, p.pop(), (err, res) => {
			if (res && p.length) res = p.join('!') + '!' + res;
			next(null, res);
		});
	};

	let resolveModule = module => next => {
		parallel(contexts.map(
			createContextResolver(module)
		), (err, ...results) => {
			next(null, results.filter(identity).pop());
		});
	};

	let asyncLoader = query.promise ? 'promise-loader?global!' : 'bundle-loader?lazy!',
		asyncMapKey = query.asyncMap || query.map || query.promise || query.async,
		asyncMap = typeof asyncMapKey==='string' && data[asyncMapKey],
		syncMap = query.syncMap && data[query.syncMap] || {},
		asyncEnabled = !!(typeof asyncMapKey==='string' ? asyncMap : query.async);

	modules = modules.map( (m, index) => {
		let name = keys[index];

		if (m) {
			let mapped = asyncMap ? !!asyncMap[name] : true;
			if (syncMap && syncMap[name]===true) mapped = false;
			if (m.match(/^async /)) {
				m = m.substring(6);
				mapped = true;
			}
			if (asyncEnabled===mapped) {
				let chunkName = (query.dir ? (query.dir+'/') : '') + name;
				m = asyncLoader.replace(/\?/, `?name=${encodeURIComponent(chunkName)}&`) + m;
			}

			let customLoaders = query.loaders || query.loader;
			if (customLoaders) {
				m = customLoaders.replace(/,/g,'!') + '!' + m;
			}
		}
		return m;
	});

	parallel(modules.map(resolveModule), (err, ...resolved) => {
		let out = '';

		for (let index=0; index<resolved.length; index++) {
			let module = resolved[index],
				key = keys[index],
				req;
			if (!module) {
				this.emitWarning(`require-config-loader: Missing module "${module}"`);
			}
			else {
				this.addDependency(module);
				let error;
				try {
					req = loaderUtils.stringifyRequest(this, module);
				}
				catch (err) {
					error = err;
				}
				if (req && !error) {
					out += `exports[${JSON.stringify(key)}] = require(${req});\n`;
				}
				else {
					this.emitWarning(`require-config-loader: Failed to serialize module: "${key}"->require("${module}").${errorDetail(error)}`);
				}
			}
		}

		done(out);
	});

	return; //always return undefined from async loaders
}
