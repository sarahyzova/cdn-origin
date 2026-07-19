import Express from 'express';
import { bucketMiddleware } from './middleware/bucket.js';
import { config } from './config.js';
import { apiRouter } from './api/api-router.js';
import { bucketRouter } from './bucket/bucket-router.js';
import { deleteExpiredObjects } from './bucket/bucket.js';
import { authorizeMiddleware } from './middleware/authorize.js';
import { logger } from './logger.js';
import cors from 'cors';
import chalk from 'chalk';

const EXPIRED_OBJECT_CLEANUP_INTERVAL_MS = 60_000;

const app = Express();

app.set('trust proxy', true);
app.disable('x-powered-by');

app.use(cors());
app.use(Express.static('public'));

app.use(authorizeMiddleware);
app.use(bucketMiddleware);

app.use(apiRouter);
app.use(bucketRouter);

app.listen(config.PORT, () => {
	logger.info(
		`Server running on port ${chalk.greenBright.bold.underline(
			config.PORT,
		)} on domain ${chalk.greenBright.bold.underline(config.DOMAIN_SUFFIX)}`,
	);
});

deleteExpiredObjects().catch((err) =>
	logger.error('Failed to clean up expired objects', err),
);
setInterval(() => {
	deleteExpiredObjects().catch((err) =>
		logger.error('Failed to clean up expired objects', err),
	);
}, EXPIRED_OBJECT_CLEANUP_INTERVAL_MS);
