import path from 'path';
import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ProgressBarPlugin from 'progress-bar-webpack-plugin';
import installBundleAnalyzerPlugin from './lib/install-bundle-analyzer-plugin';
import ShowOutputSizePlugin from './lib/show-output-size-webpack-plugin';
import cssnext from 'postcss-cssnext';
import discardComments from 'postcss-discard-comments';
import containerQueryPlugin from 'cq-prolyfill/postcss-plugin';
import postcssFilterGradient from 'postcss-filter-gradient';
import lessJsonPlugin from './lib/less-plugin-load-json';
import merge from 'deepmerge';
import { getClientConfig, configFile, mergeStaticAppConfigArrays } from './lib/client-config';
import { isDir, isFile, readFile, crossPlatformPathRegex, matchesPath, isJsNextModule } from './lib/util';
import HappyPack from 'happypack';
import LodashWebpackPlugin from 'lodash-webpack-plugin';
// import optimizeCss from './lib/optimize-css';


// File extensions to treat as files for historyApiFallback:
const EXTENSIONS = 'html js css xml txt json svg ttf woff woff2 eot otf jpg jpeg png gif'.split(' ');


export default function(env) {
	env = env || {};
	let argv = process.argv.slice(2);
	const PROD = env.production || process.env.NODE_ENV==='production' || argv.indexOf('-p')!==-1;
	const TEST_MODE = env.testMode;
	const watch = env.watch || !PROD || process.argv.indexOf('webpack-dev-server')!==-1;

	let cwd = process.cwd(),
		context = cwd,
		pkg = require(path.resolve(cwd, 'package.json')),
		unprefixedPackageName = pkg.name.replace(/^@[^/]+\//g, ''); // strip module namespace

	let cssModulesRegexp = crossPlatformPathRegex(/(?:([^/@]+?)(?:-(?:widgets?|components?|screens?))?\/)?src\/(?:components|screens)\/(.+?)(\/[a-z0-9._-]+[.](less|css))?$/);


	// Client configuration
	let client = env.client || process.env.CLIENT || 'default',
		configDir = path.resolve(cwd, env.configDir || process.env.CONFIG_DIR || 'clients'),
		config = getClientConfig(client, configDir, env.verbose),
		manifest = {};

	for (let i in process.env) if (process.env.hasOwnProperty(i)) {
		let parts = i.match(/^ZIMBRA_APP_CONFIG_(.*)$/);
		if (parts) {
			let prop = parts[1].toLowerCase().replace(/_[a-z]/, s => s[1].toUpperCase());
			console.log(`Override (${i}): Setting config.${prop}="${process.env[i]}".`);
			config[prop] = process.env[i];
		}
	}

	try {
		manifest = JSON.parse(readFile(path.resolve(configDir, client, 'manifest.json')));
	}
	catch (e) {}


	// entry point (initial file to load)
	let entry = path.resolve(cwd, pkg.module || pkg['jsnext:main'] || pkg.main);
	if (isDir(entry)) entry = path.resolve(entry, 'index.js');

	// attempt to use ./src dir if present:
	if (isDir(path.resolve(cwd, 'src'))) context = path.resolve(context, 'src');


	// normalize desination dir
	let dest = path.resolve(cwd, env.dest || 'build');

	if (isDir(dest) || !dest.match(/\.[a-z]+$/gi)) {
		dest = path.resolve(dest, 'index.html');
	}

	// use absolute paths
	context = path.resolve(context);
	dest = path.resolve(dest);

	let cssLoaderOptions = {
		autoprefixer: false,
		sourceMap: watch && !PROD
	};

	let lessLoaderOptions = {
		sourceMap: true,
		modifyVars: {
			CLIENT: client
		},
		plugins: [lessJsonPlugin]
	};

	let postCssLoaderOptions = {
		plugins: [
			cssnext({
				browsers: ['last 2 versions', 'not ie > 0', 'iOS >= 8'],
				features: {
					//disable customProperties plugin so css variables and :root blocks are preserved
					customProperties: false
				}
			}),
			discardComments({ removeAll: true }),
			containerQueryPlugin(),
			postcssFilterGradient
		]
	};

	function customInterpolateName(url, name, options) {
		// ignore non-css-modules names:
		if (options.regExp!==cssModulesRegexp) return url;

		let parts = url.split(/[_/]/);

		// fix broken directory-based names for current module
		if (parts[0]===path.basename(cwd)) {
			parts[0] = unprefixedPackageName.replace(crossPlatformPathRegex(/-(components?|widgets?|screens?)$/i),'');
		}

		// filter out consecutive duplicates (accounting for holes):
		let prev;
		parts = parts.reduce( (acc, value) => {
			if (value!==prev) acc.push(value);
			if (value) prev = value;
			return acc;
		}, []);

		return parts.join('_');
	}

	let webpackConfig = {
		context,
		entry: './' + path.relative(context, entry),

		output: {
			path: path.dirname(dest),
			filename: `bundle.js`,
			chunkFilename: '[name].[chunkhash:8].chunk.js',
			publicPath: '/'
		},

		resolve: {
			extensions: ['.jsx', '.js', '.ts', '.tsx', '.json', '.less', '.scss'],

			mainFields: ['browser', 'module', 'jsnext:main', 'main'],

			modules: [
				path.resolve(cwd, 'packages'),
				path.resolve(cwd, 'node_modules'),
				path.resolve(__dirname, '..', 'node_modules'),
				'node_modules'
			],

			alias: {
				DEFAULTCLIENT: path.join(configDir, 'default'),
				CLIENT: path.join(configDir, client),
				style: path.resolve(context, 'style'),
				react: 'preact-compat',
				'react-dom': 'preact-compat',
				'lodash-es': 'lodash',
				...(env.alias || {})
			}
		},

		resolveLoader: {
			modules: [
				path.resolve(__dirname, 'loaders'),
				path.resolve(__dirname, '..', 'node_modules'),
				path.resolve(cwd, 'node_modules')
			]
		},

		module: {
			rules: [
				{
					test: /\.jsx?$/,
					// only transpile npm packages that define a modules/jsnext:main entry
					include: filepath => !filepath.match(crossPlatformPathRegex(/\/node_modules\//)) || isJsNextModule(filepath),
					loaders: 'happypack/loader'
				},
				{
					test: /\.tsx?$/,
					exclude: /node_modules/,
					use: [
						{ loader: 'happypack/loader' },
						{ loader: 'ts-loader' }
					]
				},
				{
					test: /\.(graphql|gql)$/,
					exclude: /node_modules/,
					loader: 'graphql-tag/loader'
				},
				// LESS
				{
					test: /\.(less|css)$/,
					include: crossPlatformPathRegex(/(^|\/)src\/(?:components|screens)\//),
					use: ExtractTextPlugin.extract({
						fallback: 'style-loader',
						use: [
							{
								loader: 'css-loader',
								options: {
									...cssLoaderOptions,
									modules: true,
									importLoaders: 1,
									localIdentRegExp: cssModulesRegexp,
									localIdentName: '[1]_[2]_[local]'
								}
							},
							{
								loader: 'postcss-loader',
								options: postCssLoaderOptions
							},
							{
								loader: 'less-loader',
								options: lessLoaderOptions
							}
						]
					})
				},
				{
					test: /\.(less|css)$/,
					exclude: crossPlatformPathRegex(/(^|\/)src\/(?:components|screens)\//),
					use: ExtractTextPlugin.extract({
						fallback: 'style-loader',
						use: [
							{
								loader: 'css-loader',
								options: cssLoaderOptions
							},
							{
								loader: 'postcss-loader',
								options: postCssLoaderOptions
							},
							{
								loader: 'less-loader',
								options: lessLoaderOptions
							}
						]
					})
				},

				{
					test: matchesPath(/^(clients|config)\/default\/config\.json$/, cwd),
					loader: 'config-loader',
					options: {
						client,
						merge: config,
						warn: true,
						modules: !TEST_MODE
					}
				},
				{
					test: matchesPath(/^(clients|config)\/default\//, cwd),
					exclude: matchesPath(/^(clients|config)\/default\/config\.json$/, cwd),
					loader: 'config-loader',
					options: {
						client,
						modules: !TEST_MODE
					}
				},
				{
					test: matchesPath(/^assets\//, cwd),
					loader: 'config-loader',
					options: {
						find: '^/(.+)$',
						replace: '/clients/{client}/$1',
						client,
						modules: !TEST_MODE
					}
				},
				{
					test: /\.(xml|html|txt|md)$/,
					loader: 'raw-loader'
				},
				{
					test: /\.ejs$/,
					loader: 'ejs-loader'
				},
				{
					test: /\.(svg|ttf|woff2?|eot|otf|jpe?g|png|gif)([?#].*?)?$/i,
					loader: watch ? 'url-loader' : 'file-loader?name=assets/[name]_[hash:base64:5].[ext]'
				},
				{
					test: /\.flow$/,
					loader: 'ignore-loader',
					include: /node_modules/
				}
			]
		},

		node: PROD ? {
			console: false,
			Buffer: false,
			__filename: false,
			__dirname: false,
			setImmediate: false
		} : {},

		profile: env.profile,

		plugins: [].concat(
			new HappyPack({
				// loaders is the only required parameter:
				loaders: [
					{
						test: /\.[jt]sx?$/,
						// only transpile npm packages that define a modules/jsnext:main entry
						include: filepath => !filepath.match(crossPlatformPathRegex(/\/node_modules\//)) || isJsNextModule(filepath),
						loader: 'babel-loader',
						options: {
							babelrc: false,
							comments: false,
							cacheDirectory: true,
							presets: [
								//modules:false is required for webpack 2 tree shaking, but breaks ability to stub es6 modules, so turn off for testing
								[require.resolve('babel-preset-es2015'), TEST_MODE ? { loose: false } : { loose: true, modules: false }],
								require.resolve('babel-preset-stage-0')
							],
							plugins: [
								require.resolve('babel-plugin-lodash'),
								require.resolve('babel-plugin-transform-decorators-legacy'),
								require.resolve('babel-plugin-transform-object-assign'),
								require.resolve('babel-plugin-recharts'),
								[require.resolve('babel-plugin-transform-react-jsx'), { pragma: env.pragma || 'h' }],
								TEST_MODE && env.coverage!==false && [require.resolve('babel-plugin-__coverage__'), { only: context }]
							].filter(Boolean)
						}
					}
				]
			}),
			PROD ? [
				new webpack.NoEmitOnErrorsPlugin(),
				new webpack.HashedModuleIdsPlugin()
			] : [
				new webpack.NamedModulesPlugin()
			],

			new webpack.LoaderOptionsPlugin({
				minimize: PROD,
				debug: !PROD,
				options: {
					customInterpolateName
				}
			}),

			new LodashWebpackPlugin({
				collections: true,
				paths: true,
				shorthands: true,
				cloning: true
			}),

			new ProgressBarPlugin({
				format: '\u001b[90m\u001b[44mBuild\u001b[49m\u001b[39m [:bar] \u001b[32m\u001b[1m:percent\u001b[22m\u001b[39m (:elapseds) \u001b[2m:msg\u001b[22m',
				renderThrottle: 100,
				summary: false
			}),

			new ShowOutputSizePlugin({
				// wipe output dir
				clean: true,
				disable: watch
			}),

			new webpack.optimize.CommonsChunkPlugin({
				// filename: 'common.[chunkhash].chunk.js',
				children: true,
				async: false,								// false moves to entry, true creates a shared dependency chunk
				minChunks: Math.round(env.minChunks) || 4	// # of duplicates needed to move
			}),

			new webpack.DefinePlugin({
				'process.env.NODE_ENV': JSON.stringify(PROD?'production':'development'),
				CLIENT: JSON.stringify(client),
				CONFIG: JSON.stringify(config.client)
			}),

			// if not running dev server, extract CSS into separate file
			new ExtractTextPlugin({
				filename: `bundle.css`,
				allChunks: true,
				disable: watch || !PROD
			}),

			new CopyWebpackPlugin([
				isFile(configFile(configDir, client, 'manifest.json')) && {
					from: configFile(configDir, client, 'manifest.json'),
					to: 'manifest.json'
				},

				isDir(configFile(configDir, client, 'assets')) && {
					from: configFile(configDir, client, 'assets'),
					to: 'assets'
				},

				{
					from: 'static-app.json',
					to: '../static-app.json',
					transform(content) {
						let overrides = readFile(configFile(configDir, client, 'static-app.json'));
						if (overrides) {
							let merged = merge(JSON.parse(content), JSON.parse(overrides), {
								arrayMerge: mergeStaticAppConfigArrays
							});
							content = JSON.stringify(merged, null, 2);
						}
						return String(content).replace(/%%ZIMBRA_PROXY_URL%%/g, process.env.ZIMBRA_PROXY_URL || config.client.zimbraProxyURL || 'https://zimbra-api-proxy-aws.herokuapp.com');
					}
				}
			].filter(Boolean)),

			// HTML bundle output
			new HtmlWebpackPlugin({
				filename: watch ? 'index.html' : path.basename(dest),
				template: `!!ejs-loader!${env.htmlTemplate || path.resolve(__dirname, './template.ejs')}`,
				minify: {
					collapseWhitespace: true,
					removeScriptTypeAttributes: true,
					removeRedundantAttributes: true,
					removeStyleLinkTypeAttributes: true,
					removeComments: true
				},
				inject: true,
				compile: true,
				preload: true,
				title: env.title || (config && config.client && config.client.title || config.title) || pkg.title || unprefixedPackageName,
				client,
				config,
				manifest,
				pkg,
				env
			}),
			installBundleAnalyzerPlugin()
		).filter(Boolean),

		stats: 'errors-only',

		devtool: watch ? 'inline-source-map' : 'source-map',

		devServer: {
			port: process.env.PORT || env.port || 8080,
			host: process.env.HOST || env.host || '0.0.0.0',
			hot: !process.env.DISABLE_HOT,
			https: env.https===true,
			compress: true,
			publicPath: '/',
			contentBase: context,
			disableHostCheck: true,
			setup(app) {
				app.use(require('cors')({
					maxAge: 3600,
					credentials: true,
					origin: /./
				}));
			},
			historyApiFallback: {
				rewrites: [
					{
						from: /(?:^|\/)[^/?]+\.([^.]+)(?:\?.*)?$/,
						to({ parsedUrl, match }) {
							return ~EXTENSIONS.indexOf(match[1]) ? parsedUrl.href : '/index.html';
						}
					}
				]
			},
			watchOptions: {
				ignored: [
					path.resolve(cwd, 'build'),
					path.resolve(cwd, 'node_modules')
				]
			},
			overlay: false,
			noInfo: true,
			stats: 'errors-only'
		}
	};


	if (isFile(path.join(cwd, 'cube.config.js'))) {
		webpackConfig = require(path.join(cwd, 'cube.config.js'))(webpackConfig) || webpackConfig;
	}

	return webpackConfig;
}
