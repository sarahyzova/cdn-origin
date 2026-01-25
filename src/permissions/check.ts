import { Actor } from './actor.js';
import { permissions } from './definitions.js';
import { Resources } from './resources.js';

type PermissionCheckContext = {
	actor: Actor;
	bucketId: string;
	fileKey: string;
	action: 'read' | 'write';
};

export function checkPermissions<T_Resource extends keyof Resources>(
	actor: Actor = { type: 'anonymous' },
	resourceType: T_Resource,
	action: Resources[T_Resource]['actions'],
	data: Resources[T_Resource]['type'],
): boolean {
	const actorPerms = permissions[actor.type];
	const resourcePerms = actorPerms[resourceType];
	const check = resourcePerms[action as keyof typeof resourcePerms];

	if (typeof check === 'boolean') {
		return check;
	} else if (typeof check === 'function') {
		return check(actor as any, data as any);
	}
	return false;
}
