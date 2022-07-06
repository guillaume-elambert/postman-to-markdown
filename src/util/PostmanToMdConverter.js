import fs from 'fs'
import chalk from 'chalk'
import writeFile from './FileDirUtil.js';

export default class PostmanToMdConverter {

    constructor(postmanFilePath) {
        this.postmanFilePath = postmanFilePath;
        this.initialFolder = postmanFilePath.replace(/\/[^\/]+\/?$/, '') + '/' + "docs/";
        this.markdown = "";
    }


    convert() {
        console.log(chalk.green(`Reading file ${this.postmanFilePath}`))

        if (fs.existsSync(this.postmanFilePath)) {
            console.log(chalk.green(`Generating markdown file ...`));

            let rawData = fs.readFileSync(this.postmanFilePath);
            this.docJson = JSON.parse(rawData);

            let temp = JSON.stringify(this.docJson);

            for (let i = 0; i < this.docJson.variable.length; ++i) {
                let variable = this.docJson.variable[i];
                temp = temp.replaceAll(`\{\{${variable.key}\}\}`, `${variable.value}`)
            }

            this.docJson = JSON.parse(temp);

            this.createStructureOfMarkdown();

        } else {
            console.log(chalk.red(`Path is not valid or the file not exist.`));
        }
    }


    /**
     * Create structure of markdown documentation
     */
    createStructureOfMarkdown() {
        this.markdown += `# Project: ${this.docJson.info.name}\n`
        this.markdown += this.docJson.info.description !== undefined ? `${this.docJson.info.description || ''}\n` : ``

        this.readItems(this.docJson.item, this.initialFolder)
    }

    /**
     * Read auth of each method
     * @param {object} auth 
     */
    readAuthorization(auth) {
        let markdown = ''
        if (auth) {
            markdown += `### 🔑 Authentication ${auth.type}\n`
            markdown += `\n`
            markdown += `|Param|value|Type|\n`
            markdown += `|---|---|---|\n`
            if (auth.bearer) {
                auth.bearer.map(auth => {
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
    readRequestOptions(request) {
        let markdown = ''
        if (request) {
            request.header.map(header => {
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

    readQueryParams(url) {
        let markdown = ''
        if (url?.query) {
            markdown += `### Query Params\n`
            markdown += `\n`
            markdown += `|Param|value|\n`
            markdown += `|---|---|\n`
            url.query.map(query => {
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
    readFormDataBody(body) {
        let markdown = ''

        if (body) {
            if (body.mode === 'raw') {
                markdown += `### Body (**${body.mode}**)\n`
                markdown += `\n`
                markdown += `\`\`\`json\n`
                markdown += `${body.raw}\n`
                markdown += `\`\`\`\n`
                markdown += `\n`
            }

            if (body.mode === 'formdata') {
                markdown += `### Body ${body.mode}\n`
                markdown += `\n`
                markdown += `|Param|value|Type|\n`
                markdown += `|---|---|---|\n`
                body.formdata.map(form => {
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
    readResponse(responses) {
        let markdown = ''
        markdown += `<br/>\n\n### Examples\n\n<br/>\n\n`

        for (let i = 0; i < responses.length; i++) {
            let response = responses[i];
            let originalRequest = response.originalRequest;
            markdown += `<details><summary>Example ${i+1} • ${response.name}</summary>\n`
            markdown += `\n`
            markdown += "Request :\n"
            markdown += `\`\`\`sh\n`

            let url = originalRequest.url.raw;

            for (let j = 0; originalRequest.url.variable && j < originalRequest.url.variable.length; j++) {
                let variable = originalRequest.url.variable[j];
                url = url.replaceAll(`:${variable.key}`, `${variable.value}`)
            }

            //for(let j = 0; originalRequest.url.request && j < originalRequest.url.request.length; j++){
            //    let requestVariable = originalRequest.url.variable[j];
            //    url = url.replaceAll(`${requestVariable.key}=`, `${requestVariable.value}`)
            //}

            markdown += `curl --location --request ${originalRequest.method} '${url}'`
            if (originalRequest.header) markdown += "\\\n";

            for (let j = 0; j < originalRequest.header.length; j++) {
                let header = originalRequest.header[j]
                markdown += `--header '${header.key}: ${header.value}' \\\n`
            }
            if (originalRequest.body) markdown += `--data-raw '${originalRequest.body.raw}'\n`
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
    readMethods(method) {
        let markdown = ''

        markdown += `\n`
        markdown += `## End-point: ${method.name}\n`
        markdown += method?.request?.description !== undefined ? `${method?.request?.description || ''}\n` : ``
        markdown += `### Method: ${method?.request?.method}\n`
        markdown += `>\`\`\`\n`
        markdown += `>${method?.request?.url?.raw}\n`
        markdown += `>\`\`\`\n`
        markdown += this.readRequestOptions(method?.request)
        markdown += this.readFormDataBody(method?.request?.body)
        markdown += this.readQueryParams(method?.request?.url)
        markdown += this.readAuthorization(method?.request?.auth)
        markdown += this.readResponse(method?.response)
        markdown += `\n`
        markdown += `\n<br/>\n\n⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃\n\n<br/>\n`

        return markdown
    }

    /**
     * Read items of json postman
     * @param {Array} items
     */
    readItems(items, folderName) {
        items.forEach(item => {
            if (item.item) {
                this.readItems(item.item, folderName + item.name + '/', )
            } else {
                let temp = this.readMethods(item)
                writeFile(temp, folderName + item.name)
            }
        })
    }
}