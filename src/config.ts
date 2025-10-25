import dotenv from 'dotenv';
dotenv.config();

export const config = {
	DATA_PATH: process.env.DATA_PATH || './tmp',
	DOMAIN_SUFFIX: process.env.DOMAIN_SUFFIX || 'localhost',
	HTTPS: process.env.HTTPS === 'true',
	PORT: parseInt(process.env.PORT || '3000', 10) || 3000,
	JWT_SECRET: process.env.JWT_SECRET || null,
};
