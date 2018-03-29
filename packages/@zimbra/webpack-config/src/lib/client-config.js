import fs from 'fs';
import path from 'path';
import merge from 'deepmerge';

export function getClientConfig(clientName, configDir, verbose) {
	let config = {};

	// apply default configuration:
	try {
		config = merge(config, JSON.parse(fs.readFileSync(`${configDir}/default/config.json`)));
	}
	catch (err) {
		if (verbose) {
			process.stderr.write(`Error loading default config: ${err.message}\n`);
		}
	}

	// if non-default, apply nested client configuration overrides:
	if (clientName!=='default') {
		try {
			config = merge(config, JSON.parse(fs.readFileSync(`${configDir}/${clientName}/config.json`)));
		}
		catch (err) {
			if (verbose) {
				process.stderr.write(`Error loading client config for "${clientName}": ${err.message}\n`);
			}
		}
	}

	let client = typeof config.client==='object' && config.client || config,
		server = config.server || {};

	delete client.server;

	return { client, server };
}


export function configFile(configDir, client, filepath) {
	try {
		fs.statSync(path.join(configDir, client, filepath));
	}
	catch (e) {
		client = 'default';
	}
	return path.join(configDir, client, filepath);
}


/** Intelligent Array merge handler for static-app.json configuration files. Used by deepmerge. */
export function mergeStaticAppConfigArrays(dest, source) {
	outer: for (let i=0; i<source.length; i++) {
		if (typeof source[i]==='object' && source[i]) {
			let keyField = 'key' in source[i] ? 'key' : 'source';
			if (source[i][keyField]!==undefined) {
				for (let j=dest.length; j--; ) {
					// eslint-disable-next-line eqeqeq
					if (dest[j] && dest[j][keyField]==source[i][keyField]) {
						dest.splice(j, 1, source[i]);
						continue outer;
					}
				}
			}
		}
		dest.push(source[i]);
	}
	return dest;
}
