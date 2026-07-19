import { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';
import { logger } from '../logger.js';

const ORIGIN_SECRET_HEADER = 'x-origin-secret';

/**
 * Rejects any request that didn't come through Cloudflare. Configure a Cloudflare
 * Transform Rule (or Worker) to set the `X-Origin-Secret` header to ORIGIN_SHARED_SECRET
 * on every request forwarded to this origin. Without this, caching/auth decisions made by
 * this app are meaningless for anyone who can reach the origin's IP directly.
 * A no-op when ORIGIN_SHARED_SECRET isn't set, so local development is unaffected.
 */
export function originProtectionMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	if (!config.ORIGIN_SHARED_SECRET) {
		next();
		return;
	}

	const providedSecret = req.headers[ORIGIN_SECRET_HEADER];
	if (providedSecret !== config.ORIGIN_SHARED_SECRET) {
		logger.warn(`Rejected request that bypassed the CDN edge: ${req.method} ${req.originalUrl}`);
		res.status(403).send('Direct access to this origin is not allowed');
		return;
	}

	next();
}
