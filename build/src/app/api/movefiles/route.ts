import { NextRequest, NextResponse } from 'next/server'
import { BlobServiceClient } from '@azure/storage-blob'
import { v4 as uuidv4 } from 'uuid'

const SAS_URL = 'https://ikmdatadjueu.blob.core.usgovcloudapi.net/output?sp=racwdlm&st=2024-08-17T07:01:12Z&se=2024-08-24T15:01:12Z&sv=2022-11-02&sr=c&sig=rC7ii%2FLB1KP7nQmxXEihuHw1%2FEJYleFfud50tedrjSE%3D'
const blobServiceClient = new BlobServiceClient(SAS_URL)

const handler = async (req: NextRequest) => {
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Only POST requests are allowed' })
    }

    const body = await req.json()
    const { sourceFolder, destinationFolder, fileNames } = body

    if (!sourceFolder || !destinationFolder || !fileNames) {
        return NextResponse.json({ message: 'Missing required fields: sourceFolder, destinationFolder, fileNames' })
    }

    try {
        const containerClient = blobServiceClient.getContainerClient('')

        for (const fileName of fileNames) {
            const sourceBlobClient = containerClient.getBlobClient(`${sourceFolder}/${fileName}`)
            const destinationBlobClient = containerClient.getBlobClient(`${destinationFolder}/${fileName}`)

            console.log(`Copying ${fileName} from output/${sourceFolder} to output/${destinationFolder}`)
            await destinationBlobClient.beginCopyFromURL(sourceBlobClient.url)

            console.log(`Deleting ${fileName} from output/${sourceFolder}`)
            await sourceBlobClient.delete()
        }

        return NextResponse.json({ message: 'Files moved successfully.' })
    } catch (error:any) {
        console.error('Error moving files:', error)
        console.error('Request Headers:', error.request.headers)
        return NextResponse.json({ message: 'Internal server error', error: error.message })
    }
}

export { handler as POST }