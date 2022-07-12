import fs from 'fs'
import chalk from 'chalk'
import writeFile from './FileDirUtil.js';


/**
 * Class of PostmanToMdConverter
 */
export default class PostmanToMdConverter {


    constructor(postmanFilePath, documentationStartAtDepth = 1, outputFolder = undefined, noToc = false, noPathParam = false) {
        this.postmanFilePath = postmanFilePath;
        this.projectInfoMarkdown = "";
        this.projectName = "";
        this.documentationStartAtDepth = 1;
        this.noToc = typeof noToc === 'boolean' && noToc;
        this.noPathParam = typeof noPathParam === 'boolean' && noPathParam;

        if(documentationStartAtDepth && documentationStartAtDepth > 0){
            this.documentationStartAtDepth = documentationStartAtDepth;
        }

        this.docJson = undefined;

        // Get the folder separated from the file name
        var folderWithFileSeparated = /^(.*\/)([^\/]+\/?)$/.exec(postmanFilePath);

        this.initialFolder = folderWithFileSeparated[1]

        if(outputFolder){
            this.outputFolder = outputFolder;
            if(outputFolder.charAt(outputFolder.length-1) != "/") this.outputFolder += "/";
            return;
        }

        // If the output folder is not defined, use the folder "./docs" relative to the Postman Collection file
        this.outputFolder = `${this.initialFolder}docs/` + folderWithFileSeparated[2].replace(/(\.postman_collection)?\.json/, '').replaceAll(' ', '_') + "/";
    }

    /**
     * Create structure of markdown documentation and save it to files
     */
    convertAndSaveToMarkdown() {
        console.log(chalk.green(`Reading file ${this.postmanFilePath}`))

        if (!fs.existsSync(this.postmanFilePath)) {
            console.log(chalk.red(`Path is not valid or the file not exist.`));
            return;
        }

        console.log(chalk.green(`Generating markdown file ...`));

        let rawData = fs.readFileSync(this.postmanFilePath);
        this.docJson = JSON.parse(rawData);

        let temp = JSON.stringify(this.docJson);

        // Replace all global variables in the Postman collection file
        for (let i = 0; i < this.docJson.variable.length; ++i) {
            let variable = this.docJson.variable[i];
            temp = temp.replaceAll(`\{\{${variable.key}\}\}`, `${variable.value}`);
        }

        this.docJson = JSON.parse(temp);
        this.projectName = this.docJson.info.name;

        
        this.projectInfoMarkdown += `# Project: ${this.projectName} (v${this.docJson?.info?.version})\n\n`;

        if(this.docJson?.info?.description !== undefined && this.docJson?.info?.description != ""){
            this.projectInfoMarkdown += `**Project description**<br/>\n ${this.docJson?.info?.description}\n___\n\n<br/>\n\n`;
        }

        this.readItems(this.docJson.item);
    }

    /**
     * Read auth of each method
     * @param {object} auth 
     */
    readAuthorization(auth) {
        let markdown = ''
        if (auth) {
            markdown += `### 🔑 Authentication ${auth.type}\n\n`
            markdown += `|Param|value|Type|\n`
            markdown += `|---|---|---|\n`
            if (auth.bearer) {
                auth.bearer.map(auth => {
                    markdown += `|${auth.key}|${auth.value}|${auth.type}|\n`
                })
            }
            markdown += `\n\n<br/>\n\n`
        }

        return markdown
    }

    /**
     * Read request of each method
     * @param {object} request information
     * @return {string} info of data about request options
     */
    readRequestOptions(request) {
        let markdown = ''
        if (request) {

            markdown += `### Headers\n`;
            markdown += `\n`;
            markdown += `|Content-Type|Value|\n`;
            markdown += `|---|---|\n`;

            request.header.map(header => {
                markdown += `|${header.key}|${header.value}|\n`;
            })

            markdown += `\n\n<br/>\n\n`;
        }
        return markdown;
    }


    /**
     * Read query parameters in an url.
     * @param {string} url url with query parameters
     * @returns {string} The markdown corresponding to the table of query parameters
     */
    readQueryParams(url) {
        let markdown = ''
        if (url?.query) {
            markdown += `### Query Params\n\n`;
            markdown += `|Param|value|\n`;
            markdown += `|---|---|\n`;

            url.query.map(query => {;
                markdown += `|${query.key}|${query.value}|\n`;
            });
            
            markdown += `\n\n<br/>\n\n`;
        }

        return markdown;
    }

