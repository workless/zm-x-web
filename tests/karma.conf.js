/*eslint-disable*/

var createWebpackConfig = require('../packages/@zimbra/webpack-config');

var webpack = createWebpackConfig({
	src: 'src',
	testMode: true,
	coverage: process.env.COVERAGE,
	alias: {
		'zimbra-graphql': __dirname+'/../src/lib/zimbra-graphql',
		src: __dirname+'/../src'
	}
});


module.exports = function(config) {
	config.set({
		frameworks: ['mocha', 'chai-sinon'],

		reporters: ['mocha',
			process.env.COVERAGE !=='false' && 'coverage',
			process.env.JUNIT !=='false' && 'junit'
		].filter(Boolean),

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
		browsers: ['jsdom'],

		junitReporter: {
			outputDir: __dirname+'/../test-reports/unit',
			outputFile: 'unit.xml',
			useBrowserName: false,
			suite: 'unit'
		},

		files: [
			{ pattern: __dirname+'/setup-unit.js', watched: false, included: true, served: true },
			{ pattern: 'unit/**/*.js', watched: false, included: true, served: true }
		],

		preprocessors: {
			'**': ['webpack', 'sourcemap']
		},

		webpack: webpack,
		webpackMiddleware: webpack.devServer,
		mochaReporter: {
			showDiff: true
		}
	});
};
