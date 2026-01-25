import { Request } from 'express';
import { Actor } from '../permissions/actor.js';

export type RequestWithBucket = Request & {
	bucketName?: string;
	actor?: Actor;
};
