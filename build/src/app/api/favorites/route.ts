import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/services/db.service";
import { v4 as uuidv4 } from 'uuid'

const handler = async (req: NextRequest, res: NextResponse) => {
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Only POST requests are allowed' })
    }

    const prisma = new PrismaClient()
    const body = await req.json()
    const { documentId, fileName, groupName, folderName, isFavorited } = body
    const user = await getCurrentUser()
    const userId = user.id

    if (!documentId && !groupName) {
        return NextResponse.json({ message: 'Missing required fields: documentId, groupName' })
    }

    try {
        if (isFavorited) {
            await prisma.userFavorites.delete({
                where: { userId_documentId: { userId, documentId } }
            })
        } else {
            await prisma.userFavorites.upsert({
                where: { userId_documentId: { userId, documentId } },
                update: { modifiedTime: new Date() },
                create: {
                    userId,
                    documentId,
                    fileName,
                    groupName,
                    folderName,
                    addedAt: new Date()
                }
            })
        }

        return NextResponse.json({ message: 'Favorite status updated successfully.' })
    } catch (error:any) {
        console.error('Error updating favorite status:', error)
        return NextResponse.json({ message: 'Internal server error', error: error.message })
    }
}

export { handler as POST }