    /**
     * Read objects of each method
     * @param {object} body 
     */
    readFormDataBody(body) {
        let markdown = ''

        if (body) {
            if (body.mode === 'raw') {
                markdown += `### Body (**${body.mode}**)\n`;
                markdown += `\n`;
                markdown += `\`\`\`json\n`;
                markdown += `${body.raw}\n`;
                markdown += `\`\`\`\n\n<br/>\n\n`;
            }

            if (body.mode === 'formdata') {
                markdown += `### Body ${body.mode}\n`;
                markdown += `\n`;
                markdown += `|Param|value|Type|\n`;
                markdown += `|---|---|---|\n`;
                body.formdata.map(form => {;
                    markdown += `|${form.key}|${form.type === 'file' ? form.src : form.value !== undefined ? form.value.replace(/\\n/g,'') : '' }|${form.type}|\n`;
                });
                markdown += `\n\n<br/>\n\n`;
            }
        }

        return markdown;
    }

    /**
     * Read methods of response
     * @param {array} responses 
     */
    readResponse(responses) {
        let markdown = '';
        markdown += `### Examples\n\n<br/>\n\n`;

        // Iterate over all responses
        for (let i = 0; i < responses.length; i++) {
            let response = responses[i];
            let originalRequest = response.originalRequest;
            markdown += `<details><summary>Example ${i+1} • ${response.name}</summary>\n`;
            markdown += `\n`;
            markdown += "Request :\n";
            markdown += `\`\`\`sh\n`;

            let url = originalRequest.url.raw;

            // Replace query parameters in the url by there values
            for (let j = 0; originalRequest?.url?.variable && j < originalRequest.url.variable.length; j++) {
                let variable = originalRequest.url.variable[j];
                url = url.replaceAll(`:${variable.key}`, `${variable.value}`);
            }

            markdown += `curl --location --request ${originalRequest.method} '${url}'`
            if (originalRequest.header) markdown += "\\\n";

            // Add headers in the curl request example
            for (let j = 0; originalRequest?.header && j < originalRequest.header.length; j++) {
                let header = originalRequest.header[j];
                markdown += `--header '${header.key}: ${header.value}' \\\n`;
            }
            
            if (originalRequest.body) markdown += `--data-raw '${originalRequest.body.raw}'\n`;
            
            markdown += `\`\`\`\n`;


            markdown += `Response `
            
            // Add response of curl command
            if(response.code || response.status){
                markdown += "(";
                if(response.code) markdown += `${response.code}`;
                if(response.code && response.status) markdown += " ";
                if(response.status) markdown += `${response.status}`;
                markdown += ") ";
            }

            markdown += `:\n`;
            markdown += `\`\`\`json\n`;
            markdown += `${response.body}\n`;
            markdown += `\`\`\`\n`;
            markdown += `\n</details>\n\n`;
        }

        return markdown;
    }

    /**
     * Read methods of each item
     * @param {object} post 
     */
    readMethods(method) {
        let markdown = ''

        markdown += this.projectInfoMarkdown;
        markdown += `## End-point: ${method.name}\n\n<br/>\n\n`;

        if(method?.request?.description !== undefined && method?.request?.description != ""){
            markdown +=  `### Description:\n\n${method?.request?.description}\n\n<br/>\n\n`;
        }
        
        // Read request of each method
        if(method?.request?.method){

            method.request.method = method.request.method.toUpperCase();
            let methodBadgeUri = `https://img.shields.io/badge/-${method?.request?.method}-`;

            // Handle badge color depending on the method used in the request
            switch (method.request.method) {
                case 'GET':
                    methodBadgeUri += 'green';
                    break;

                case 'POST':
                    methodBadgeUri += 'yellow';
                    break;

                case 'PUT':
                    methodBadgeUri += 'blue';
                    break;

                case 'DELETE':
                    methodBadgeUri += 'red';
                    break;

                default:
                    methodBadgeUri += 'gray';
                    break;
            }
            
            methodBadgeUri += "?style=for-the-badge";

            markdown += `>\n`;
            markdown += `><pre><a href=""><img align="center" src="${methodBadgeUri}" title="Method to use : ${method.request.method}"></a>   <code>${method?.request?.url?.raw}</code></pre>\n`;
            markdown += `>\n`;

        } else {
            markdown += `>\`\`\`\n`;
            markdown += `>${method?.request?.url?.raw}\n`;
            markdown += `>\`\`\``;
        }

        markdown += `\n\n<br/>\n\n`;
        markdown += this.readRequestOptions(method?.request);
        markdown += this.readFormDataBody(method?.request?.body);
        markdown += this.readQueryParams(method?.request?.url);
        markdown += this.readAuthorization(method?.request?.auth);
        markdown += this.readResponse(method?.response);
        markdown += `\n`;
        //markdown += `\n<br/>\n\n⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃\n\n<br/>\n`;

        return markdown;
    }

