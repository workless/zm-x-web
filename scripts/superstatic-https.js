const pem = require('pem');
const superstatic = require('superstatic');
const connect = require('connect');
const https = require('https');
const fs = require('fs');
const path = require('path');
const proxy = require('proxy-middleware');

//get the directory where the built assets are creating by having node interrogate package.json
const publicPath = path.dirname(require.resolve(path.join(__dirname, '..')));

let CONFIG_FILE = './static-app.json';

const spec = {
	config: path.resolve(CONFIG_FILE),
	cwd: publicPath
};

function listen(port, host) {
	const app = connect();

	addProxyFromConfig(app);

	app.use(superstatic(spec));

	pem.createCertificate({ days: 1, selfSigned: true }, (err, keys) => {
		if (err) { throw err; }

		const httpsOptions = {
			key: keys.serviceKey,
			cert: keys.certificate
		};

		return https.createServer(httpsOptions, app).listen(port, (createServerErr) => {
			createServerErr && console.log(createServerErr);
			console.log('Serving files from ' + publicPath);
			console.log('server started on ' + `https://` + host + ':' + port);
		});
	});

}

/**
 * Superstatic doesn't proxy.  Use the proxy redirect entries from the config file to add
 * appropriate proxy routes to the app as middleware
 *
 * @param {createServer.Server} app The instantiated connect app
 */
function addProxyFromConfig(app) {
	let config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
	let proxyRedirects = config.redirects.filter(({ type }) => type === 'proxy' || type === 200 );
	proxyRedirects.forEach(({ source, destination }) => {
		//this proxy doesn't use splat matching - it auto splat matches, so get rid of that in config
		source = source.replace('(.*)', '');
		destination = destination.replace('$1', '');
		app.use(source, proxy(destination));
	});
}

listen(process.env.PORT || 8080, process.env.HOST || '0.0.0.0');
