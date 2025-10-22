import Express from 'express';
import { bucketMiddleware } from './middleware/bucket.js';
import { config } from './config.js';
import { apiRouter } from './api/api-router.js';
import { bucketRouter } from './bucket/bucket-router.js';
import { authorizeMiddleware } from './middleware/authorize.js';
import { logger } from './logger.js';
import chalk from 'chalk';

const app = Express();

app.set('trust proxy', true);
app.disable('x-powered-by');

app.use(authorizeMiddleware);
app.use(bucketMiddleware);

app.use(apiRouter);
app.use(bucketRouter);

app.listen(config.PORT, () => {
	logger.info(
		`Server running on port ${chalk.greenBright.bold.underline(
			config.PORT,
		)}`,
	);
});
