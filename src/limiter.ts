import pLimit from 'p-limit';

export const bucketCriticalLimiter = pLimit(1);
