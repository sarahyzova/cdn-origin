import { Actor } from './actor.js';
import { Resources } from './resources.js';

type ActorTypes = Actor['type'];
type ResourceType = keyof Resources;

type ActorMap = {
	[root in ActorTypes]: Extract<Actor, { type: root }>;
};

type PermissionCheckFn<T_Actor, T_Subject> = (
	actor: T_Actor,
	subject: T_Subject,
) => boolean;
type PermissionCheck<T_Actor, T_Subject> =
	| PermissionCheckFn<T_Actor, T_Subject>
	| boolean;

type ResourceDefinitions<T_Actor, T_Subject extends Resources[ResourceType]> = {
	[A in T_Subject['actions']]: PermissionCheck<T_Actor, T_Subject['type']>;
};

export type PermissionDefinitions = {
	[A in ActorTypes]: {
		[R in ResourceType]: ResourceDefinitions<ActorMap[A], Resources[R]>;
	};
};
