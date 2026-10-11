import { describe, expect, test } from '@jest/globals';

import { decodePathSegments, matchRoute, parseRouteEntries } from '../src/index.js';

describe('route utilities', () => {
	test('decodes path segments', () => {
		expect(decodePathSegments('/users/a%20b')).toEqual(['', 'users', 'a b']);
	});

	test('parses route methods, paths, and query patterns', () => {
		const schema = { request: 'request-schema' };
		const [route] = parseRouteEntries({
			'get /users/:id?view=:view&active=true': schema,
		});

		expect(route).toEqual({
			method: 'GET',
			segments: ['', 'users', ':id'],
			queryParams: [['view', ':view'], ['active', 'true']],
			schema,
		});
	});

	test('rejects malformed route keys', () => {
		for (const key of ['GET users', 'GET /users#fragment', 'GET /users?']) {
			expect(() => parseRouteEntries({ [key]: {} })).toThrow(`invalid route key: ${key}`);
		}
	});

	test('matches a route and extracts path and query parameters', () => {
		const schema = { request: 'request-schema' };
		const routes = parseRouteEntries({
			'GET /users/:id?view=:view&active=true': schema,
		});

		expect(
			matchRoute('get', '/users/42', new URLSearchParams('view=compact&active=true&extra=yes'), routes),
		).toEqual({
			params: { id: '42', view: 'compact' },
			schema,
		});
	});

	test('defaults the method to GET when omitted', () => {
		const routes = parseRouteEntries({
			'GET /users/:id?view=:view': {},
		});

		expect(matchRoute(undefined, '/users/42', new URLSearchParams('view=compact'), routes)).toEqual({
			params: { id: '42', view: 'compact' },
			schema: {},
		});
	});

	test('rejects empty path parameter values', () => {
		const routes = parseRouteEntries({
			'GET /:id': {},
		});

		expect(matchRoute('GET', '/', new URLSearchParams(), routes)).toBeUndefined();
	});

	test('does not match when the method, path, or required query pattern differs', () => {
		const routes = parseRouteEntries({
			'GET /users/:id?active=true': {},
		});

		expect(matchRoute('POST', '/users/42', new URLSearchParams('active=true'), routes)).toBeUndefined();
		expect(matchRoute('GET', '/users/42/details', new URLSearchParams('active=true'), routes)).toBeUndefined();
		expect(matchRoute('GET', '/users/42', new URLSearchParams('active=false'), routes)).toBeUndefined();
		expect(matchRoute('GET', '/users/42', new URLSearchParams(), routes)).toBeUndefined();
	});

	test('safely extracts parameter names that are object prototype properties', () => {
		const routes = parseRouteEntries({
			'GET /:__proto__?constructor=:constructor': {},
		});

		const result = matchRoute('GET', '/value', new URLSearchParams('constructor=other'), routes);

		expect(Object.getPrototypeOf(result.params)).toBe(Object.prototype);
		expect(result.params.__proto__).toBe('value');
		expect(result.params.constructor).toBe('other');
	});
});
