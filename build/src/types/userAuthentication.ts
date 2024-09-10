export interface User {
    id: string;
    name: string;
    email: string;
    groups: string[];
    userGroupRoles: string[];
}

export interface UserSession {
    name: string;
    email: string;
    image: string;
    profile: any;
}

export type UploadRequest = {
    id: string,
    fileName: string,
    filePath: string,
    group: {
        name: string
    },
    pii: boolean,
    justification: string,
    notes: string,
    status: string,
    requestedBy: {
        name: string,
        email: string
    },
    requestTime: string
}

