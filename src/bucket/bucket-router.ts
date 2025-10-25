import { Router } from 'express';
import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import { RequestWithBucket } from '../types/req.js';
import { db } from '../db.js';
import { deleteFile, getAdapter, joinPath } from '../fs/file-system.js';
import { createObject, deleteObject } from './bucket.js';
import { getFileUrl } from './bucket-url.js';
import { parseParamWildcard } from '../utils/parse-wildcard.js';
import { inDir } from '../fs/dir.js';

const bucketRouter = Router();

bucketRouter.use((req: RequestWithBucket, res, next) => {
	if (req.bucketName) {
		next();
		return;
	}
	next('router');
});

// List directory
bucketRouter.get('/~objects{/*path}', async (req: RequestWithBucket, res) => {
	const path = parseParamWildcard(req.params.path || '');

	const bucket = await db.bucket.findUnique({
		where: {
			name: req.bucketName,
		},
		include: {
			fileObjects: {
				where: {
					key: {
						startsWith: path,
					},
				},
			},
		},
	});

	if (!bucket) {
		res.status(404).send();
		return;
	}

	const fileObjects = bucket.fileObjects;

	const authorized = req.user === 'root';
	if (!authorized) {
		res.status(403).send('Not authorized to list this bucket');
		return;
	}

	res.status(200).json(fileObjects);
});

// Show file metadata
bucketRouter.get('/~meta/*path', async (req: RequestWithBucket, res) => {
	const bucketName = req.bucketName;
	const rawPath = req.params.path as any as string | string[];
	const filePath = Array.isArray(rawPath) ? rawPath.join('/') : rawPath;

	if (!bucketName) {
		res.status(400).send('Bucket not specified');
		return;
	}

	const fileObject = await db.fileObject.findUnique({
		where: {
			bucketName_key: {
				bucketName: bucketName,
				key: filePath,
			},
		},
		include: { bucket: true, parent: true, children: true },
	});

	if (!fileObject) {
		res.status(404).send('Object not found');
		return;
	}

	const isPublic =
		fileObject.bucket.public ||
		fileObject.public ||
		fileObject.parent?.public ||
		req.user === 'root' ||
		false;

	if (!isPublic) {
		res.status(403).send('Object is not public');
		return;
	}

	res.status(200).json(fileObject);
});

// Show file
bucketRouter.get('/*path', async (req: RequestWithBucket, res) => {
	const bucketName = req.bucketName;
	const rawPath = req.params.path as any as string | string[];
	const filePath = Array.isArray(rawPath) ? rawPath.join('/') : rawPath;

	if (!bucketName) {
		res.status(400).send('Bucket not specified');
		return;
	}

	const fileObject = await db.fileObject.findUnique({
		where: {
			bucketName_key: {
				bucketName: bucketName,
				key: filePath,
			},
		},
		include: { bucket: true, parent: true },
	});

	if (!fileObject) {
		res.status(404).send('Object not found');
		return;
	}

	const isPublic =
		fileObject.bucket.public ||
		fileObject.public ||
		fileObject.parent?.public ||
		req.user === 'root' ||
		false;

	if (!isPublic) {
		res.status(403).send('Object is not public');
		return;
	}

	const fileAdapter = getAdapter(fileObject.bucket.adapter);
	const realPath = fileAdapter.getFilePath(fileObject);

	res.status(200);
	res.header('Content-Type', fileObject.mimeType);
	res.header('Content-Length', fileObject.size.toString());
	res.sendFile(realPath);
});

// Delete file
bucketRouter.delete('/*path', async (req: RequestWithBucket, res) => {
	const bucketName = req.bucketName;
	const rawPath = req.params.path as any as string | string[];
	const filePath = Array.isArray(rawPath) ? rawPath.join('/') : rawPath;

	const fileObject = await db.fileObject.findUnique({
		where: {
			bucketName_key: {
				bucketName: bucketName || '',
				key: filePath,
			},
		},
		include: { bucket: true, parent: true, children: true },
	});

	if (!fileObject) {
		res.status(404).send('Object not found');
		return;
	}

	const authorized = req.user === 'root';
	if (!authorized) {
		res.status(403).send('Not authorized to delete this object');
		return;
	}

	// Delete file from filesystem
	const deleted = await deleteObject(fileObject.id);
	if (!deleted) {
		res.status(500).send('Failed to delete file');
		return;
	}

	res.status(200).send('File deleted successfully');
});

// Empty page
bucketRouter.get('/', async (req: RequestWithBucket, res) => {
	res.status(400);
	res.send('Object not specified');
});

// Upload
bucketRouter.post('/*path', async (req: RequestWithBucket, res) => {
	const bucketName = req.bucketName;
	const filePath = parseParamWildcard(req.params.path);

	const authorized = req.user === 'root';
	if (!authorized) {
		res.status(403).send('Not authorized to upload to this bucket');
		return;
	}

	if (filePath.startsWith('~')) {
		res.sendStatus(404).send("Key can't start with ~");
		return;
	}

	const length = req.headers['content-length']
		? parseInt(req.headers['content-length'], 10)
		: 0;

	if (isNaN(length) || length <= 0) {
		res.status(400).send('Invalid Content-Length');
		return;
	}

	const contentType =
		req.headers['content-type'] || 'application/octet-stream';

	const file = await createObject({
		bucketName: bucketName!,
		key: filePath,
		mimeType: contentType,
		size: length,
		public: false,
		data: req,
	});

	if (!file) {
		res.status(500).send('Failed to upload file');
		return;
	}

	res.status(200).json({
		bucketName: file.bucketName,
		key: file.key,
		mimeType: file.mimeType,
		size: file.size,
		public: file.public,
		url: getFileUrl(file.bucketName, file.key),
	});
});

export { bucketRouter };
