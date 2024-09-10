'use server'

import type { AzureSearchResult, IkmFile } from "./search.models"
import { getCurrentUser } from "@/services/db.service";

const searchResultsToFiles = (searchResults: AzureSearchResult[]):IkmFile[] => {
    return searchResults.map(x => {
        return {
            score: x['@search.score'],
            name: x.file_name,
            path: x.file_path,
            type: x.file_type,
            lastUpdate: x.file_last_update,
            groups: x.groups,
            group: x.group,
            folder: x.folder,
            uploadedBy: x.uploaded_by,
            uploadDate: x.upload_date,
            summarized_text_xsum: x.summarized_text_xsum,
            summarized_text_dailymail: x.summarized_text_dailymail,
            phrases: x.key_phrases,
            metadataPath: x.metadata_storage_path,
            content: x.text_content
        }
    })
}

const searchFiles = async (azureSearchQueryJson: string, groups: string[], documentIds?: string[]):Promise<IkmFile[]> => {
    let files:IkmFile[] = [];
    let response:Response;

    const groupFilter = groups.map(group => `group eq '${group}'`).join(' or ')
    let filterString = `( ${groupFilter} )`

    if (documentIds && documentIds.length > 0) {
        const documentIdFilter = documentIds.map(id => `document_id eq '${documentIds}'`).join(' or ')
        filterString += ` and ( ${documentIdFilter} )`
    }

    const searchQuery = {
        search: azureSearchQueryJson,
        filter: filterString
    }

    try {
        response = await fetch(`${process.env.SEARCH_BASE_URL}/indexes/${process.env.SEARCH_INDEX}/docs/search?api-version=${process.env.SEARCH_API_VERSION}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.SEARCH_API_KEY
            },
            body: JSON.stringify(searchQuery)
        } as Object);
        const responseJson = await response.json();
        //console.log('TEST:')
        //console.log(responseJson)
        files = searchResultsToFiles(responseJson.value);
        //console.log('TEST CONVERT FILES JSON RESPONSE:', files)
    } catch (e) {
        console.log(`Search error: ${e}`);
    }
    return files;
}

const getAllDocuments = async (): Promise<Array<{
    document_id: string;
    file_name: string;
    uploaded_by: string;
    upload_date: string;
    group: string;
}>> => {
    const currentUser = await getCurrentUser()
    const userGroups = currentUser.userGroupRoles.map((group: any) => group.group.nCodeName)
    console.log('TEST USER GROUPS:', userGroups)
    const groupFilter = userGroups.map((group: any) => `group eq '${group}'`).join(' or ')
    console.log('TEST GROUP FILTERS:', groupFilter)

    try {
        const response = await fetch(`${process.env.SEARCH_BASE_URL}/indexes/${process.env.SEARCH_INDEX}/docs/search?api-version=${process.env.SEARCH_API_VERSION}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.SEARCH_API_KEY
            },
            body: JSON.stringify({
                search: "*",
                filter: groupFilter,
                select: "document_id,file_name,uploaded_by,upload_date,group",
                top: 20
            })
        } as Object);

        if (!response.ok) {
            console.error(`Error fetching documents:`, response.statusText)
            return []
        }

        const data = await response.json();

        console.log('TEST DATA:', data)

        const documents = data.value.map((doc: any) => ({
            document_id: doc.document_id,
            file_name: doc.file_name,
            uploaded_by: doc.uploaded_by,
            upload_date: doc.upload_date,
            group: doc.group
        }))

        console.log('FINAL TEST:', documents)

        return documents
    } catch (error) {
        console.error('Error fetching documents from Azure Search Index:', error)
        return []
    }
}

const getFileNameFromSearchIndex = async (documentId: string):Promise<string | null> => {
    try {
        const searchQuery = {
            filter: `document_id eq '${documentId}'`
        }
        
        const response = await fetch(`${process.env.SEARCH_BASE_URL}/indexes/${process.env.SEARCH_INDEX}/docs/search?api-version=${process.env.SEARCH_API_VERSION}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.SEARCH_API_KEY
            },
            body: JSON.stringify(searchQuery)
        } as Object);

        if (!response.ok) {
            console.error(`Error fetching document ${documentId}:`, response.statusText)
            return null
        }

        const data = await response.json();

        if (data && data.value && data.value.length > 0) {
            const fileName = data.value[0]?.file_name
            return fileName.split("/")[1] || null
        }

        return null
    } catch (error) {
        console.log('Error fetching file name from Azure Search Index:', error);
        return null
    }
}

const getUploadedByFromSearchIndex = async (documentId: string):Promise<string | null> => {
    try {
        const searchQuery = {
            filter: `document_id eq '${documentId}'`
        }
        
        const response = await fetch(`${process.env.SEARCH_BASE_URL}/indexes/${process.env.SEARCH_INDEX}/docs/search?api-version=${process.env.SEARCH_API_VERSION}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.SEARCH_API_KEY
            },
            body: JSON.stringify(searchQuery)
        } as Object);

        if (!response.ok) {
            console.error(`Error fetching document ${documentId}:`, response.statusText)
            return null
        }

        const data = await response.json();

        if (data && data.value && data.value.length > 0) {
            const uploadedBy = data.value[0]?.uploaded_by
            return uploadedBy || null
        }

        return null
    } catch (error) {
        console.log('Error fetching "uploaded by" from Azure Search Index:', error);
        return null
    }
}

export {
    searchFiles,
    getAllDocuments,
    getFileNameFromSearchIndex,
    getUploadedByFromSearchIndex
}
