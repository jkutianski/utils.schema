import assert from 'node:assert/strict';
import test from 'node:test';

import { decodePathSegments, matchRoute, parseRouteEntries } from '../src/index.js';

test('decodes path segments', () => {
	assert.deepEqual(decodePathSegments('/users/a%20b'), ['', 'users', 'a b']);
});

test('parses route methods, paths, and query patterns', () => {
	const schema = { request: 'request-schema' };
	const [route] = parseRouteEntries({
		'get /users/:id?view=:view&active=true': schema,
	});

	assert.deepEqual(route, {
		method: 'GET',
		segments: ['', 'users', ':id'],
		queryParams: [['view', ':view'], ['active', 'true']],
		schema,
	});
});

test('rejects malformed route keys', () => {
	for (const key of ['GET users', 'GET /users#fragment', 'GET /users?']) {
		assert.throws(() => parseRouteEntries({ [key]: {} }), {
			name: 'TypeError',
			message: `invalid route key: ${key}`,
		});
	}
});

test('matches a route and extracts path and query parameters', () => {
	const schema = { request: 'request-schema' };
	const routes = parseRouteEntries({
		'GET /users/:id?view=:view&active=true': schema,
	});

	assert.deepEqual(
		matchRoute('get', '/users/42', new URLSearchParams('view=compact&active=true&extra=yes'), routes),
		{
			params: { id: '42', view: 'compact' },
			schema,
		},
	);
});

test('does not match when the method, path, or required query pattern differs', () => {
	const routes = parseRouteEntries({
		'GET /users/:id?active=true': {},
	});

	assert.equal(matchRoute('POST', '/users/42', new URLSearchParams('active=true'), routes), undefined);
	assert.equal(matchRoute('GET', '/users/42/details', new URLSearchParams('active=true'), routes), undefined);
	assert.equal(matchRoute('GET', '/users/42', new URLSearchParams('active=false'), routes), undefined);
	assert.equal(matchRoute('GET', '/users/42', new URLSearchParams(), routes), undefined);
});

test('safely extracts parameter names that are object prototype properties', () => {
	const routes = parseRouteEntries({
		'GET /:__proto__?constructor=:constructor': {},
	});

	const result = matchRoute('GET', '/value', new URLSearchParams('constructor=other'), routes);

	assert.equal(Object.getPrototypeOf(result.params), Object.prototype);
	assert.equal(result.params.__proto__, 'value');
	assert.equal(result.params.constructor, 'other');
});
