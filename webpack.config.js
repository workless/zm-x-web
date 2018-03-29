/*eslint-disable*/

var webpack = require('webpack');
var path = require('path');
var OfflinePlugin = require('offline-plugin');
var createWebpackConfig = require('./packages/@zimbra/webpack-config');

module.exports = function(env) {
	env = env || {};
	if (env.production==null) env.production = process.env.NODE_ENV==='production' || process.argv.indexOf('-p')>-1 || process.argv.indexOf('--production')>-1;

	var config = createWebpackConfig(env);

	var client = process.env.CLIENT || 'default';
	var clientConfig = {};
	try {
		clientConfig = require(path.join(__dirname, 'clients/'+client+'/config.json'));
	} catch (err) {}

	// Strip unused moment.js locales
	config.plugins.unshift(
		new webpack.ContextReplacementPlugin(/^\.\/locale$/, function(context) {
			if (!/\/moment\//.test(context.context)) return;
			context.regExp = /^\.\/(en|es)/;
			context.request = '../../locale';
		})
	);


	// Add OfflinePlugin
	config.plugins.push(
		new OfflinePlugin({
			relativePaths: false,
			AppCache: false,
			responseStrategy: env.production ? 'cache-first' : 'network-first',
			excludes: env.production ? ['*.map'] : ['**'],
			caches: {
				main: ['bundle.js', 'bundle.css', 'mail-screen*.chunk.js'], //download these and cache them right away - has the same effect as preload in browser header
				optional: [':rest:']
			},
			ServiceWorker: {
				events: true
			},
			cacheMaps: [
				{
					match: function(url) {
						if (url.pathname.indexOf('/@zimbra/') === 0) {
							return false;
						  }
						return '/';
					},
					requestTypes: ['navigate']
				}
			],
			publicPath: '/'
		})
	);

	// Set up Zimbra proxying
	var proxy = config.devServer.proxy || (config.devServer.proxy = []);
	var zimbraOrigin = process.env.ZIMBRA_URL || (clientConfig.devServer && clientConfig.devServer.zimbraOrigin) || 'https://ec2-13-58-225-137.us-east-2.compute.amazonaws.com';

	if (~process.argv.indexOf('--mock')) {
		// --mock uses a .har network dump to mock out Zimbra's API
		config.devServer.setup = function(app) {
			function relativeUrl(url) {
				return url.replace(/^(https?:\/\/[^/]+)?\/?/gi, '/');
			}

			function rewrite(url) {
				return url.replace(/^\/@zimbra\//, '/');
			}

			var har = JSON.parse(require('fs').readFileSync('./test/fixtures/network-mock.har', 'utf8'));
			var map = {};
			har.log.entries.forEach(function(o) {
				var url = rewrite(relativeUrl(o.request.url));
				map[`${o.request.method.toUpperCase()} ${url}`] = o;
			});

			app.use('/@zimbra/*', function(req, res) {
				var url = relativeUrl(req.params[0]);
				var mapped = map[`${req.method.toUpperCase()} ${url}`];
				if (!mapped) {
					return res.status(404, {'content-type':'text/plain'}).send('Not Found: \n'+req.method+' '+url);
				}
				var headers = mapped.response.headers.reduce(function(acc, h) {
					var name = h.name.toLowerCase();
					if (!name.match(/^(etag|transfer-encoding|content-(encoding|length))$/)) acc[name] = h.value;
					return acc;
				}, {});
				res.status(mapped.response.status).set(headers).send(mapped.response.content.text);
			});
		};
		return;
	}
	else {
		// Proxy to Zimbra upstream defined in configuration.
		proxy.push({
			path: '/@zimbra/**',
			changeOrigin: true,
			changeHost: true,
			secure: false,
			pathRewrite: function(path, req) {
				// zimbra bails if you send an off-domain referer, so strip it:
				delete req.headers.referer;
				req.headers.connection = 'keep-alive';
				// remove first path segment ( /@zimbra/** )
				return '/' + path.replace(/^\/[^\/]+\//, '');
			},
			onProxyRes: function(proxyRes, req, res) {
				var cookies = [].concat(proxyRes.headers['set-cookie'] || []);
				if (proxyRes.statusCode===500 && proxyRes.url.indexOf('GetInfoRequest') >= 0) {
					// If we receive a 500 from the API, the session is likely expired. Clear it.
					proxyRes.headers['set-cookie'] = 'ZM_AUTH_TOKEN=;Path=/;HttpOnly'
				}
				else if (cookies.length) {
					// remove secure-only cookies (in development)
					proxyRes.headers['set-cookie'] = cookies.map( function(c) {
						return String(c || '').replace(/;Secure(;|$)/, '$1');
					});
				}

				if (proxyRes.headers.location) {
					proxyRes.headers.location = proxyRes.headers.location.replace(zimbraOrigin, '');
				}

				proxyRes.headers.connection = 'keep-alive';
				proxyRes.headers['cache-control'] = 'no-cache';
			},
			target: zimbraOrigin
		});
	}

	return config;
};
