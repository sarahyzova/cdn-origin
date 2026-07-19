import { IncomingHttpHeaders } from 'http';

export function parseExpirationHeaders(
	headers: IncomingHttpHeaders,
): Date | null | 'invalid' {
	const expiresAtHeader = headers['x-expires-at'];
	const expiresInHeader = headers['x-expires-in'];

	if (expiresAtHeader) {
		const value = Array.isArray(expiresAtHeader)
			? expiresAtHeader[0]
			: expiresAtHeader;
		const date = new Date(value);
		if (isNaN(date.getTime())) {
			return 'invalid';
		}
		return date;
	}

	if (expiresInHeader) {
		const value = Array.isArray(expiresInHeader)
			? expiresInHeader[0]
			: expiresInHeader;
		const seconds = parseInt(value, 10);
		if (isNaN(seconds) || seconds <= 0) {
			return 'invalid';
		}
		return new Date(Date.now() + seconds * 1000);
	}

	return null;
}

export function isExpired(fileObject: { expiresAt: Date | null }) {
	return !!fileObject.expiresAt && fileObject.expiresAt.getTime() <= Date.now();
}