    /**
     * Read items of json postman
     * @param {Array} items The items to process
     * @param {string} folderPath The name of the folder
     * @param {number} folderDeep The depth of the folder
     */
    readItems(items, parent = undefined, folderPath = "", folderDeep = 0) {
        let markdownSubItems = '';
        let markdownMethods = '';
        let currentItem = 0;

        items.sort((itemA, itemB) => itemA.name.localeCompare(itemB.name)).forEach(item => {
            let nextFolderDeep = folderDeep + 1;
            let itemNameFolderReady = item.name;
            let noPathParamName;

            //Entering : the user don't wants path parameters
            if(this.noPathParam){
                noPathParamName = itemNameFolderReady.replaceAll(/\{\w*\}\/?/g, '').replace(/\/$/g, '');
                itemNameFolderReady = noPathParamName;
            }
            
            itemNameFolderReady = itemNameFolderReady.replaceAll(' ', '_').replace(/\/$/g, '').toLowerCase();
            


            // Entering : the item contains an other item 
            //      => process the child item
            if (item.item) {
                let nextFolderPath = folderPath;
                let nextParent = item;

                // If there is no parent, the path is the current item name
                if(parent === undefined){
                    item.urlPath = (this.noPathParam ? noPathParamName : item.name) + "/";
                } else {
                    item.urlPath = parent.urlPath + (this.noPathParam ? noPathParamName : item.name) + "/";
                }

                
                //Entering : the user don't wants path parameters and the current item is a path parameter
                if(this.noPathParam && itemNameFolderReady === ""){
                    --nextFolderDeep;
                    nextParent = parent;
                } else {

                    nextFolderPath = folderPath + itemNameFolderReady + '/';
                    markdownSubItems += `${++currentItem > 1 ? "<br/><br/>" : ""}\n`
                    markdownSubItems += `${folderDeep - this.documentationStartAtDepth < 0 ? '' : '\t'.repeat(folderDeep - this.documentationStartAtDepth)}`
                    markdownSubItems += `- [Documentation of : ${item.name}](./${nextFolderPath}TOC.md)`;
                }

                markdownSubItems += this.readItems(item.item, nextParent, nextFolderPath, nextFolderDeep);

            } else {

                if(folderDeep >= this.documentationStartAtDepth){
                    // Process the method
                    let currentMethodMarkdown = this.readMethods(item);
                    markdownMethods += `\n${folderDeep - this.documentationStartAtDepth < 0 ? '' : '\t'.repeat(folderDeep - this.documentationStartAtDepth)}- [${item.name.substring(0, 1).toUpperCase() + item.name.substring(1).replaceAll( '_', ' ')}](./${folderPath + itemNameFolderReady}.md)`;
                    
                    if(folderDeep >= this.documentationStartAtDepth){
                        writeFile(currentMethodMarkdown, this.outputFolder + folderPath + item.name + ".md");
                    }
                }
            }
        });

        // Entering : the item should not be documented
        //      => return nothing and don't create Ttable of content
        if(folderDeep < this.documentationStartAtDepth || this.noToc) return "";

        let markdown = markdownMethods + markdownSubItems;

        // Regex to get the right indent in the TOC
        let regex = new RegExp(`(\\t){${folderDeep-1}}- \\[`, "g");

        let tableOfContentsMarkdown = this.projectInfoMarkdown;
        
        if(parent){
            tableOfContentsMarkdown += `## ${parent.urlPath}\n`

            if(parent?.description !== undefined && parent?.description != ""){
                tableOfContentsMarkdown +=  `### Description:\n\n${parent?.description}\n\n<br/>\n\n`;
            }

            tableOfContentsMarkdown += `#`
        }

        tableOfContentsMarkdown += `## Table of contents\n\n`;
        tableOfContentsMarkdown += markdown.replaceAll(regex, '- [').replaceAll("./" + folderPath, '');

        // Write the table of contents
        writeFile(tableOfContentsMarkdown,  this.outputFolder + folderPath + "TOC.md");
        

        return markdown;
    }
}