import dotenv from 'dotenv';
dotenv.config();

function parseTrustProxy(value: string | undefined): boolean | number {
	if (!value) return 1;
	if (value === 'true') return true;
	if (value === 'false') return false;
	const parsed = parseInt(value, 10);
	return isNaN(parsed) ? 1 : parsed;
}

export const config = {
	NODE_ENV: process.env.NODE_ENV || 'development',
	DATA_PATH: process.env.DATA_PATH || './tmp',
	DOMAIN_SUFFIX: process.env.DOMAIN_SUFFIX || 'localhost',
	HTTPS: process.env.HTTPS === 'true',
	PORT: parseInt(process.env.PORT || '3000', 10) || 3000,
	JWT_SECRET: process.env.JWT_SECRET || null,
	// Shared secret Cloudflare (via a Transform Rule) must send on every request so the
	// origin can reject traffic that bypasses it. Leave unset to disable the check (e.g. local dev).
	ORIGIN_SHARED_SECRET: process.env.ORIGIN_SHARED_SECRET || null,
	// How many hops in front of this server to trust for X-Forwarded-* (Cloudflare -> app is usually 1).
	TRUST_PROXY: parseTrustProxy(process.env.TRUST_PROXY),
	PUBLIC_CACHE_MAX_AGE_SECONDS: parseInt(
		process.env.PUBLIC_CACHE_MAX_AGE_SECONDS || '300',
		10,
	),
	MAX_UPLOAD_SIZE_BYTES: process.env.MAX_UPLOAD_SIZE_BYTES
		? parseInt(process.env.MAX_UPLOAD_SIZE_BYTES, 10)
		: null,
	CLOUDFLARE_ZONE_ID: process.env.CLOUDFLARE_ZONE_ID || null,
	CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || null,
	// Where to send visitors who hit the bare CDN domain (no bucket subdomain) at "/".
	// Leave unset to keep returning a plain 404 there.
	MAIN_PAGE_REDIRECT_URL: process.env.MAIN_PAGE_REDIRECT_URL || null,
};
