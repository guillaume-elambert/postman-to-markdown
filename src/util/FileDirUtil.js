import fs from 'fs';
import chalk from 'chalk';

/**
 * Create file
 * @param {string} content 
 */
export default function writeFile(content, fileName) {
    fileName = fileName.replaceAll(' ', '_')
    let folder = fileName.replace(/\/[^\/]+\/?$/, '');

    writeDirectory(folder);

    fs.writeFile(`${fileName}.md`, content, (err) => {
        if (err) throw err;
        console.log(chalk.green(`Documentation was created correctly ${fileName}.md`))
    });
}

/**
 * Create a directory recursively
 * @param {string} dirpath 
 */
export function writeDirectory(dirpath) {
    fs.mkdirSync(dirpath, {
        recursive: true
    });
}