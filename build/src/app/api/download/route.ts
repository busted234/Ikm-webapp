import { NextRequest, NextResponse } from "next/server";
import { getFileStream } from "@/services/storage.service";

const handler = async (req: NextRequest) => {
    const data = await req.json();

    if (!data.path) {
        console.log('Missing path');
        return new NextResponse();
    };

    const container = data.type === 'request' ? process.env.DATALAKE_CONTAINER_REQUESTS : process.env.DATALAKE_CONTAINER_INPUT;
    if (!container) {
        console.log('Missing container');
        return new NextResponse();
    }

    const stream = await getFileStream(container, data.path);
    // TODO: Handle error

    return new NextResponse(stream);
}

export { handler as POST };