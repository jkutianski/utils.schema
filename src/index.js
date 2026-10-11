/**
 * Adds a parameter to the result without invoking inherited property setters.
 *
 * @param {Record<string, string>} params - Parameters collected from the route.
 * @param {string} name - Parameter name.
 * @param {string} value - Parameter value.
 * @returns {void}
 */
function defineParam(params, name, value) {
	Object.defineProperty(params, name, {
		configurable: true,
		enumerable: true,
		value,
		writable: true,
	});
}

/**
 * Matches path segments against a route pattern and extracts named segments.
 *
 * @param {string[]} patternSegments - Decoded route pattern segments.
 * @param {string[]} pathSegments - Decoded request path segments.
 * @returns {Record<string, string> | null} Extracted parameters, or `null` if the paths differ.
 */
function matchPath(patternSegments, pathSegments) {
	if (patternSegments.length !== pathSegments.length) {
		return null;
	}

	/** @type {Record<string, string>} */
	const params = {};
	for (const [index, segment] of patternSegments.entries()) {
		const pathSegment = pathSegments[index];
		const isParameter = segment.startsWith(':');
		if (isParameter ? pathSegment.length === 0 : segment !== pathSegment) {
			return null;
		}

		if (isParameter) {
			defineParam(params, segment.slice(1), pathSegment);
		}
	}

	return params;
}

/**
 * Checks required query parameters and extracts values for named parameters.
 *
 * @param {[string, string][]} patternParams - Query parameter names and expected values.
 * @param {URLSearchParams} searchParams - Query parameters from the request URL.
 * @param {Record<string, string>} params - Parameters to add extracted values to.
 * @returns {boolean} Whether all query patterns match.
 */
function matchQuery(patternParams, searchParams, params) {
	for (const [key, patternValue] of patternParams) {
		const value = searchParams.get(key);
		if (value === null) {
			return false;
		}

		if (patternValue.startsWith(':')) {
			defineParam(params, patternValue.slice(1), value);
		} else if (patternValue !== value) {
			return false;
		}
	}

	return true;
}

/**
 * Splits a pathname into URI-decoded segments.
 *
 * @param {string} pathname - URL pathname to split.
 * @returns {string[]} Decoded path segments, including empty segments.
 * @throws {URIError} If a segment contains malformed percent-encoding.
 */
export function decodePathSegments(pathname) {
	return pathname.split('/').map((segment) => decodeURIComponent(segment));
}

/**
 * Parses route definitions into entries ready for request matching.
 *
 * Route keys use the form `"METHOD /path"` and may include query patterns.
 * A path or query parameter beginning with `:` is treated as a named parameter.
 *
 * @param {Record<string, import('./index.d.ts').SchemaRoute>} routes - Route definitions keyed by method and path.
 * @returns {import('./index.d.ts').RouteEntry[]} Parsed route entries.
 * @throws {TypeError} If a route key is malformed.
 * @throws {URIError} If a route path contains malformed percent-encoding.
 */
export function parseRouteEntries(routes) {
	return Object.entries(routes).map(([key, schema]) => {
		const match = /^([A-Za-z]+) (\/\S*)$/.exec(key);
		if (!match || match[2].includes('#')) {
			throw new TypeError(`invalid route key: ${key}`);
		}

		const queryIndex = match[2].indexOf('?');
		const pathname = queryIndex === -1 ? match[2] : match[2].slice(0, queryIndex);
		const query = queryIndex === -1 ? '' : match[2].slice(queryIndex + 1);
		if (queryIndex !== -1 && query.length === 0) {
			throw new TypeError(`invalid route key: ${key}`);
		}

		return {
			method: match[1].toUpperCase(),
			segments: decodePathSegments(pathname),
			queryParams: [...new URLSearchParams(query)],
			schema,
		};
	});
}

/**
 * Finds the first route matching the request method, pathname, and query.
 *
 * @template {import('./index.d.ts').SchemaRoute} Route
 * @param {string | undefined} method - Request method; defaults to `GET` when omitted.
 * @param {string} pathname - Request pathname.
 * @param {URLSearchParams} searchParams - Query parameters from the request URL.
 * @param {{
 *   method: string,
 *   segments: string[],
 *   queryParams: [string, string][],
 *   schema: Route
 * }[]} routeEntries - Parsed routes to search, in precedence order.
 * @returns {{ params: Record<string, string>, schema: Route } | undefined} The matched route
 *   and its parameters, or `undefined` if none match.
 * @throws {URIError} If the pathname contains malformed percent-encoding.
 */
export function matchRoute(method, pathname, searchParams, routeEntries) {
	const normalizedMethod = typeof method === 'string' ? method.toUpperCase() : 'GET';
	const pathSegments = decodePathSegments(pathname);

	for (const route of routeEntries) {
		if (route.method !== normalizedMethod) {
			continue;
		}

		const params = matchPath(route.segments, pathSegments);
		if (params !== null && matchQuery(route.queryParams, searchParams, params)) {
			return { params, schema: route.schema };
		}
	}

	return undefined;
}
