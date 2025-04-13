import { corsHeadersFull, corsHeadersLite, generateIP, pathnameDomainRegex } from './helpers';

function redirectDocs(): Response {
	return new Response(null, {
		status: 307,
		headers: {
			Location: 'https://github.com/dragsbruh/soxy',
			...corsHeadersLite,
		},
	});	
}

async function hitOrigin(
	url: URL,
	method: string,
	headers: Headers,
	body: BodyInit | null,
	redirect: 'manual' | 'follow' | 'error' = 'follow'
): Promise<Response | null> {
	try {
		const response = await fetch(url, { method, headers, body, redirect });
		return response;
	} catch (e) {
		console.error(e);
		return null;
	}
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: corsHeadersFull,
			});
		}

		const url = new URL(request.url);

		const origin = request.headers.get('x-forward-to') || request.headers.get('sorigin') || url.pathname.match(pathnameDomainRegex)?.[1];
		const redirectBehavior = request.headers.get('x-redirect-behavior') || url.searchParams.get('soxy-redirects') || 'follow';

		if (redirectBehavior !== 'follow' && redirectBehavior !== 'manual' && redirectBehavior !== 'error') return new Response('invalid redirect behavior', { status: 400, headers: corsHeadersLite });

		if (url.pathname === '/docs' || (url.pathname === '/docs/' && !origin)) return redirectDocs();

		if (!origin)
			return new Response('thats not right, see /docs', {
				status: 400,
				headers: corsHeadersLite,
			});

		url.searchParams.delete('soxy-redirects');

		console.log(url.search);

		const finalPath = url.pathname.split('/').slice(2).join('/'); // both the initial slash and after domain slash
		const constructedUrl = new URL(`https://${origin}/${finalPath}${url.search}`);
		const constructedHeaders = new Headers(request.headers);

		constructedHeaders.set('x-forwarded-for', generateIP());
		constructedHeaders.delete('sorigin');
		constructedHeaders.delete('x-forward-to');
		constructedHeaders.delete('x-redirect-behavior');

		const response = await hitOrigin(constructedUrl, request.method, constructedHeaders, request.body, redirectBehavior);

		const responseHeaders = response ? new Headers(response.headers) : new Headers();

		responseHeaders.set('x-resolved', url.toString());
		responseHeaders.set('x-resolved-method', request.method);
		responseHeaders.set('x-resolved-url', response?.url ?? url.toString());

		// redirect prevention
		responseHeaders.set('cache-control', 'no-cache, no-store, must-revalidate');
		responseHeaders.set('pragma', 'no-cache');
		responseHeaders.set('expires', '0');

		if (!response) {
			return new Response('the origin was unavailable or there was an error accessing it', {
				status: 502,
				headers: {
					...responseHeaders,
					...corsHeadersLite,
				},
			});
		}

		return new Response(response.body, {
			status: response.status > 300 && response.status < 400 ? 307 : response.status,
			headers: {
				...responseHeaders,
				...corsHeadersLite,
			},
		});
	},
} satisfies ExportedHandler<Env>;
