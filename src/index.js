import minimist from 'minimist';
import chalk from 'chalk';
import PostmanToMdConverter from './util/index.js';
import moduleInfo from '../package.json' assert {type: "json"};

/**
 * Init execution
 */
export default function init() {
  const args = minimist(process.argv.slice(2));
  const path = args[`_`];
  delete args[`_`];

  let startAt, outputFolder, noToc, noPathParam, htmlReady;

  //Iterate over the options
  for (const optKey in args) {
    switch(optKey) {
      case `help`:
      case `h`:
        console.log(getHelp());
        process.exit(0);

      case `version`:
      case `v`:
        console.log(`
          postman-to-md v${moduleInfo.version}
        `);
        process.exit(0);

      case `output-dir`:
      case `D`:
        if(args[optKey]?.length < 0){
          console.error(chalk.red(`Invalid output-dir value. It should be a valid path.\n${getHelp()}`));
          process.exit(1);
        }
        outputFolder = args[optKey];
      break;

      case `no-toc`:
      case `T`:
        noToc = !!(parseInt(args[optKey]) || args[optKey] === "true");
      break;

      case `no-path-param`:
      case `P`:
        noPathParam = !!(parseInt(args[optKey]) || args[optKey] === "true");
      break;


      case `start-at`:
      case `S`:
        startAt = parseInt(args[optKey]);

        //Entering : not an integer
        if(isNaN(startAt)){
          console.log(chalk.red(`Invalid start-at value. It should be a number.\n${getHelp()}`));
          process.exit(1);
        }

        //Entering : negative or zero value
        if(startAt < 1){
          console.log(chalk.red(`Invalid start-at value. It should be a positive number.\n${getHelp()}`));
          process.exit(1);
        }
      break;

      case(`html-ready`):
      case(`H`):
        htmlReady = !!(parseInt(args[optKey]) || args[optKey] === "true");
      break;

      default:
        console.log(chalk.red(`Unknown option: ${optKey}\n${getHelp()}`));
        process.exit(1);
    }
  }

  if (path.length <= 0) {
    console.log(chalk.red(`Path of json file is required.\n${getHelp()}`));
    process.exit(1);
  }
  
  //Iterate over the files passed as arguments
  for (let i = 0; i < path.length; i++) {
    new PostmanToMdConverter(path[i], startAt, outputFolder, noToc, noPathParam, htmlReady).convertAndSaveToMarkdown();
  }
}


/**
 * Method that return the help message.
 * @returns {string} The help message.
 */
function getHelp(){
  return `
  Usage:
     postman-to-md [--version] [--help] [options] [path]

  Options:
  --help, -h            Show this help message

  --version, -v         Show version

  --output-dir, -D      Output directory path. Default is "./docs", relative to the folder 
                        where the input file is located.
                        Note : If the output directory does not exist, it will be created.

  --no-toc, -T          Disable generation of tables of contents files. Default is false.

  --no-path-param, -P   Do not generate path parameters folders. Default is false.
                        ie. documentation of endpoints in api/v1/users/{id}/comments/ will 
                        be generated in folder api/v1/users/comments/.

  --html-ready, -H      Generate HTML ready documentation (URI are encoded). Default is false.

  --start-at, -S        Start the documentation at a specific depth. Default is 1.
                        Note: Host addresss is not included in the depth.
                       
                        ie. with --start-at=4 and an api such as :
                        api/v1/                                => no documentation or TOC
                        ├─── comments/                         => no documentation or TOC
                        │    ├─── GET all                      => documentation + TOC
                        │    └─── {id}/                        => documentation + TOC
                        │         └─── GET by id               => documentation
                        ├─── ...
                        └─── users/                            => no documentation or TOC
                             ├─── GET all/                     => documentation + TOC
                             └─── {id}/                        => documentation + TOC
                                  ├─── GET by id               => documentation
                                  ├─── ...
                                  └─── comments                => documentation + TOC
                                       └─── GET user comments  => documentation
  `;
}