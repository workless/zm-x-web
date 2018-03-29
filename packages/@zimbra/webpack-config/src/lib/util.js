import path from 'path';
import fs from 'fs';

// export function toModuleName(name) {
// 	return name.replace(/-[a-z]/g, s => s[1].toUpperCase());
// }


let jsnextModuleCache = {};

/** Checks if a filepath is within a node module that expresses a `jsnext:main` entry
 *	@returns {Boolean} hasJsNextMain
 */
export function isJsNextModule(filepath) {
	let moduleDir = filepath.replace(crossPlatformPathRegex(/(.*(\/node_modules|\.\.)\/(@[^/]+\/)?[^/]+)(\/.*)?$/g), '$1');
	if (jsnextModuleCache.hasOwnProperty(moduleDir)) return jsnextModuleCache[moduleDir];
	let isJsNext = false;
	try {
		let pkg = JSON.parse(fs.readFileSync(path.resolve(moduleDir, 'package.json')));
		if (pkg.module || pkg['jsnext:main'] || (pkg.engines && pkg.engines.node && pkg.engines.node.match(/^>=?[4,5,6,7]/))) {
			isJsNext = true;
		}
	}
	catch (e) {}
	return (jsnextModuleCache[moduleDir] = isJsNext);
}


/** Returns a predicate for a given filename `pattern` (regex) within the base directory `cwd`. */
export function matchesPath(pattern, cwd) {
	return filename => crossPlatformPathRegex(pattern).test(filename.replace(cwd+'/', ''));
}


/** Normalize a filepath regex to add windows support */
export function crossPlatformPathRegex(regexp) {
	if (path.sep==='\\') {
		regexp = new RegExp(regexp.source.replace(/(^|[^\\])\\\//g, '$1\\\\'), regexp.flags);
	}
	return regexp;
}


export function isDir(filepath) {
	try {
		return !!fs.statSync(filepath).isDirectory();
	}
	catch (err) { }
}


export function isFile(filepath) {
	try {
		return !!fs.statSync(filepath).isFile();
	}
	catch (err) { }
}


export function readFile(filepath) {
	try {
		return fs.readFileSync(filepath, 'utf8');
	}
	catch (err) { }
}


export function deleteFile(filepath) {
	try {
		fs.unlinkSync(filepath);
	}
	catch (err) { }
}
