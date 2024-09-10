import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/services/storage.service";
import { createUploadRequest } from "@/services/db.service";
import { v4 as uuidv4 } from 'uuid'

const handler = async (req: NextRequest) => {
    const container = process.env.DATALAKE_CONTAINER_REQUESTS;
    const formData = await req.formData();
    const group = formData.get('group') as string;
    const justification = formData.get('justification') as string;
    const files = (formData.getAll('files') as File[]);
    const uploadDate = formData.get('uploadDate') as string;
    const folder = formData.get('folder') as string;
    const groups = [] as string[] //TODO: get and define value
    const uploadedBy = formData.get('uploadedBy') as string;
    console.log("Files: " + JSON.stringify(files.map(file => file.name)));

    if (!container) {
        console.error('Missing data lake container variable');
        return NextResponse.json({ message: 'Missing container' }, { status: 500 });
    }

    if (!group) {
        console.error('Missing group value');
        return NextResponse.json({ message: 'Missing group' }, { status: 400 });
    }

    let error = false;
    files.forEach( async (file, i) => {
        //TODO: Verify additional new arguments for uploadFile()
        let documentId = uuidv4()
        if (!(await uploadFile(container, documentId, file, folder, group, groups, uploadedBy, uploadDate))) {
            error = true;
        } else {
            await createUploadRequest(group, file, justification, (formData.get(`pii-${i}`) as string) === 'on');
        }
    });

    return error
    ? NextResponse.json({ message: 'File upload failed', files: files }, { status: 500 })
    : NextResponse.json({ message: 'File(s) uploaded', files: files });
}

export { handler as POST };
