import Express from 'express';
import { bucketMiddleware } from './middleware/bucket';
import { config } from './config';
import { apiRouter } from './api/api-router';
import { bucketRouter } from './bucket/bucket-router';
import { authorizeMiddleware } from './middleware/authorize';
import { createBucket } from './bucket/bucket';
import { fsKeypathAdapter } from './fs/file-system';

const app = Express();

app.set('trust proxy', true);
app.disable('x-powered-by');

app.use(authorizeMiddleware);
app.use(bucketMiddleware);

app.use(apiRouter);
app.use(bucketRouter);

app.listen(config.PORT, () => {
	console.log(`Server running on port ${config.PORT}`);
});
