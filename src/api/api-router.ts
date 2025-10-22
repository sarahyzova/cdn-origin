import { Router } from 'express';
import { createBucket } from 'src/bucket/bucket';
import { RequestWithBucket } from 'src/types/req';

// TODO: Make API routes secured by authentication

const apiRouter = Router();
apiRouter.use((req: RequestWithBucket, res, next) => {
	if (!req.bucketName) {
		next();
		return;
	}
	next('router');
});

apiRouter.get('/', (req: RequestWithBucket, res) => {
	res.send('Welcome to the API root');
});

export { apiRouter };
