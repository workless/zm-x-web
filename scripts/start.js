/* eslint-disable no-console */
const chalk = require('chalk');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const openBrowser = require('react-dev-utils/openBrowser');
const {
	choosePort,
	createCompiler,
	prepareUrls
} = require('react-dev-utils/WebpackDevServerUtils');
const configGenerator = require('../webpack.config');

const isInteractive = process.stdout.isTTY;
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 8080;
const HOST = process.env.HOST || '0.0.0.0';

function clearConsole() {
	process.stdout.write(
		process.platform === 'win32' ? '\x1Bc' : '\x1B[2J\x1B[3J\x1B[H'
	);
}

const webpackConfig = configGenerator();

const HOT = webpackConfig.devServer && webpackConfig.devServer.hot;
// We attempt to use the default port but if it is busy, we offer the user to
// run on a different port. `detect()` Promise resolves to the next free port.
choosePort(HOST, DEFAULT_PORT)
	.then(port => {
		if (port == null) {
			// We have not found a port.
			return;
		}

		const protocol = process.env.HTTPS !== 'false' ? 'https' : 'http';
		const urls = prepareUrls(protocol, HOST, port);

		webpackConfig.entry = [
			'webpack-dev-server/client?'+urls.localUrlForBrowser
		].concat(webpackConfig.entry);

		if (HOT) {
			webpackConfig.entry.unshift(
				'webpack/hot/dev-server?'+urls.localUrlForBrowser
			);

			webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
		}

		// Create a webpack compiler that is configured with custom messages.
		const compiler = createCompiler(webpack, webpackConfig, 'Zimbra', urls, false);

		webpackConfig.devServer.https = protocol === 'https';
		const devServer = new WebpackDevServer(compiler, webpackConfig.devServer);

		// Launch WebpackDevServer.
		devServer.listen(port, HOST, err => {
			if (err) {
				return console.log(err);
			}
			if (isInteractive) {
				clearConsole();
			}
			console.log(chalk.cyan('Starting the development server...\n'));
			openBrowser(urls.localUrlForBrowser);
		});
	});
