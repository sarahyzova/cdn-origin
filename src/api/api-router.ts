import { Router } from 'express';
import { RequestWithBucket } from '../types/req.js';
import { db } from '../db.js';
import express from 'express';
import { createBucket, deleteBucket } from '../bucket/bucket.js';
import { getAdapter } from '../fs/file-system.js';
import { checkPermissions } from '../permissions/check.js';

const apiRouter = Router();
apiRouter.use((req: RequestWithBucket, res, next) => {
	if (!req.bucketName) {
		next();
		return;
	}
	next('router');
});
apiRouter.use(express.json());

apiRouter.get('/buckets', async (req: RequestWithBucket, res) => {
	const authorized = checkPermissions(
		req.actor,
		'instance',
		'listBuckets',
		undefined,
	);
	if (!authorized) {
		res.status(403).send();
		return;
	}

	const buckets = await db.bucket.findMany();
	res.status(200).json(buckets);
});

apiRouter.get('/buckets/:bucketId', async (req: RequestWithBucket, res) => {
	const bucket = await db.bucket.findUnique({
		where: {
			name: req.params.bucketId,
		},
	});

	if (!bucket) {
		res.status(404).send();
		return;
	}

	const authorized = checkPermissions(req.actor, 'bucket', 'get', bucket);
	if (!authorized) {
		res.status(403).send();
		return;
	}

	res.status(200).json(bucket);
});

apiRouter.delete('/buckets/:bucketId', async (req: RequestWithBucket, res) => {
	const bucket = await db.bucket.findUnique({
		where: {
			name: req.params.bucketId,
		},
	});

	if (!bucket) {
		res.status(404).send();
		return;
	}

	const authorized = checkPermissions(req.actor, 'bucket', 'delete', bucket);
	if (!authorized) {
		res.status(403).send();
		return;
	}

	const result = await deleteBucket(bucket.name);
	if (!result) {
		res.status(500).send();
		return;
	}

	res.status(204).send();
});

apiRouter.patch('/buckets/:bucketId', async (req: RequestWithBucket, res) => {
	const bucket = await db.bucket.findUnique({
		where: { name: req.params.bucketId },
	});

	if (!bucket) {
		res.status(404).send();
		return;
	}

	const authorized = checkPermissions(req.actor, 'bucket', 'update', bucket);
	if (!authorized) {
		res.status(403).send();
		return;
	}

	const { isPublic, indexKey, notFoundFallbackKey, accessDeniedFallbackKey } =
		req.body as {
			isPublic?: boolean;
			indexKey?: string | null;
			notFoundFallbackKey?: string | null;
			accessDeniedFallbackKey?: string | null;
		};

	const updated = await db.bucket.update({
		where: { name: bucket.name },
		data: {
			public: typeof isPublic === 'boolean' ? isPublic : undefined,
			indexKey: indexKey === undefined ? undefined : indexKey,
			notFoundFallbackKey:
				notFoundFallbackKey === undefined ? undefined : notFoundFallbackKey,
			accessDeniedFallbackKey:
				accessDeniedFallbackKey === undefined
					? undefined
					: accessDeniedFallbackKey,
		},
	});

	res.status(200).json(updated);
});

apiRouter.post('/buckets/:bucketId', async (req: RequestWithBucket, res) => {
	const { bucketId } = req.params;
	const { adapter = 'blob', owner = 'system', isPublic = false } = req.body;

	const authorized = checkPermissions(req.actor, 'bucket', 'create', {
		name: bucketId,
		accessDeniedFallbackKey: null,
		adapter: adapter,
		public: isPublic,
		owner: owner,
		createdAt: new Date(),
		updatedAt: new Date(),
		indexKey: null,
		notFoundFallbackKey: null,
	});
	if (!authorized) {
		res.status(403).send();
		return;
	}

	const fsAdapter = getAdapter(adapter);
	const bucket = await createBucket(fsAdapter, bucketId, owner, isPublic);

	if (!bucket) {
		res.status(500).send();
		return;
	}

	res.status(200).json(bucket);
});

export { apiRouter };
