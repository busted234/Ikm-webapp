'use server'

import { DataLakeServiceClient } from '@azure/storage-file-datalake';
import { IkmFile } from './search.models';

let _sharedClient:any = {};

const getSharedClient = async (container:string = '', forceNew = false) => {
    if (!container) {
        console.error(' Missing storage container name.');
        return false;
    }

    if (_sharedClient[container] && !forceNew) return _sharedClient[container];
    
    if (!process.env.DATALAKE_CS) {
        console.error('Missing storage connection string.');
        return false;
    }
    const datalakeServiceClient = await DataLakeServiceClient.fromConnectionString(process.env.DATALAKE_CS);
    if (!datalakeServiceClient) {
        console.error('Failed to get service client.');
        return false;
    }

    const fileSystemClient = await datalakeServiceClient.getFileSystemClient(container);
    if (!fileSystemClient) {
        console.error('Failed to get file system client.');
        return false;
    }

    _sharedClient[container] = fileSystemClient;

    return _sharedClient[container];
}

// Directory functions

const getDirectories = async (container:string) => {
    if (!container) return false;

    const sharedClient = await getSharedClient(container);
    if (!sharedClient) return false;

    try {
        const directories = [];
        const paths = sharedClient.listPaths(); // TODO: Limit to base path
        for await (const path of paths) {
            if (path.isDirectory) {
                directories.push({ name: path.name });
            }
        }
        return directories;
    } catch(e) {
        console.error('Failed to get directory list.');
        return false;
    }
}

const createDirectory = async (container:string, path:string) => {
    if (!container || !path) return false;

    const sharedClient = await getSharedClient(container);
    if (!sharedClient) return false;

    try {
        await sharedClient.getDirectoryClient(path).create();
        console.log('Directory created: ' + path);
        return true;
    } catch(e) {
        console.log('Failed to create directory: ' + path);
        return false;
    }
}

const renameDirectory = async (container:string, oldName:string, newName:string) => {
    if (!container || !oldName || !newName) return false;

    const sharedClient = await getSharedClient(container);
    if (!sharedClient) return false;

    try {
        await sharedClient.getDirectoryClient(oldName).move(newName);
        console.log(`Renamed directory ${oldName} to ${newName}`);
        return true;
    } catch(e) {
        console.error(`Failed to rename directory from ${oldName} to ${newName}`);
        return false;
    }
}

// TODO: Archive files before delete?
const deleteDirectory = async (container:string, directoryName:string) => {
    if (!container || !directoryName) return false;

    const sharedClient = await getSharedClient(container);
    if (!sharedClient) return false;

    try {
        const directoryClient = sharedClient.getDirectoryClient(directoryName);
        const files = sharedClient.listPaths({path: directoryName, recursive: true});
        for await (const file of files) {
            if (!file.isDirectory) {
                await sharedClient.getFileClient(file.name).delete();
            }
        }
        await directoryClient.delete();
        return true;
    } catch(e) {
        console.error('Failed to delete directory: ' + directoryName);
        return false;
    }
}

// File functions

const getFile = async (container:string, path:string) => {
    if (!container || !path) return false;

    const sharedClient = await getSharedClient(container);
    if (!sharedClient) return false;
    
    try {
        const fileClient = await sharedClient.getFileClient(path);
        const file = await fileClient.read();
        return file;
    } catch(e:any) {
        console.error(`Failed to get file "${path}" from container "${container}" - ${e.message}` );
        return false;
    }
}

const getFiles = async (container:string, directory:string) => {
    if (!container || !directory) return false;

    const sharedClient = await getSharedClient(container);
    if (!sharedClient) return false;

    try {
        let files = [];
        console.log('getting paths');
        let paths = sharedClient.listPaths({path: directory, recursive: true});

        for await (const path of paths) {
            if (!path.isDirectory) {
                let pathClient = await sharedClient.getFileClient(path.name);
                let fileProperties = await pathClient.getProperties();
                files.push({
                    path: path.name,
                    name: path.name.slice(path.name.lastIndexOf('/') + 1),
                    type: fileProperties.contentType,
                    size: path.contentLength,
                    modified: path.lastModified
                });
            }
        }
        console.log('returning files');
        return files;
    } catch(e) {
        console.error('Failed to get files by directory: ' + directory);
        console.error('- ' + e);
        return false;
    }
}

