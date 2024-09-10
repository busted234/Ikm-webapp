import { NextRequest, NextResponse } from 'next/server'
import { BlobServiceClient } from '@azure/storage-blob'
import { v4 as uuidv4 } from 'uuid'

const SAS_URL = 'https://ikmdatadjueu.blob.core.usgovcloudapi.net/input?sp=racwdlm&st=2024-08-16T23:24:04Z&se=2024-08-24T07:24:04Z&sv=2022-11-02&sr=c&sig=oZhux1cAnV5yetk3J1XiwPqGorJ2CDVzLHDjcKJr4d8%3D'
const blobServiceClient = new BlobServiceClient(SAS_URL)

const handler = async (req: NextRequest) => {
    if (req.method !== 'PUT') {
        return NextResponse.json({ message: 'Only PUT requests are allowed' })
    }

    const body = await req.json()
    const { folderName, group, uploadedBy, folder } = body

    if (!folderName || !group || !uploadedBy) {
        return NextResponse.json({ message: 'Missing required fields: folderName, group, uploadedBy' })
    }

    try {
        const batchFolder = 'batch'
        const today = new Date().toISOString()

        const containerClient = blobServiceClient.getContainerClient('')
        const directoryPath = `${batchFolder}/${folderName}`
        let updatedCount = 0

        for await (const blob of containerClient.listBlobsFlat({ prefix: directoryPath })) {
            const blockBlobClient = containerClient.getBlockBlobClient(blob.name)
            const existingMetadata = (await blockBlobClient.getProperties()).metadata
            
            if (existingMetadata && existingMetadata['hdi_isfolder'] === 'true') {
                console.log(`Skipping metadata update for folder: ${blob.name}`)
                continue;
            }

            const updatedMetadata = {
                ...existingMetadata,
                document_id: uuidv4(),
                group: group,
                uploaded_by: uploadedBy,
                upload_date: today,
                folder: folder
            }

            await blockBlobClient.setMetadata(updatedMetadata)
            updatedCount++
        }

        return NextResponse.json({ message: `Metadata updated for ${updatedCount} files in ${folderName}` })
    } catch (error:any) {
        console.error('Error updating metadata:', error)
        console.error('Request Headers:', error.request.headers)
        return NextResponse.json({ message: 'Internal server error', error: error.message })
    }
}

export { handler as PUT }