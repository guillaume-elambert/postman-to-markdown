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

    fs.writeFile(fileName, content, (err) => {
        if (err){
            console.error(chalk.red(`Error when writing file ${fileName}`));
            throw err;
        }
        console.log(chalk.green(`File was created correctly ${fileName}`))
    });
}

/**
 * Create a directory recursively
 * @param {string} dirpath 
 */
export function writeDirectory(dirpath) {

    if(fs.existsSync(dirpath)) return;
    
    fs.mkdirSync(dirpath, {
        recursive: true
    });
}