import { Response, NextFunction } from 'express';
import { config } from '../config';
import { RequestWithBucket } from 'src/types/req';

export async function authorizeMiddleware(
	req: RequestWithBucket,
	res: Response,
	next: NextFunction,
) {
	const authorization = req.headers['authorization'];
	if (!authorization) {
		req.user = 'anonymous';
		next();
		return;
	}

	const token = authorization.split(' ')[1];
	if (token === config.JWT_SECRET) {
		req.user = 'root';
		next();
		return;
	}

	next();
}
