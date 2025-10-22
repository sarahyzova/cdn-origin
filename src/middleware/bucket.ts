import { Response, NextFunction } from 'express';
import { config } from '../config';
import { RequestWithBucket } from 'src/types/req';

export async function bucketMiddleware(
	req: RequestWithBucket,
	res: Response,
	next: NextFunction,
) {
	const host = req.hostname;

	if (host === config.DOMAIN_SUFFIX) {
		res.status(400).send('No bucket specified');
		return;
	}

	if (!host.endsWith(`.${config.DOMAIN_SUFFIX}`)) {
		res.status(400).send('Invalid domain');
		return;
	}

	const bucketName = host.slice(0, -`.${config.DOMAIN_SUFFIX}`.length);

	if (!bucketName) {
		res.status(400).send('No bucket specified');
		return;
	}

	if (bucketName !== config.API_ALIAS) {
		req.bucketName = bucketName;
	}

	next();
}
