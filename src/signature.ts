import { getBasePath, joinPath } from './fs/file-system.js';
import fs from 'fs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from './config.js';

let signatureKey: string | null = null;
function getSecretKey() {
	if (config.JWT_SECRET) return config.JWT_SECRET;
	if (signatureKey) return signatureKey;

	const path = joinPath(getBasePath(), 'secrets', 'signature.key');
	const keyExists = fs.existsSync(path);
	if (!keyExists) {
		signatureKey = generateSecretKey();
		fs.mkdirSync(joinPath(getBasePath(), 'secrets'), { recursive: true });
		fs.writeFileSync(path, signatureKey, { encoding: 'utf-8' });
		return signatureKey;
	}

	signatureKey = fs.readFileSync(path, { encoding: 'utf-8' });
	return signatureKey;
}

function generateSecretKey() {
	return crypto.randomBytes(64).toString('hex');
}

export function createFileSignature(
	bucket: string,
	action: 'read' | 'write',
	fileKey: string,
	expiresInSeconds: number = 3600,
) {
	const jwtSecret = getSecretKey();
	const expireTime = Math.floor(Date.now() / 1000) + expiresInSeconds;
	const jwtPayload = {
		action,
		bucket,
		key: fileKey,
		exp: expireTime,
	};

	const token = jwt.sign(jwtPayload, jwtSecret);
	return token;
}

export function verifyFileSignature(
	token: string,
	bucket: string,
	action: 'read' | 'write',
	fileKey: string,
): boolean {
	const key = getSecretKey();
	try {
		const verified = jwt.verify(token, key);

		if (typeof verified === 'string') return false;

		// File ID check
		return (
			verified.bucket === bucket &&
			verified.key === fileKey &&
			verified.action === action
		);
	} catch (err) {
		return false;
	}
}
