import minimist from 'minimist';
import chalk from 'chalk';
import PostmanToMdConverter from './util/index.js';

/**
 * Init execution
 */
export default function init() {
  const args = minimist(process.argv.slice(2));
  const path = args[`_`];
  if (path.length > 0) {

    for (let i = 0; i < path.length; i++) {
      new PostmanToMdConverter(path[i]).convert();
    }
  } else {
    console.log(chalk.red(`Path of json file is required.`));
  }
}