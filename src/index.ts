function generateValidIPv4(): string {
	const nonRoutableRanges = [
		[0, 10], // 0.0.0.0 - 10.255.255.255
		[100, 127], // 100.64.0.0 - 127.255.255.255 (includes loopback)
		[169, 172], // 169.254.0.0 - 172.31.255.255
		[192, 192], // 192.0.0.0 - 192.255.255.255 (includes private & reserved)
		[224, 255], // 224.0.0.0 - 255.255.255.255 (multicast & reserved)
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
		const originURL = request.headers.get('SOrigin');

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
			if (url.pathname === '/docs') {
				return new Response(null, {
					headers: {
						Location: 'https://rentry.co/soxydocs',
						'Access-Control-Allow-Origin': '*',
						'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
						Pragma: 'no-cache',
						Expires: '0',
						Vary: '*',
					},
					status: 302,
				});
			}

			return new Response('missing an SOrigin. see /docs', {
				status: 400,
			});
		}

		const origin = originURL.startsWith('http') ? new URL(originURL) : new URL(`http://${originURL}`);

		origin.protocol = url.protocol;
		origin.pathname = url.pathname;
		origin.search = url.search;

		const reqHeaders = new Headers(request.headers);
		reqHeaders.delete('SOrigin');
		reqHeaders.set('X-Forwarded-For', generateValidIPv4());

		try {
			const originResponse = await fetch(origin.toString(), {
				method: request.method,
				headers: reqHeaders,
				body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
				redirect: 'manual',
			});

			const newHeaders = new Headers(originResponse.headers);
			newHeaders.set('X-Resolved', origin.toString());

			return new Response(originResponse.body, {
				status: originResponse.status === 301 ? 302 : originResponse.status,
				headers: newHeaders,
			});
		} catch (e) {
			return new Response('unable to connect to origin', {
				status: 400,
			});
		}
	},
} satisfies ExportedHandler<Env>;
