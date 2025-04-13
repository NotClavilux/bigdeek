export const corsHeadersFull = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': '*',
	'Access-Control-Max-Age': '86400',
};

export const corsHeadersLite = {
	'Access-Control-Allow-Origin': '*',
};

export function generateIP(): string {
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

export const pathnameDomainRegex = /^\/((?:\d{1,3}\.){3}\d{1,3}|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:\/.*)?$/
