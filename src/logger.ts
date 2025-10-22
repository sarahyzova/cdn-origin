import chalk from 'chalk';

export const logger = {
	info: (...args: any[]) => console.log(chalk.blueBright('[INFO]'), ...args),
	warn: (...args: any[]) =>
		console.log(chalk.yellowBright('[WARN]'), ...args),
	error: (...args: any[]) => console.log(chalk.redBright('[ERROR]'), ...args),
};
