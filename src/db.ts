import { config } from './config';
import { PrismaClient } from './generated/prisma';

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
