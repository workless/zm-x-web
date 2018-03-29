#!/usr/bin/env node

/* eslint-disable */

var path = require('path');
var fs = require('fs');

/*
This script builds Netlify-style configuration files from a Firebase/Superstatic/static-app configuration file.
It outputs the following files:

	_redirects
		/*    /index.html   200
		/:a    /b   302
		/api/*  https://api.example.com/:splat  200

	_headers
		/
			Link: </style.css>; rel=preload; as=style
		/foo/*
			Link: blah
*/

var src = path.resolve(process.cwd(), process.argv[2] || 'static-app.json'),
	dest = path.resolve(process.cwd(), process.argv[3] || 'build');

var out = convert(JSON.parse(fs.readFileSync(src, 'utf8')));
for (var type in out) if (out.hasOwnProperty(type) && out[type]) {
	if (process.env.DRY_RUN) {
		process.stdout.write('_'+type+'\n'+out[type].replace(/^/gm, '\t')+'\n\n');
	}
	else {
		fs.writeFileSync(path.resolve(dest, '_'+type), out[type]+'\n');
		process.stdout.write('Wrote '+out[type].length+'b to _'+type+'\n');
	}
}

function convert(config) {
	var redirects = [],
		headers = [];

	if (config.redirects) {
		redirects = redirects.concat(
			config.redirects.map(function(rule) {
				var status = rule.type==='proxy' ? 200 : rule.type;
				return normalizeSource(rule.source) + '  ' + normalizeDest(rule.destination) + (status ? ('  ' + status) : '');
			})
		);
	}

	if (config.fallback) {
		redirects.push('/* '+pathname(config.fallback)+' 200');
	}

	if (config.headers) {
		headers = config.headers.map(function(rule) {
			var out = normalizeSource(rule.source);
			for (var i=0; i<rule.headers.length; i++) {
				var header = rule.headers[i];
				out += '\n  ' + header.key + ': ' + header.value;
			}
			return out;
		})
	}

	return {
		redirects: redirects.filter(Boolean).join('\n'),
		headers: headers.filter(Boolean).join('\n')
	}
}

function pathname(str) {
	if (!str.match(/^https?:\/\//)) {
		str = '/' + str.replace(/(^\/+|\/+$)/g, '');
	}
	return str;
}

function normalizeSource(str) {
	var count = 0;
	return pathname(str).replace('(.*)', '**').replace(/(^|[^*])\*([^*]|$)/g, function (s, before, after) {
		return before + ':uu' + (++count) + after;
	}).replace(/\*\*/, '*');
}

function normalizeDest(str) {
	return pathname(str).replace(/\$1/g, ':splat');
}
