import path from 'path';
import fs from 'fs/promises';
import { config } from 'src/config';
import { FileObject } from 'src/generated/prisma';

export function joinPath(...parts: string[]) {
	return path.join(...parts);
}

export function getBasePath() {
	const dataPath = config.DATA_PATH;
	if (path.isAbsolute(config.DATA_PATH)) {
		return dataPath;
	}
	return path.join(process.cwd(), dataPath);
}

export type FsAdapter = {
	type: string;
	getBucketPath(bucketName: string): string;
	getFilePath(file: FileObject): string;
};

export function getAdapter(adapterName: string): FsAdapter {
	switch (adapterName) {
		case 'blob':
			return fsBlobAdapter();
		case 'keypath':
			return fsKeypathAdapter();
		default:
			throw new Error(`Unknown adapter: ${adapterName}`);
	}
}

export function fsBlobAdapter(): FsAdapter {
	const adapter = {
		type: 'blob',
		getBucketPath(bucketName: string) {
			return joinPath(getBasePath(), 'files', bucketName);
		},
		getFilePath(file: FileObject) {
			const bucketPath = adapter.getBucketPath(file.bucketName);
			const fileId = file.id;
			const group = fileId.substring(0, 2);
			return joinPath(bucketPath, group, fileId);
		},
	};
	return adapter;
}

export function fsKeypathAdapter(): FsAdapter {
	const safePath = (p: string) => {
		return p.replace(/\.\./g, '').replace(/^\//, '');
	};
	const adapter = {
		type: 'keypath',
		getBucketPath(bucketName: string) {
			return joinPath(getBasePath(), 'files', bucketName);
		},
		getFilePath(file: FileObject) {
			const bucketPath = adapter.getBucketPath(file.bucketName);
			const safeKey = safePath(file.key);
			return joinPath(bucketPath, safeKey);
		},
	};
	return adapter;
}

export async function createBucketStorage(
	adapter: FsAdapter,
	bucketName: string,
) {
	const bucketPath = adapter.getBucketPath(bucketName);
	const str = await fs.mkdir(bucketPath, { recursive: true });
	return !!str;
}

export async function deleteFile(adapter: FsAdapter, file: FileObject) {
	const filePath = adapter.getFilePath(file);
	try {
		await fs.unlink(filePath);
		return true;
	} catch (err) {
		return false;
	}
}

async function removeDirIfEmptyRec(dirPath: string) {
	try {
		const files = await fs.readdir(dirPath);
		let filesInFolder = files.length;
		for (const file of files) {
			const fullPath = joinPath(dirPath, file);
			const stat = await fs.stat(fullPath);
			if (stat.isDirectory()) {
				await removeDirIfEmptyRec(fullPath);
				filesInFolder--;
			}
		}

		if (filesInFolder === 0) {
			await fs.rmdir(dirPath);
		}
	} catch (err) {
		return;
	}
}
export async function removeEmptySubdirs(startPath: string) {
	const files = await fs.readdir(startPath);
	for (const file of files) {
		const fullPath = joinPath(startPath, file);
		const stat = await fs.stat(fullPath);
		if (stat.isDirectory()) {
			await removeDirIfEmptyRec(fullPath);
		}
	}
}
