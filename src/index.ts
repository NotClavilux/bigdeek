function generateValidIPv4(): string {
	const nonRoutableRanges = [
		[0, 10],
		[100, 127],
		[169, 172],
		[192, 192],
		[224, 255],
	];

	let octets: number[];
	do {
		octets = Array.from({ length: 4 }, () => Math.floor(Math.random() * 256));
	} while (nonRoutableRanges.some(([start, end]) => octets[0] >= start && octets[0] <= end));

	return octets.join('.');
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const originURL = request.headers.get('sorigin');

		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
					'Access-Control-Allow-Headers': '*',
					'Access-Control-Max-Age': '86400',
				},
			});
		}

		if (!originURL) {
			return url.pathname === '/docs'
				? new Response(null, {
						status: 302,
						headers: {
							Location: 'https://rentry.co/soxydocs',
							'Access-Control-Allow-Origin': '*',
							'Cache-Control': 'no-store',
							Pragma: 'no-cache',
							Expires: '0',
						},
				  })
				: new Response('missing an sorigin. see /docs', {
                    status: 400,
                    headers: { 'Access-Control-Allow-Origin': '*' },
                });
		}

		const origin = new URL(originURL.startsWith('http') ? originURL : `http://${originURL}`);
		Object.assign(origin, { protocol: url.protocol, pathname: url.pathname, search: url.search });

		const reqHeaders = new Headers(request.headers);
		reqHeaders.delete('SOrigin');
		reqHeaders.set('X-Forwarded-For', generateValidIPv4());

		try {
			const originResponse = await fetch(origin.toString(), {
				method: request.method,
				headers: reqHeaders,
				body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
				redirect: 'manual',
			});

			const newHeaders = new Headers(originResponse.headers);
			newHeaders.set('Access-Control-Allow-Origin', '*');
			newHeaders.set('X-Resolved', origin.toString());

			return new Response(originResponse.body, {
				status: originResponse.status === 301 ? 302 : originResponse.status,
				headers: newHeaders,
			});
		} catch {
			return new Response('unable to connect to origin', {
				status: 400,
				headers: { 'Access-Control-Allow-Origin': '*' },
			});
		}
	},
} satisfies ExportedHandler<Env>;
