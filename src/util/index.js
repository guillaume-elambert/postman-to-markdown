'use strict';
const fs = require('fs');
const chalk = require(`chalk`)
/**
 * Create structure of markdown documentation
 * @param {object} docJson 
 * @return {strinf} structure of markdown
 */
function createStructureOfMarkdown(docJson, initialFolder){
    let markdown = ''

    let temp = JSON.stringify(docJson);

    for(let i = 0; i < docJson.variable.length; ++i){
        let variable = docJson.variable[i];
        temp = temp.replaceAll(`\{\{${variable.key}\}\}`, `${variable.value}`)
    }

    docJson = JSON.parse(temp);

    markdown += `# Project: ${docJson.info.name}\n`
    markdown += docJson.info.description !== undefined ? `${docJson.info.description || ''}\n` :``
    
    readItems(docJson.item, markdown, initialFolder)

    return markdown
}

/**
 * Read auth of each method
 * @param {object} auth 
 */
function readAuthorization(auth){
    let markdown = ''
    if(auth){
        markdown += `### 🔑 Authentication ${auth.type}\n`
        markdown += `\n`
        markdown += `|Param|value|Type|\n`
        markdown += `|---|---|---|\n`
        if(auth.bearer){
            auth.bearer.map(auth =>{
                markdown += `|${auth.key}|${auth.value}|${auth.type}|\n`
            })
        }
        markdown += `\n`
        markdown += `\n`
    }

    return markdown
}

/**
 * Read request of each method
 * @param {object} request information
 * @return {string} info of data about request options
 */
function readRequestOptions(request){
    let markdown = ''
    if(request){
            request.header.map(header =>{
            markdown += `### Headers\n`
            markdown += `\n`
            markdown += `|Content-Type|Value|\n`
            markdown += `|---|---|\n`
            markdown += `|${header.key}|${header.value}|\n`
            markdown += `\n`
            markdown += `\n`
        })
    }
    return markdown
}

function readQueryParams(url){
    let markdown = ''
    if(url?.query){
        markdown += `### Query Params\n`
        markdown += `\n`
        markdown += `|Param|value|\n`
        markdown += `|---|---|\n`
        url.query.map(query =>{
            markdown += `|${query.key}|${query.value}|\n`
        })
        markdown += `\n`
        markdown += `\n`
    }

    return markdown
}

/**
 * Read objects of each method
 * @param {object} body 
 */
function readFormDataBody(body) {
    let markdown = ''
    
    if(body){
        if(body.mode === 'raw'){
            markdown += `### Body (**${body.mode}**)\n`
            markdown += `\n`
            markdown += `\`\`\`json\n`
            markdown += `${body.raw}\n`
            markdown += `\`\`\`\n`
            markdown += `\n`
        }

        if(body.mode === 'formdata'){
            markdown += `### Body ${body.mode}\n`
            markdown += `\n`
            markdown += `|Param|value|Type|\n`
            markdown += `|---|---|---|\n`
            body.formdata.map(form =>{
                markdown += `|${form.key}|${form.type === 'file' ? form.src : form.value !== undefined ? form.value.replace(/\\n/g,'') : '' }|${form.type}|\n`
            })
            markdown += `\n`
            markdown += `\n`
        }
    }

    return markdown 
}

/**
 * Read methods of response
 * @param {array} responses 
 */
function readResponse(responses) {
    let markdown = ''
    markdown += `<br/>\n\n### Examples\n\n<br/>\n\n`

    for ( let i = 0; i < responses.length; i++ ) {
        let response = responses[i];
        let originalRequest = response.originalRequest;
        markdown += `<details><summary>Example ${i+1} • ${response.name}</summary>\n`
        markdown += `\n`
        markdown += "Request :\n"
        markdown += `\`\`\`sh\n`

        let url = originalRequest.url.raw;
        
        for(let j = 0; originalRequest.url.variable && j < originalRequest.url.variable.length; j++){
            let variable = originalRequest.url.variable[j];
            url = url.replaceAll(`:${variable.key}`, `${variable.value}`)
        }

        //for(let j = 0; originalRequest.url.request && j < originalRequest.url.request.length; j++){
        //    let requestVariable = originalRequest.url.variable[j];
        //    url = url.replaceAll(`${requestVariable.key}=`, `${requestVariable.value}`)
        //}

        markdown += `curl --location --request ${originalRequest.method} '${url}'`
        if(originalRequest.header) markdown +=  "\\\n";

        for(let j = 0; j < originalRequest.header.length; j++){
            let header = originalRequest.header[j]
            markdown += `--header '${header.key}: ${header.value}' \\\n`
        }
        if(originalRequest.body) markdown += `--data-raw '${originalRequest.body.raw}'\n`
        markdown += `\`\`\`\n`

        markdown += `Response :\n`
        markdown += `\`\`\`json\n`
        markdown += `${response.body}\n`
        markdown += `\`\`\`\n`
        markdown += `\n</details>\n\n`
    }
    return markdown;
}

/**
 * Read methods of each item
 * @param {object} post 
 */
function readMethods(method){
    let markdown = ''
    
    markdown += `\n`
    markdown += `## End-point: ${method.name}\n`
    markdown += method?.request?.description !== undefined ? `${method?.request?.description || ''}\n` :``
    markdown += `### Method: ${method?.request?.method}\n`
    markdown += `>\`\`\`\n`
    markdown += `>${method?.request?.url?.raw}\n`
    markdown += `>\`\`\`\n`
    markdown += readRequestOptions(method?.request)
    markdown += readFormDataBody(method?.request?.body)
    markdown += readQueryParams(method?.request?.url)
    markdown += readAuthorization(method?.request?.auth)
    markdown += readResponse(method?.response)
    markdown += `\n`
    markdown += `\n<br/>\n\n⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃\n\n<br/>\n`
    
    return markdown
}

/**
 * Read items of json postman
 * @param {Array} items
 */
function readItems(items, markdown, folderName, folderDeep = 1) {
    items.forEach(item => { 
        if (item.item) {
            readItems(item.item, markdown, folderName + item.name + '/', folderDeep + 1)
        } else {
            let temp = readMethods(item)
            writeFile(temp, folderName + item.name)
            markdown += temp
        }
    })
    
    //return markdown
}

function writeDirectory(dirpath) {
    fs.mkdirSync(dirpath, { recursive: true });
}

/**
 * Create file
 * @param {string} content 
 */
function writeFile(content, fileName){
    fileName = fileName.replaceAll(' ', '_')
    let folder = fileName.replace(/\/[^\/]+\/?$/, '');

    //for(let i = 0; i < folder.length -1; i++){
        writeDirectory(folder);
    //}

    fs.writeFile(`${fileName}.md`, content, function (err) {
        if (err) throw err;
        console.log(chalk.green(`Documentation was created correctly ${fileName}.md`))
    });
}

module.exports = {
    createStructureOfMarkdown,
    writeFile
}