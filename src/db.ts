import { config } from './config.js';
import { PrismaClient } from './generated/prisma/index.js';

export const db = new PrismaClient().$extends({
	result: {
		fileObject: {
			url: {
				needs: { key: true, bucketName: true },
				compute({ key, bucketName }) {
					return `${bucketName}.${config.DOMAIN_SUFFIX}/${key}`;
				},
			},
		},
	},
});
