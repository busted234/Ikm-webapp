import { NextRequest, NextResponse } from 'next/server'
import { BlobServiceClient } from '@azure/storage-blob'
import { v4 as uuidv4 } from 'uuid'

//const SAS_URL = 'https://ikmdatadjueu.blob.core.usgovcloudapi.net/archive?sp=racwdlm&st=2024-08-22T18:42:13Z&se=2024-08-24T02:42:13Z&sv=2022-11-02&sr=c&sig=xFNCzzBAcOY0c%2Bfo5iQXLydFmnZKlUcCBnuAcH%2BkgGM%3D'
//const blobServiceClient = new BlobServiceClient(SAS_URL)

const handler = async (req: NextRequest) => {
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Only POST requests are allowed' })
    }

    const body = await req.json()
    const { folderName } = body

    if (!folderName) {
        return NextResponse.json({ message: 'Missing required field: folderName' })
    }

    try {
        const inputContainerSasUrl = 'https://ikmdatadjueu.blob.core.usgovcloudapi.net/input?sp=racwdlm&st=2024-08-22T19:12:39Z&se=2024-08-24T03:12:39Z&sv=2022-11-02&sr=c&sig=4886vX6qOP1NiVQYE6FSa6B4OrxBJcNUwDwKgKuMA%2Fw%3D'
        const archiveContainerSasUrl = 'https://ikmdatadjueu.blob.core.usgovcloudapi.net/archive?sp=racwdlm&st=2024-08-22T19:11:53Z&se=2024-08-24T03:11:53Z&sv=2022-11-02&sr=c&sig=%2BGWMO6o4d0tl5KLXu4EggAptdfz3ufdaL6pkYO3ysCk%3D'
        const sourceBlobServiceClient = new BlobServiceClient(inputContainerSasUrl)
        const destinationBlobServiceClient = new BlobServiceClient(archiveContainerSasUrl)

        const sourceContainerClient = sourceBlobServiceClient.getContainerClient('') 
        const destinationContainerClient = destinationBlobServiceClient.getContainerClient('')
        const batchFolder = 'batch'
        const archiveFolder = 'archive2024'
        const sourceFolderPath = `${batchFolder}/${folderName}`

        const destinationContainerExists = await destinationContainerClient.exists()
        if (!destinationContainerExists) {
            console.error('Destination container archive does not exist.')
            return NextResponse.json({ message: 'Destination container archive does not exist.' })
        }

        for await(const blob of sourceContainerClient.listBlobsFlat({ prefix: sourceFolderPath })) {
            const sourceBlobClient = sourceContainerClient.getBlobClient(blob.name)

            const destinationBlobName = `${archiveFolder}/${blob.name.replace(sourceFolderPath, '')}`
            console.log(`Destination blob name: ${destinationBlobName}`)
            const destinationBlobClient = destinationContainerClient.getBlobClient(destinationBlobName)
            console.log(`Copying ${blob.name} from ${sourceBlobClient.url} to ${destinationBlobClient.url}`)

            console.log(`Copying ${blob.name} to archive container`)
            await destinationBlobClient.beginCopyFromURL(sourceBlobClient.url)

            console.log(`Deleting ${blob.name} from input container`)
            await sourceBlobClient.delete()
        }

        return NextResponse.json({ message: `All files from ${folderName} moved archive container successfully.` })
    } catch (error:any) {
        console.error('Error moving folder:', error)
        console.error('Request Headers:', error.request.headers)
        return NextResponse.json({ message: 'Internal server error', error: error.message })
    }
}

export { handler as POST }