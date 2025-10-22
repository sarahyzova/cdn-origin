import { db } from 'src/db';
import { createBucketStorage, FsAdapter } from 'src/fs/file-system';
import { bucketCriticalLimiter } from 'src/limiter';
import { logger } from 'src/logger';

export function isValidBucketName(name: string) {
	const regex = /^[a-z0-9\-]{3,63}$/;
	return regex.test(name);
}

export function normalizeBucketName(name: string) {
	return name.toLowerCase().trim();
}

export async function createBucket(
	adapter: FsAdapter,
	name: string,
	owner: string | null = null,
	isPublic: boolean = false,
) {
	const normalized = normalizeBucketName(name);
	await bucketCriticalLimiter(async () => {
		const exists = await db.bucket.findUnique({
			where: {
				name: normalized,
			},
		});
		if (exists) {
			throw new Error('Bucket already exists');
		}

		if (!isValidBucketName(normalized)) {
			throw new Error('Invalid bucket name');
		}

		await createBucketStorage(adapter, normalized);
		const bucket = await db.bucket.create({
			data: {
				name: normalized,
				owner,
				public: isPublic,
				adapter: adapter.type,
			},
		});

		logger.info(`Bucket created: ${normalized}`);

		return bucket;
	});
}
