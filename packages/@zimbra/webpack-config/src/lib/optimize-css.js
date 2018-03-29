import fs from 'fs';
import CleanCSS from 'clean-css';
import prettyBytes from 'pretty-bytes';
import { readFile } from './util';

export default function optimizeCss(filename, verbose) {
	let sourceMapFile = `${filename}.map`,
		sourceMap = readFile(sourceMapFile),
		css = readFile(filename);
	if (!css) return;

	let out = new CleanCSS({
		advanced: true,
		aggressiveMerging: true,
		sourceMap,
		sourceMapInlineSources: true
	}).minify(css);

	if (verbose) {
		process.stderr.write(`CSS compressed by ${prettyBytes(css.length-out.styles.length)}\n`);
	}

	out.errors.forEach( e => process.stderr.write(`  Error: ${e}\n`) );
	out.warnings.forEach( e => process.stderr.write(`  Warning: ${e}\n`) );

	fs.writeFileSync(filename, out.styles, 'utf8');
	if (out.sourceMap) fs.writeFileSync(sourceMapFile, out.sourceMap, 'utf8');
}
