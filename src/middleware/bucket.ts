import { Response, NextFunction } from 'express';
import { config } from '../config.js';
import { RequestWithBucket } from '../types/req.js';
import { logger } from '../logger.js';

export async function bucketMiddleware(
	req: RequestWithBucket,
	res: Response,
	next: NextFunction,
) {
	const host = req.hostname;

	if (host === config.DOMAIN_SUFFIX) {
		next();
		return;
	}

	if (!host.endsWith(`.${config.DOMAIN_SUFFIX}`)) {
		res.status(400).send('Invalid domain');
		logger.warn(`Request with invalid domain: ${host}`);
		return;
	}

	const bucketName = host.slice(0, -`.${config.DOMAIN_SUFFIX}`.length);
	if (!bucketName) {
		next();
		return;
	}

	req.bucketName = bucketName;
	next();
}
