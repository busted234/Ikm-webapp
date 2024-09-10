import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from "@prisma/client";

const handler = async (req: NextRequest, res: NextResponse) => {
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Only POST requests are allowed' })
    }

    const prisma = new PrismaClient()
    const body = await req.json()
    const { documentId, groupName, name } = body

    try {
        const group = await prisma.group.findUnique({
            where: { name: name, nCodeName: groupName },
            select: { id: true }
        })

        if (!group) {
            throw new Error(`Group with name "${groupName}" not found.`)
        }

        const groupId = group.id
        
        await prisma.documentViews?.upsert({
            where: { documentId_groupId_groupName: { documentId, groupId, groupName } },
            update: { viewCount: { increment: 1 }, lastViewed: new Date()},
            create: {
                documentId,
                groupId,
                groupName,
                viewCount: 1,
                lastViewed: new Date()
            }
        })

        return NextResponse.json({ message: 'Document view count incremented successfully.' })
    } catch (error:any) {
        console.error('Error incrementing document view count:', error)
        return NextResponse.json({ message: 'Internal server error', error: error.message })
    }
}

export { handler as POST }