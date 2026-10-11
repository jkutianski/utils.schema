export type SchemaDefinition = unknown;

export type URLParams<T = Record<string, SchemaDefinition>> =
	T extends Record<string, SchemaDefinition> ? T : Record<string, SchemaDefinition>;

export interface SchemaRoute<
	URLParamsSchema = SchemaDefinition,
	RequestSchema = SchemaDefinition,
	ResponseSchema = SchemaDefinition
> {
	urlParams?: URLParamsSchema;
	request?: RequestSchema;
	response?: ResponseSchema;
}

type RouteSchemaKeys = 'urlParams' | 'request' | 'response';

export type RouteSchemas<Routes extends Record<string, SchemaRoute>> = {
	[RouteKey in keyof Routes]: {
		[SchemaKey in keyof Routes[RouteKey] & RouteSchemaKeys]:
			Exclude<Routes[RouteKey][SchemaKey], undefined>;
	}[keyof Routes[RouteKey] & RouteSchemaKeys];
}[keyof Routes];

export interface RouteEntry<Route extends SchemaRoute = SchemaRoute> {
	method: string;
	segments: string[];
	queryParams: [string, string][];
	schema: Route;
}

export function decodePathSegments(pathname: string): string[];

export function parseRouteEntries<Routes extends Record<string, SchemaRoute>>(
	routes: Routes,
): RouteEntry<Routes[keyof Routes]>[];

export function matchRoute<Route extends SchemaRoute>(
	method: string | undefined,
	pathname: string,
	searchParams: URLSearchParams,
	routeEntries: RouteEntry<Route>[],
): { params: Record<string, string>; schema: Route } | undefined;
