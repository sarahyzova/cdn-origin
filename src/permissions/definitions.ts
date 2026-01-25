import { PermissionDefinitions } from './definition-types.js';

export const permissions = {
	root: {
		instance: {
			listBuckets: true,
		},
		bucket: {
			get: true,
			create: true,
			update: true,
			delete: true,
		},
		directory: {
			list: true,
		},
		object: {
			get: true,
			delete: true,
			create: true,
			update: true,
			getMetadata: true,
		},
	},
	bucket: {
		instance: {
			listBuckets: false,
		},
		bucket: {
			get: (actor, bucket) => actor.bucketId === bucket.name,
			create: (actor, bucket) => actor.bucketId === bucket.name,
			update: (actor, bucket) => actor.bucketId === bucket.name,
			delete: (actor, bucket) => actor.bucketId === bucket.name,
		},
		directory: {
			list: (actor, directory) => actor.bucketId === directory.bucketId,
		},
		object: {
			get: (actor, file) => actor.bucketId === file.bucketName,
			delete: (actor, file) => actor.bucketId === file.bucketName,
			create: (actor, file) => actor.bucketId === file.bucketName,
			update: (actor, file) => actor.bucketId === file.bucketName,
			getMetadata: (actor, file) => actor.bucketId === file.bucketName,
		},
	},
	signature: {
		instance: {
			listBuckets: false,
		},
		bucket: {
			create: false,
			update: false,
			delete: false,
			get: false,
		},
		directory: {
			list: (actor, directory) =>
				actor.bucketId === directory.bucketId &&
				actor.fileKey === directory.path,
		},
		object: {
			get: (actor, file) =>
				actor.bucketId === file.bucketName &&
				actor.fileKey === file.key,
			delete: (actor, file) =>
				actor.bucketId === file.bucketName &&
				actor.fileKey === file.key &&
				actor.action === 'write',
			create: (actor, file) =>
				actor.bucketId === file.bucketName &&
				actor.fileKey === file.key &&
				actor.action === 'write',
			update: (actor, file) =>
				actor.bucketId === file.bucketName &&
				actor.fileKey === file.key &&
				actor.action === 'write',
			getMetadata: (actor, file) =>
				actor.bucketId === file.bucketName &&
				actor.fileKey === file.key,
		},
	},
	anonymous: {
		instance: {
			listBuckets: false,
		},
		bucket: {
			get: false,
			create: false,
			update: false,
			delete: false,
		},
		directory: {
			list: false,
		},
		object: {
			get: (actor, file) => file.public,
			delete: false,
			create: false,
			update: false,
			getMetadata: (actor, file) => file.public,
		},
	},
} satisfies PermissionDefinitions;
