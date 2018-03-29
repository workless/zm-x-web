/**
 * Original functionality extracted from create-react-app's Webpack wrapper:
 * https://github.com/facebookincubator/create-react-app/blob/4d7b7544e74db1aaca22e847b233ed1f3b95b72b/packages/react-scripts/scripts/build.js
 *
 * Original license:
 *
 *   Copyright (c) 2015-present, Facebook, Inc.
 *   All rights reserved.
 *
 *   This source code is licensed under the BSD-style license found in the
 *   LICENSE file in the root directory of this source tree. An additional grant
 *   of patent rights can be found in the PATENTS file in the same directory.
 */

import fs from 'fs';
import path from 'path';
import rreaddir from 'recursive-readdir';
import chalk from 'chalk';
import filesize from 'filesize';
import { sync as gzipSize } from 'gzip-size';
import stripAnsi from 'strip-ansi';


// Input: /User/dan/app/build/static/js/main.82be8.js
// Output: /static/js/main.js
function removeFileNameHash(fileName, dist) {
	return path.relative(dist || process.cwd(), fileName)
		.replace(/\/?(.*)(\.\w+)(\..*)$/, (match, p1, p2, p3) => p1 + p3);
}


// Input: 1024, 2048
// Output: "(+1 KB)"
function getDifferenceLabel(currentSize, previousSize) {
	let FIFTY_KILOBYTES = 1024 * 50;
	let difference = currentSize - previousSize;
	let fileSize = !Number.isNaN(difference) ? filesize(difference) : 0;
	if (difference >= FIFTY_KILOBYTES) {
		return chalk.red('+' + fileSize);
	}
	else if (difference < FIFTY_KILOBYTES && difference > 0) {
		return chalk.yellow('+' + fileSize);
	}
	else if (difference < 0) {
		return chalk.green(fileSize);
	}
	return '';
}


/** Webpack Plugin that reads the current file sizes in build directory,
 *	then displays how much they changed after compilation has finished.
 *	@param {Object} [options={}]
 *	@param {Boolean} [options.clean=false]							Delete previous files in the build directory after getting their sizes
 *	@param {String} [options.dist=webpackConfig.output.path]		Optionally override the `output.path` value from webpack config
 *	@param {RegExp|String|Function} [options.test=/\.(js|css)$/]	Standard webpack `test` filter for output files
 */
export default class ShowOutputSizePlugin {
	constructor(options) {
		this.options = options || {};
	}

	collect(dist, callback) {
		rreaddir(dist, (err, fileNames) => {
			if (err) return callback({});

			let previousSizeMap = (fileNames || [])
				.filter(fileName => /\.(js|css)$/.test(fileName))
				.reduce((acc, fileName) => {
					let contents = fs.readFileSync(fileName);
					let key = removeFileNameHash(fileName, dist);
					acc[key] = gzipSize(contents);

					return acc;
				}, {});

			// delete files from dist
			if (this.options.clean) {
				(fileNames || []).forEach( fileName => fs.unlinkSync(fileName) );
			}

			callback(previousSizeMap);
		});
	}

	printDiff(dist, stats, previousSizeMap) {
		let assets = stats.toJson().assets
			.filter( asset => {
				let { test } = this.options;
				if (typeof test==='function') return test(asset.name);
				return asset.name.match(test || /\.(js|css)$/);
			})
			.map(asset => {
				let fileContents = '';
				try {
					fileContents = fs.readFileSync(path.join(dist, asset.name));
				}
				catch (e) {
					process.stderr.write(chalk.dim(`Unable to check size of ${asset.name}`));
				}
				let size = gzipSize(fileContents);
				let previousSize = previousSizeMap[removeFileNameHash(path.join(dist, asset.name), dist)];
				let difference = getDifferenceLabel(size, previousSize);
				return {
					folder: path.dirname(asset.name).replace(/^\.\/?/, ''),
					name: path.basename(asset.name),
					size,
					sizeLabel: filesize(size) + (difference ? ' (' + difference + ')' : '')
				};
			});
		assets.sort((a, b) => b.size - a.size);
		let longestSizeLabelLength = Math.max.apply(null,
			assets.map(a => stripAnsi(a.sizeLabel).length)
		);
		assets.forEach(asset => {
			let sizeLabel = asset.sizeLabel;
			let sizeLength = stripAnsi(sizeLabel).length;
			if (sizeLength < longestSizeLabelLength) {
				let rightPadding = ' '.repeat(longestSizeLabelLength - sizeLength);
				sizeLabel += rightPadding;
			}
			process.stdout.write(
				'	' + sizeLabel +
				'	' + chalk.dim(asset.folder + path.sep) + chalk.cyan(asset.name) +
				'\n'
			);
		});
	}

	apply(compiler) {
		if (this.options.disable) return;

		let dist = this.options.dist || compiler.options.output.path;

		let previousSizeMap = {};
		this.collect(dist, map => {
			previousSizeMap = map;
		});

		compiler.plugin('done', stats => {
			this.printDiff(dist, stats, previousSizeMap);
		});
	}
}
