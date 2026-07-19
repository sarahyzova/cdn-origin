import { config } from '../config.js';
import { logger } from '../logger.js';

/**
 * Purges specific URLs from Cloudflare's edge cache. Called whenever a public object is
 * deleted or overwritten so stale content doesn't keep being served after the origin changes.
 * No-op if Cloudflare credentials aren't configured (e.g. local development).
 */
export async function purgeCloudflareCache(urls: string[]) {
	if (!config.CLOUDFLARE_ZONE_ID || !config.CLOUDFLARE_API_TOKEN) return;
	if (urls.length === 0) return;

	try {
		const response = await fetch(
			`https://api.cloudflare.com/client/v4/zones/${config.CLOUDFLARE_ZONE_ID}/purge_cache`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${config.CLOUDFLARE_API_TOKEN}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ files: urls }),
				signal: AbortSignal.timeout(5000),
			},
		);

		if (!response.ok) {
			logger.warn(
				`Cloudflare cache purge failed (${response.status}) for: ${urls.join(', ')}`,
			);
		}
	} catch (err) {
		logger.warn('Cloudflare cache purge request failed', err);
	}
}
