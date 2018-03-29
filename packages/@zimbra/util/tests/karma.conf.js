/*eslint-disable*/
var path = require('path');

module.exports = function(config) {
	config.set({
		browsers: ['PhantomJS'],
		frameworks: ['mocha', 'chai-sinon'],
		reporters: ['junit', 'mocha'].concat(process.env.COVERAGE==='false' ? [] : 'coverage'),
		coverageReporter: {
			reporters: [
				{
					type: 'text-summary'
				},
				{
					type: 'html',
					dir: '../dist/coverage',
					subdir: '.'
				}
			]
		},
		junitReporter: {
			outputDir: 'test-reports', // results will be saved as $outputDir/$browserName.xml
			suite: require('../package.json').name
		},
		files: [
			{ pattern: 'setup-unit.js', watched: false, included: true, served: true },
			{ pattern: 'unit/**', watched: false, included: true, served: true },
		],
		preprocessors: {
			'**': ['webpack', 'sourcemap']
		},
		webpack: {
			module: {
				loaders: [{
					test: /\.js$/,
					loader: 'babel-loader',
					query: {
						presets: ['es2015', 'stage-0'],
						plugins: [ 'istanbul' ]
					}
				}, {
					test: /\.json$/,
					loader: 'json-loader'
				}]
			},
			resolve: {
				alias: {
					src: path.join(__dirname, '..', 'src')
				}
			},
			devtool: 'inline-source-map',
			info: false
		},
		webpackServer: { noInfo: true },
		mochaReporter: {
			showDiff: process.env.DIFF || true
		}
	});
};

// filters out empties && dupes
function dedupe(v, i, arr) { return v && arr.indexOf(v)===i; }
