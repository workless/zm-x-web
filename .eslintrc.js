const fs = require('fs');
const path = require('path');

module.exports = {
	"extends": [
		"eslint-config-synacor",
		"plugin:testcafe/recommended"
	],
	"plugins": [
		"graphql",
		"testcafe"
	],
	"globals": {
		"CLIENT": true
	},
	"rules": {
		"eqeqeq": [
			2,
			"smart"
		],
		"react/jsx-wrap-multilines": 1,
		"no-shadow": "error",
		"no-unused-vars": [
			"error",
			{
				"vars": "all",
				"args": "after-used",
				"ignoreRestSiblings": true
			}
		],
		"graphql/template-strings": [
			"error",
			{
				"env": "literal",
				"schemaString": fs.readFileSync(require.resolve('@zimbra/api-client/src/schema/schema.graphql'), 'utf8'),
			}
		]
	},
	"settings": {
		"react": {
			"pragma": "h"
		}
	}
}
