import { Request } from 'express';

export type RequestWithBucket = Request & {
	bucketName?: string;
	user?: 'anonymous' | 'root';
};
