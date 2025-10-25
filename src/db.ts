import { getBucketBaseUrl, getFileUrl } from './bucket/bucket-url.js';
import { PrismaClient } from './generated/prisma/index.js';

export const db = new PrismaClient().$extends({
	result: {
		fileObject: {
			url: {
				needs: { key: true, bucketName: true },
				compute({ key, bucketName }) {
					return getFileUrl(bucketName, key);
				},
			},
		},
		bucket: {
			url: {
				needs: { name: true },
				compute({ name }) {
					return getBucketBaseUrl(name);
				},
			},
		},
	},
});
