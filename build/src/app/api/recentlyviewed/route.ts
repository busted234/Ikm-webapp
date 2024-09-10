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
    const { documentId, fileName, fileType, groupName, folderName } = body
    const user = await getCurrentUser()
    const userId = user.id

    if (!documentId && !groupName) {
        return NextResponse.json({ message: 'Missing required fields: documentId, groupName' })
    }

    try {
        await prisma.userRecentDocument.upsert({
            where: { userId_documentId: { userId, documentId } },
            update: { viewedAt: new Date() },
            create: {
                userId,
                documentId,
                fileName,
                fileType,
                groupName,
                folderName,
                viewedAt: new Date()
            }
        })

        const recentDocuments = await prisma.userRecentDocument.findMany({
            where: { userId },
            orderBy: { viewedAt: 'desc' },
            skip: 10,
            take: 1
        })

        if (recentDocuments.length > 0) {
            await prisma.userRecentDocument.deleteMany({
                where: {
                    userId,
                    viewedAt: { lt: recentDocuments[0].viewedAt }
                }
            })
        }

        return NextResponse.json({ message: 'Document view logged successfully.' })
    } catch (error:any) {
        console.error('Error logging recently viewed document:', error)
        return NextResponse.json({ message: 'Internal server error', error: error.message })
    }
}

export { handler as POST }