const uploadFile = async (container:string, documentId:string, file:File, folder:string, group:string, groups:string[], uploadedBy:string, uploadDate:string) => {
    if (!container || !documentId || !group || !file || !uploadedBy) return false;

    const sharedClient = await getSharedClient(container);
    if (!sharedClient) return false;

    const groupName = group.split(' - ')[1]
    const groupNcode = group.split(' - ')[0]

    const uploadPath = group ? `${groupNcode}/${file.name}` : file.name;

    console.log(`Uploading file ${file.name} ...`);
    try {
        const fileClient = await sharedClient.getFileClient(uploadPath);
        const fileArrayBuffer = await file.arrayBuffer();
        const response = await fileClient.upload(fileArrayBuffer, {
            metadata: { // TODO: Add metadata 
                document_id: documentId,
                group: group,
                groupName: groupName,
                groupNcode: groupNcode,
                folder: folder,
                uploaded_by: uploadedBy,
                upload_date: uploadDate
            },
            // onProgress: (progress:TransferProgressEvent) => {} // TODO: How to display progress?
        });
        console.log('Upload response: ' + JSON.stringify(response));
        return true;
    } catch(e) {
        console.error(`Failed to save file: ${group}/${file.name}`);
        console.error(e);
        return false;
    }
}

const getFileStream = async (container:string, path:string) => {
    const file = await getFile(container, decodeURI(path));
    return file.readableStreamBody;
}

const moveApprovedFile = async (srcPath:string, destPath:string) => {
    if (!srcPath || !destPath) {
        console.log('Inavlid request');
        return;
    };

    const srcContainer = process.env.DATALAKE_CONTAINER_REQUESTS;
    const destContainer = process.env.DATALAKE_CONTAINER_INPUT;
    const basePath = process.env.DATALAKE_PIPELINE_BASE_PATH ? process.env.DATALAKE_PIPELINE_BASE_PATH + '/' : '';
    const destPathSplit = destPath.split('/');
    const destDirectory = destPathSplit.slice(0,-1).join('/');
    const destFileName = destPathSplit.slice(-1).join('/');

    if (!srcContainer || !destContainer) {
        console.log('Missing container env variable');
        return;
    };

    const srcClient = await getSharedClient(srcContainer);
    const destClient = await getSharedClient(destContainer);
    if (!srcClient || !destClient) {
        console.log('Failed to get container client');
        return false;
    }
        
    try {
        const srcFileClient = await srcClient.getFileClient(srcPath);
        const destFileClient = await destClient.getFileClient(basePath + destPath);
        const destDirectoryClient = await destClient.getDirectoryClient(basePath + destDirectory);
        // TODO: Ensure source file exists
        destDirectoryClient.createIfNotExists();
        await srcFileClient.move(destFileClient.fileSystemName, destFileClient.name);
    } catch(e:any) {
        console.error(`Failed to move file from "${srcContainer}:${srcPath}" to "${destContainer}:${basePath + destPath}" - ${e.message}` );
        return false;
    }

    try {
        const manifestContent =
`I&KM File Upload
Upload of file from I&KM for processing
${destDirectory}/${destFileName}`;
        const manifestFileClient = await destClient.getFileClient(basePath + 'manifest.txt');
        await manifestFileClient.create();
        await manifestFileClient.append(manifestContent, 0, manifestContent.length);
        await manifestFileClient.flush(manifestContent.length);
    } catch(e:any) {
        console.error(`Failed to create manifest file for "${destContainer}:${basePath + destPath}" - ${e.message}` );
        return false;
    }

    return true;
}

