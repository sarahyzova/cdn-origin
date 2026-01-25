import { Bucket, FileObject } from '../generated/prisma/index.js';

export type Resources = {
	instance: {
		type: undefined;
		actions: 'listBuckets';
	};
	bucket: {
		type: Bucket;
		actions: 'get' | 'create' | 'update' | 'delete';
	};
	directory: {
		type: {
			bucketId: string;
			path: string;
		};
		actions: 'list';
	};
	object: {
		type: FileObject;
		actions: 'get' | 'delete' | 'create' | 'update' | 'getMetadata';
	};
};
