import { getBasePath, joinPath } from './fs/file-system';
import fs from 'fs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from './config';

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

export function createReadFileSignature(
	bucket: string,
	fileKey: string,
	expiresInSeconds: number,
) {
	const key = getSecretKey();
	const expireTime = Math.floor(Date.now() / 1000) + expiresInSeconds;
	const jwtPayload = {
		action: 'read',
		bucket,
		key: fileKey,
		exp: expireTime,
	};

	const token = jwt.sign(jwtPayload, key);
	return token;
}

export function verifyReadFileSignature(
	token: string,
	bucket: string,
	fileKey: string,
): boolean {
	const key = getSecretKey();
	try {
		const verified = jwt.verify(token, key);
		console.log(verified);

		if (typeof verified === 'string') return false;

		// File ID check
		return (
			verified.bucket === bucket &&
			verified.key === fileKey &&
			verified.action === 'read'
		);
	} catch (err) {
		return false;
	}
}
