import Express from 'express';
import { bucketMiddleware } from './middleware/bucket.js';
import { config } from './config.js';
import { apiRouter } from './api/api-router.js';
import { bucketRouter } from './bucket/bucket-router.js';
import { deleteExpiredObjects } from './bucket/bucket.js';
import { authorizeMiddleware } from './middleware/authorize.js';
import { originProtectionMiddleware } from './middleware/origin-protection.js';
import { errorHandlerMiddleware } from './middleware/error-handler.js';
import { logger } from './logger.js';
import chalk from 'chalk';
import { db } from './db.js';
import { RequestWithBucket } from './types/req.js';

const EXPIRED_OBJECT_CLEANUP_INTERVAL_MS = 60_000;

const app = Express();

app.set('trust proxy', config.TRUST_PROXY);
app.disable('x-powered-by');

// Mounted before origin protection: liveness/readiness probes hit the container directly,
// not through Cloudflare, and this endpoint exposes nothing sensitive.
app.get('/healthz', async (req, res) => {
	try {
		await db.$queryRaw`SELECT 1`;
		res.status(200).json({ status: 'ok' });
	} catch (err) {
		logger.error('Health check failed', err);
		res.status(503).json({ status: 'error' });
	}
});

app.use(originProtectionMiddleware);

app.use(Express.static('public'));

app.use(authorizeMiddleware);
app.use(bucketMiddleware);

// The bare CDN domain (no bucket subdomain) has no content of its own; optionally send
// visitors somewhere useful instead of a 404. Bucket subdomains keep using their own
// indexKey-based root page, handled later in bucketRouter.
app.get('/', (req: RequestWithBucket, res, next) => {
	if (req.bucketName || !config.MAIN_PAGE_REDIRECT_URL) {
		next();
		return;
	}
	res.redirect(302, config.MAIN_PAGE_REDIRECT_URL);
});

app.use(apiRouter);
app.use(bucketRouter);

app.use(errorHandlerMiddleware);

if (!config.JWT_SECRET) {
	logger.warn(
		'JWT_SECRET is not set: root/admin API access is disabled (signed URLs still work via an auto-generated key). Set JWT_SECRET to enable root access.',
	);
}
if (!config.ORIGIN_SHARED_SECRET) {
	logger.warn(
		'ORIGIN_SHARED_SECRET is not set: this origin accepts requests that bypass Cloudflare. Set it and configure a matching Cloudflare Transform Rule before going to production.',
	);
}

const server = app.listen(config.PORT, () => {
	logger.info(
		`Server running on port ${chalk.greenBright.bold.underline(
			config.PORT,
		)} on domain ${chalk.greenBright.bold.underline(config.DOMAIN_SUFFIX)}`,
	);
});

deleteExpiredObjects().catch((err) =>
	logger.error('Failed to clean up expired objects', err),
);
const cleanupInterval = setInterval(() => {
	deleteExpiredObjects().catch((err) =>
		logger.error('Failed to clean up expired objects', err),
	);
}, EXPIRED_OBJECT_CLEANUP_INTERVAL_MS);

let shuttingDown = false;
function shutdown(signal: string) {
	if (shuttingDown) return;
	shuttingDown = true;

	logger.info(`Received ${signal}, shutting down gracefully...`);
	clearInterval(cleanupInterval);

	server.close(async (err) => {
		if (err) logger.error('Error while closing HTTP server', err);
		await db.$disconnect();
		process.exit(err ? 1 : 0);
	});

	setTimeout(() => {
		logger.warn('Forcing shutdown after timeout');
		process.exit(1);
	}, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