// Based on Microsoft Docs:
// A helper method used to read a Node.js readable stream into a Buffer.
const streamToBuffer = async (readableStream:any) => {
    return new Promise<Buffer>((resolve, reject) => {
        const chunks:Buffer[] = [];
        readableStream.on("data", (data:any) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on("end", () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on("error", reject);
    });
}

const decodeBase64WithBuffer = (base64String: string): string => {
    try {
        return Buffer.from(base64String, 'base64').toString('utf-8')
    } catch (error) {
        console.error('Failed to decode base64 string with Buffer:', error)
        throw new Error('The string to be decoded is not correctly encoded.')
    }
}

const getOutputFileContents = async (searchResult:IkmFile) => { //TODO: Check why this function isn't working and isn't returning data
//const getOutputFileContents = async (searchResult:IkmFile, outputPathPart:string) => {
    //console.log('TEST RAW searchResult:', searchResult.metadataPath)

    console.log('TEST DECODED STRING:', decodeBase64WithBuffer(searchResult.metadataPath))    
    //const decodedString = decodeBase64WithBuffer(searchResult.metadataPath)

    if (!searchResult.metadataPath) return;

    try {
        //console.log('metadataPath: ' + atob(searchResult.metadataPath));
        // Decode storage path, trim end, and split into parts
        // NOTE: The last replace addresses a flaw found in the data
        const metadataPath = decodeURI(decodeBase64WithBuffer(searchResult.metadataPath)).trimEnd().replace('.json5', '.json');
        console.log('TEST METADATAPATH:', metadataPath)
        //const metadataPath = decodeURI(atob(searchResult.metadataPath)).trimEnd().replace('.json5', '.json');
        const metadataPathSplit = metadataPath.split('/');
        //if (metadataPathSplit.length < 7) return false; // TODO: Better error handling
        console.log('Test metadata path split:', metadataPathSplit)
        //const storageRoot = metadataPathSplit.slice(0, 2).join('/');
        const container = metadataPathSplit[3];
        const groupFolder = metadataPathSplit[4];
        const fileName = metadataPathSplit[5];
        //const metadataFile = metadataPathSplit.slice(5);
        
        // Sample path reference:
        // https://ikmdatadoqge.blob.core.usgovcloudapi.net/output/runpipeline/text_processing_json/Tactics%20and%20Operations/Role-of-Space-in-Russias-Operations-in-Ukraine%20(1).pdf.output.json

        const relativePath = encodeURI(`${groupFolder}/${fileName}`);
        //const relativePath = encodeURI(`${batch}/${outputPathPart}/${searchResult.name}.output.json`);
        console.log('Getting: ' + relativePath);
        const file = await getFile(container, decodeURI(relativePath));
        const fileString = (await streamToBuffer(file.readableStreamBody)).toString();
        return JSON.parse(fileString);
    } catch (e:any) {
        console.log('Failed to get file contents: ' + e?.message);
        return;
    }
}

const getSearchResultDetails = async (searchResult:IkmFile) => {
    if (!searchResult.metadataPath) return;

    // Get text processing results
    const textJson = await getOutputFileContents(searchResult);
    console.log('TEST SEARCH RESULTS JSON: ', textJson)
    //const textSummarisationJson = await getOutputFileContents(searchResult);
    /*const textProcessingJson = await getOutputFileContents(searchResult, 'text_processing_json');
    const textSummarisationJson = await getOutputFileContents(searchResult, 'text_summarisation_processing_json');*/
    if (!textJson) return;

    // Cleanup odd formatting in data
    let shortSummary = textJson.summarized_text_xsum;
    if (shortSummary.charAt(0) === '[') shortSummary = shortSummary.slice(1);
    if (shortSummary.charAt(shortSummary.length - 1) === ']') shortSummary = shortSummary.slice(0,-1);
    shortSummary = shortSummary.replaceAll('<n>', '\n');
    let longSummary = textJson.summarized_text_dailymail;
    if (longSummary.charAt(0) === '[') longSummary = longSummary.slice(1);
    if (longSummary.charAt(longSummary.length - 1) === ']') longSummary = longSummary.slice(0,-1);
    longSummary = longSummary.replaceAll('<n>', '\n');

    // TODO: text_processing_clustering

    return JSON.stringify({
        documentId: textJson.document_id,
        group: textJson.group,
        folder: textJson.folder,
        uploadedBy: textJson.uploaded_by,
        uploadDate: textJson.upload_date,
        fileName: textJson.file_name.split('/').slice(-1),
        fileType: textJson.file_type.toUpperCase(),
        downloadPath: searchResult.path.split('/').slice(3).join('/'),
        keyPhrases: textJson.key_phrases.slice(0, 20),
        //textProcessingJson.pii.length
        //textProcessingJson.pii_redacted_text
        shortSummary,
        longSummary 
    });
}

export {
    createDirectory,
    deleteDirectory,
    getDirectories,
    getFile,
    getFiles,
    getFileStream,
    getSearchResultDetails,
    moveApprovedFile,
    renameDirectory,
    uploadFile
}