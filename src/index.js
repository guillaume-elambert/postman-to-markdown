'use strict'

const args = require(`minimist`)(process.argv.slice(2))
const fs = require(`fs`)
const chalk = require(`chalk`)
const { createStructureOfMarkdown, writeFile } = require('./util')

/**
 * Init execution
 */
function init() {
  const path = args[`_`];
  if(path.length > 0){
    
    for(let i = 0; i < path.length; i++){

      console.log(chalk.green(`Reading file ${path[i]}`))
      
      if(fs.existsSync(path[i])) {
        console.log(chalk.green(`Generating markdown file ...`))
        
        let rawData = fs.readFileSync(path[i]);
        const json = JSON.parse(rawData)

        createStructureOfMarkdown(json,  path[i].replace(/\/[^\/]+\/?$/, '')+'/' + "docs/")
        
      } else {
        console.log(chalk.red(`Path is not valid or the file not exist.`));  
      }
    }
  }else{
    console.log(chalk.red(`Path of json file is required.`));
  }
}

module.exports = { init }
