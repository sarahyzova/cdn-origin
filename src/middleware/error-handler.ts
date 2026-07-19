import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger.js';

// Express identifies this as an error-handling middleware purely by its 4-argument arity.
export function errorHandlerMiddleware(
	err: unknown,
	req: Request,
	res: Response,
	next: NextFunction,
) {
	if (res.headersSent) {
		next(err);
		return;
	}

	logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);
	res.status(500).json({ error: 'Internal server error' });
}
