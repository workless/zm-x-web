export default (webpackConfig) => {
	if (!process.env.WEBPACK_ANALYZE_REPORT && !process.env.WEBPACK_ANALYZE_PORT) return;

	let BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin,
		target;

	if (process.env.WEBPACK_ANALYZE_REPORT) {
		target = 'coverage/bundle-report.html';
		console.log('Outputting static bundle analysis '+target); // eslint-disable-line no-console
	}
	else if (process.env.WEBPACK_ANALYZE_PORT) {
		target = +process.env.WEBPACK_ANALYZE_PORT || 8888;
		console.log('Spawning bundle analyzer on port '+target); // eslint-disable-line no-console
	}

	return new BundleAnalyzerPlugin({
		analyzerMode: typeof target === 'number' ? 'server' : 'static' ,
		startAnalyzer: true,
		analyzerPort: target,
		openAnalyzer: true,
		generateStatsFile: false,
		reportFilename: target,
		statsFilename: 'stats.json'
	});
};
