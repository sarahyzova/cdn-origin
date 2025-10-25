import { config } from '../config.js';

export function getFileUrl(bucketName: string, key: string) {
	return `${getBucketBaseUrl(bucketName)}/${key}`;
}

export function getBucketBaseUrl(bucketName: string) {
	const protocol = `http${config.HTTPS ? 's' : ''}://`;
	return `${protocol}${bucketName}.${config.DOMAIN_SUFFIX}`;
}
