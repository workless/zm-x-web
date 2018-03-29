[![CircleCI](https://circleci.com/gh/Zimbra/zm-x-web.svg?style=shield&circle-token=75201964c368d39693f2a82da744402fd7e90c35)](https://circleci.com/gh/Zimbra/zm-x-web)

# zm-x-web
Zimbra X Web Client - A responsive webapp front-end for Zimbra.

## Setup

```sh
# clone the repository
git clone git@github.com:Zimbra/zm-x-web.git

# switch to the app folder
cd zm-x-web

# if running as root user, you need to run the following line for postInstall scripts to run properly
# npm config set unsafe-perm true

# install dependencies
npm install
```

## Run for Development

### Default Client

`zm-x-web` will run with all default configuration values if no `CLIENT` variable is specified.

```sh
npm start
```

### Synacor Client

Changing the `CLIENT` environment variable will tell `zm-x-web` to build with client specific configurations and overrides.

```sh
CLIENT=synacor npm start
```

To create your own client, use the `clients/synacor` folder as a template.

### Environment Variables to Customize Development Server
* `CLIENT` - The client directory in `/clients` to use for client specific overrides.
* `HOST` - What host to start the dev server as.  Default is `0.0.0.0`
* `PORT` - The port where the server will try to bind to.  If not available, will try successively higher ports until it finds one that is open.  Default is `8080`
* `ZIMBRA_URL` - A proxy will be setup by the webpack dev server to this zimbra server url to make API requests. By default, will read the `devServer.zimbraOrigin` key from the client specific `config.json` file, or falls back to `https://ec2-13-58-225-137.us-east-2.compute.amazonaws.com`.

Full example:
`CLIENT=synacor HOST=localhost PORT=9001 ZIMBRA_URL=https://anotherzimbra.com npm start`

## Create a Production Build
The app can be run for different clients, which are specified with the
`CLIENT` environment variable.
```sh
# create a production build in build/ for the synacor client
CLIENT=synacor npm run build
```

The client requires a proxy to provide CORS for the zimbra server.  Each client typically defines this in its `config.json` file with the `zimbraProxyURL` key.  You can override this for a given build with the `ZIMBRA_PROXY_URL` environment variable.  This is useful if you want all of the branding and other variables for a client, but want to point it to a different zimbra installation than the default.
```sh
# create a production build in build/ for the synacor client with an overriden zimbra proxy url
CLIENT=synacor ZIMBRA_PROXY_URL=https://my-proxy.heroku.com npm run build
```

## Performance Analysis Helpers

To generate a report on the built Application, you can use the built-in [`webpack-bundle-analyzer`](https://github.com/th0r/webpack-bundle-analyzer) plugin. To output a bundle report, set `WEBPACK_ANALYZE_REPORT` to true before running a build. This will cause the build to emit a file named `coverage/bundle-report.html`, containing valuable performance information:

```
WEBPACK_ANALYZE_REPORT=true npm run build
```
