import { Router } from 'express';
import { RequestWithBucket } from '../types/req.js';
import { db } from '../db.js';
import express from 'express';
import { createBucket, deleteBucket } from '../bucket/bucket.js';
import { getAdapter } from '../fs/file-system.js';

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
	const authorized = req.user === 'root';
	if (!authorized) {
		res.status(403).send();
		return;
	}

	const buckets = await db.bucket.findMany();
	res.status(200).json(buckets);
});

apiRouter.get('/buckets/:bucketId', async (req: RequestWithBucket, res) => {
	const authorized = req.user === 'root';
	if (!authorized) {
		res.status(403).send();
		return;
	}

	const bucket = await db.bucket.findUnique({
		where: {
			name: req.params.bucketId,
		},
	});

	if (!bucket) {
		res.status(404).send();
		return;
	}

	res.status(200).json(bucket);
});

apiRouter.delete('/buckets/:bucketId', async (req: RequestWithBucket, res) => {
	const authorized = req.user === 'root';
	if (!authorized) {
		res.status(403).send();
		return;
	}

	const bucket = await db.bucket.findUnique({
		where: {
			name: req.params.bucketId,
		},
	});

	if (!bucket) {
		res.status(404).send();
		return;
	}

	const result = await deleteBucket(bucket.name);
	if (!result) {
		res.status(500).send();
		return;
	}

	res.status(204).send();
});

apiRouter.post('/buckets/:bucketId', async (req: RequestWithBucket, res) => {
	const { bucketId } = req.params;
	const { adapter, owner, isPublic } = req.body;

	const fsAdapter = getAdapter(adapter);
	const bucket = await createBucket(fsAdapter, bucketId, owner, isPublic);

	if (!bucket) {
		res.status(500).send();
		return;
	}

	res.status(200).json(bucket);
});

export { apiRouter };
