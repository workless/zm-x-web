#!/usr/bin/env node

/*
	Introspect the Zimbra GraphQL Schema and generate TypeScript types.
	Bonus: this also lints the schema.
*/

const shell = require('shelljs');

const ROOT = '../zm-api-js-client/src/schema';
const SCHEMA = `${ROOT}/schema.graphql`;
const INTROSPECTED_SCHEMA = '.tmp/introspected-schema.json';
const TYPESCRIPT_TYPES_OUTPUT = `${ROOT}/generated-schema-types.ts`;
const GRAPHQL_FILE_PATTERN = '**/!\\(schema\\).graphql';

shell.mkdir('-p', '.tmp');
shell.exec(
	`apollo-codegen introspect-schema ${SCHEMA} --output ${INTROSPECTED_SCHEMA} && apollo-codegen generate ${GRAPHQL_FILE_PATTERN} --schema ${INTROSPECTED_SCHEMA} --target typescript --output ${TYPESCRIPT_TYPES_OUTPUT}`
);
