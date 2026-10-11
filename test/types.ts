import {
	decodePathSegments,
	matchRoute,
	parseRouteEntries,
	type RouteEntry,
	type RouteSchemas,
	type SchemaRoute,
	type URLParams,
} from '../src/index.js';

const routes = {
	'GET /users/:id': {
		request: { parse: (value: unknown) => String(value) },
		response: { parse: (value: unknown) => String(value) },
	},
} satisfies Record<string, SchemaRoute>;

const routeEntries: RouteEntry<(typeof routes)[keyof typeof routes]>[] = parseRouteEntries(routes);
const routeSchemas: RouteSchemas<typeof routes> =
	routes['GET /users/:id'].request;
const urlParams: URLParams<{ id: string }> = { id: '42' };
const decodedSegments: string[] = decodePathSegments('/users/42');
const matchedRoute = matchRoute('GET', '/users/42', new URLSearchParams(), routeEntries);

if (matchedRoute) {
	const schema: (typeof routes)[keyof typeof routes] = matchedRoute.schema;
	const param: string = matchedRoute.params.id;
	void schema;
	void param;
}

void routeSchemas;
void urlParams;
void decodedSegments;
