import path from 'path';

// Normalize paths without touching the filesystem so function works with virtual
// or non-existing paths. Convert backslashes to forward slashes, normalize
// POSIX-style segments, strip trailing slashes and apply case-insensitive
// comparison on Windows.
function normalizeForCompare(p: string) {
	if (!p) return '';
	// Use forward slashes internally to be platform-agnostic
	let s = p.replace(/\\/g, '/');
	// Normalize '.' and '..' segments using posix normalize (doesn't touch fs)
	s = path.posix.normalize(s);
	// Remove trailing slash except for root '/'
	if (s !== '/') s = s.replace(/\/+$/, '');
	// On Windows do case-insensitive compare
	if (process.platform === 'win32') s = s.toLowerCase();
	return s;
}

/**
 * Check whether `filePath` is directly inside `dirPath` (not nested in subdirectories).
 * Works with non-existent paths by using pure string normalization.
 */
export function inDir(dirPath: string, filePath: string) {
	if (!dirPath || !filePath) return false;

	const dirNorm = normalizeForCompare(dirPath);
	const parent = normalizeForCompare(
		path.posix.dirname(filePath.replace(/\\/g, '/')),
	);

	return dirNorm === parent;
}
