export function parseParamWildcard(wildcardData: undefined): undefined;
export function parseParamWildcard(wildcardData: string | string[]): string;
export function parseParamWildcard(
	wildcardData: undefined | string | string[],
): string | undefined {
	if (wildcardData === undefined) return undefined;

	return Array.isArray(wildcardData) ? wildcardData.join('/') : wildcardData;
}
