import { Router } from 'express';
import { db } from 'src/db';
import { deleteFile, getAdapter, joinPath } from 'src/fs/file-system';
import { RequestWithBucket } from 'src/types/req';
import { createWriteStream } from 'fs';
import fs from 'fs/promises';

const bucketRouter = Router();

bucketRouter.use((req: RequestWithBucket, res, next) => {
	if (req.bucketName) {
		next();
		return;
	}
	next('router');
});

// Show file
bucketRouter.get('/*path', async (req: RequestWithBucket, res) => {
	const bucketName = req.bucketName;
	const rawPath = req.params.path as any as string | string[];
	const filePath = Array.isArray(rawPath) ? rawPath.join('/') : rawPath;

	const fileObject = await db.fileObject.findUnique({
		where: {
			bucketName_key: {
				bucketName: bucketName!,
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
				bucketName: bucketName!,
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

	const fileAdapter = getAdapter(fileObject.bucket.adapter);

	// Delete file from filesystem
	const deleted = await deleteFile(fileAdapter, fileObject);
	if (!deleted) {
		res.status(500).send('Failed to delete file');
		return;
	}

	fileObject.children.forEach(async (child) => {
		await deleteFile(fileAdapter, child);
	});

	// Delete file record from database
	await db.fileObject.deleteMany({
		where: {
			OR: [{ id: fileObject.id }, { parentId: fileObject.id }],
		},
	});

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
	const rawPath = req.params.path as any as string | string[];
	const filePath = Array.isArray(rawPath) ? rawPath.join('/') : rawPath;

	const authorized = req.user === 'root';

	if (!authorized) {
		res.status(403).send('Not authorized to upload to this bucket');
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

	try {
		const file = await db.fileObject.create({
			data: {
				bucketName: bucketName!,
				key: filePath,
				size: length,
				mimeType: contentType,
				public: false,
			},
			include: { bucket: true },
		});

		const fileAdapter = getAdapter(file.bucket.adapter);
		const realPath = fileAdapter.getFilePath(file);

		const dirPath = joinPath(realPath, '..');
		await fs.mkdir(dirPath, { recursive: true });

		// Upload file from body to filesystem
		const writeStream = createWriteStream(realPath);
		req.pipe(writeStream);

		writeStream.on('finish', () => {
			res.status(201).send('File uploaded successfully');
		});

		writeStream.on('error', (err) => {
			res.status(500).send('Failed to upload file');
		});
	} catch (e) {
		res.status(500).send('Failed to create file record');
		return;
	}
});

export { bucketRouter };
