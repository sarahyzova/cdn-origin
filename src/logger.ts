import chalk from 'chalk';

export const logger = {
	info: (...args: any[]) => console.log(chalk.blueBright('[INFO]'), ...args),
	error: (...args: any[]) => console.log(chalk.redBright('[ERROR]'), ...args),
};
