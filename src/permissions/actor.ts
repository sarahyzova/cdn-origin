type RootActor = {
	type: 'root';
};

type BucketActor = {
	type: 'bucket';
	bucketId: string;
};

type SignatureActor = {
	type: 'signature';
	bucketId: string;
	fileKey: string;
	action: 'read' | 'write';
};

type AnonymousActor = {
	type: 'anonymous';
};

export type Actor = RootActor | BucketActor | SignatureActor | AnonymousActor;
