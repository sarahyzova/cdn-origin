import { Response } from 'express';
import { config } from '../config.js';

/**
 * Applies Cache-Control for a served object. This header is the only signal a CDN
 * (Cloudflare) has about whether it may store and reuse a response for other visitors,
 * so it must never say "public" for anything that was only readable because of an
 * authorization check (root token / signed URL) rather than the object being truly public.
 */
export function setObjectCacheHeaders(res: Response, isPublic: boolean) {
	if (isPublic) {
		res.header(
			'Cache-Control',
			`public, max-age=${config.PUBLIC_CACHE_MAX_AGE_SECONDS}`,
		);
		return;
	}

	res.header('Cache-Control', 'private, no-store');
}

/** For JSON/API responses (metadata, directory listings) which should never be cached at the edge. */
export function setNoStoreCacheHeaders(res: Response) {
	res.header('Cache-Control', 'private, no-store');
}
