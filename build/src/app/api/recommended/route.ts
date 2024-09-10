import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getRecommendedDocuments } from "@/services/db.service";

const handler = async (req: NextRequest, res: NextResponse) => {
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Only POST requests are allowed' })
    }

    const user = await getCurrentUser()
    const userId = user.id

    try {
        const recommendedDocuments = await getRecommendedDocuments(userId)

        return NextResponse.json(recommendedDocuments)
    } catch (error:any) {
        console.error('Error retrieving recommended documents:', error)
        return NextResponse.json({ message: 'Internal server error', error: error.message })
    }
}

export { handler as POST }