import { Response, NextFunction } from 'express';
import { config } from '../config.js';
import { RequestWithBucket } from '../types/req.js';
import { Actor } from '../permissions/actor.js';
import { actorFromSignature } from '../signature.js';

export async function authorizeMiddleware(
	req: RequestWithBucket,
	res: Response,
	next: NextFunction,
) {
	const authorization = req.headers['authorization'];
	const { signature, exp } = req.query;

	// TODO: Bucket authentication

	req.actor = authorizationTokenToActor(authorization) ||
		signatureToActor(signature as string) || {
			type: 'anonymous',
		};
	next();
}

function authorizationTokenToActor(token?: string): Actor | null {
	if (!token) {
		return null;
	}

	const tokenSplit = token.split(' ')[1];
	if (tokenSplit !== config.JWT_SECRET) {
		return null;
	}

	return {
		type: 'root',
	};
}

function signatureToActor(token?: string): Actor | null {
	if (!token) {
		return null;
	}

	const validation = actorFromSignature(token);
	if (!validation.valid) {
		return null;
	}

	return validation.actor;
}
