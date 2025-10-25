import { mkdir, rm } from 'fs/promises';
import { db } from '../db.js';
import {
	createBucketStorage,
	deleteFile,
	FsAdapter,
	getAdapter,
	joinPath,
} from '../fs/file-system.js';
import { bucketCriticalLimiter } from '../limiter.js';
import { logger } from '../logger.js';
import { createWriteStream } from 'fs';
import { FileObject } from '../generated/prisma/index.js';
import Stream from 'stream';
import { config } from '../config.js';

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
	return await bucketCriticalLimiter(async () => {
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

export async function deleteBucket(bucketName: string) {
	const bucket = await db.bucket.delete({
		where: {
			name: bucketName,
		},
	});

	if (!bucket) {
		return false;
	}

	const adapter = getAdapter(bucket.adapter);
	const bucketPath = adapter.getBucketPath(bucket.name);
	await rm(bucketPath, {
		recursive: true,
		force: true,
	});

	logger.info(`Bucket created: ${bucketName}`);

	return true;
}

export async function deleteObject(objectId: string) {
	const fileToDelete = await db.fileObject.findUnique({
		where: {
			id: objectId,
		},
		include: {
			bucket: true,
			children: true,
		},
	});

	if (!fileToDelete) {
		return false;
	}

	const adapter = getAdapter(fileToDelete.bucket.adapter);

	const deletions = await Promise.all([
		deleteFile(adapter, fileToDelete),
		...fileToDelete.children.map((child) => deleteFile(adapter, child)),
		db.fileObject.deleteMany({
			where: {
				OR: [{ id: fileToDelete.id }, { parentId: fileToDelete.id }],
			},
		}),
	]);

	const success = !!deletions[deletions.length - 1];

	if (fileToDelete.parentId) {
		return await deleteObject(fileToDelete.parentId);
	}
	return success;
}

type CreateObjectOptions = {
	bucketName: string;
	key: string;
	size: number;
	mimeType: string;
	public?: boolean;
	data: Stream;
};
export function createObject(
	options: CreateObjectOptions,
): Promise<FileObject | null> {
	return new Promise(async (resolve, reject) => {
		try {
			const file = await db.fileObject.create({
				data: {
					bucketName: options.bucketName,
					key: options.key,
					size: options.size,
					mimeType: options.mimeType,
					public: false,
				},
				include: { bucket: true },
			});
			logger.info(
				`Uploading file ${file.bucketName}.${config.DOMAIN_SUFFIX}/${file.key}`,
			);

			const fileAdapter = getAdapter(file.bucket.adapter);
			const realPath = fileAdapter.getFilePath(file);

			const dirPath = joinPath(realPath, '..');
			await mkdir(dirPath, { recursive: true });

			const writeStream = createWriteStream(realPath);
			writeStream.on('finish', () => {
				resolve(file);
			});

			writeStream.on('error', (err) => {
				resolve(null);
			});
			options.data.pipe(writeStream);
		} catch {
			resolve(null);
		}
	});
}
