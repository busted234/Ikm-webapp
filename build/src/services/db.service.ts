'use server'

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/authOptions";
import { v4 as uuid } from "uuid";
import { getFileNameFromSearchIndex, getUploadedByFromSearchIndex } from '@/services/search.service'

const prisma = new PrismaClient(); // TODO: Fix issue of multiple instances being created

export interface UserMetaData {
    id: string;
    name: string;
    email: string;
    roles: {
        role: string;
        group: {
            id: string;
            name: string;
            n_code: string;
            path: string;
            ncode_name: string;
            parentGroup?: {
                id: string;
                name: string;
                n_code: string;
                path: string;
                ncode_name: string;
            };
        };
    }[];
    metadata: {
        phone: string;
        location: string;
    }
}

let _currentUser: any; // TODO: Clear on logout

const getUserSession = async () => {
    return await getServerSession(authOptions);
}

const getCurrentUser = async () => {
    if (_currentUser) return _currentUser;

    const session = await getUserSession();
    //console.log('AD USER INFO:')
    //console.log(session)
    if (!session?.user?.email) return;
    const user = await prisma.user.findFirst({
        where: {
            email: session.user.email
        },
        select: {
            id: true,
            name: true,
            email: true,
            userGroupRoles: {
                select: {
                    group: {
                        select: {
                            id: true,
                            name: true,
                            nCode: true,
                            nCodeName: true,
                            path: true
                        }
                    },
                    role: {
                        select: {
                            name: true,
                            read: true,
                            write: true
                        }
                    }
                }
            }
        }
    });
    // TODO: Handle empty response
    _currentUser = user;

    _currentUser['groups'] = (await prisma.userGroupRole.findMany({
        where: {
            user: {
                email: _currentUser.email
            }
        },
        select: {
            group : {
                select: {
                    id: true,
                    name: true,
                    nCode: true,
                    nCodeName: true,
                    path: true
                }
            },
            role: {
                select: {
                    name: true,
                    read: true,
                    write: true
                }
            }
        }
    })).map(x => x);

    console.log('CURRENT USER GROUPS & ROLES: ', _currentUser.userGroupRoles)
    console.log('CURRENT USER ALL: ', _currentUser)

    return _currentUser; //Use _currentUser.userGroupRoles
}

const clearCurrentUser = () => {
    _currentUser = null;
}

// Get upload requests for all groups the current user is a content manager for
const getUploadRequests = async () => {
    const user = await getCurrentUser();
    const response = await prisma.user.findFirst({
        where: {
            email: user.email
        },
        select: {
            userGroupRoles: {
                where: {
                    role: {
                        name: 'manager'
                    }
                },
                select: {
                    group: {
                        select: {
                            uploadRequests: {
                                where: {
                                    requestedBy: {
                                        email: user.email
                                        //email: { not: user.email } //TODO: Uncomment this after testing
                                    }
                                },
                                include: {
                                    group: {
                                        select: {
                                            name: true,
                                            id: true
                                        }
                                    },
                                    requestedBy: {
                                        select: {
                                            name: true,
                                            email: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    // TODO: Handle empty response

    console.log('TEST USER RESPONSE:', response?.userGroupRoles[0].group.uploadRequests)

    let uploadRequests = <any>[];
    response?.userGroupRoles.forEach(groupRole => {
        groupRole.group.uploadRequests.forEach(request => {
            console.log('TEST GROUP UPLOAD REQUESTS:', request)
            uploadRequests.push(request);
        })
    })
    console.log('UPLOAD REQUESTS ARRAY:', uploadRequests)
    return uploadRequests;
}

// Get current user's upload and change requests
const getUserRequests = async () => {
    const user = await getCurrentUser();
    let userRequests = <any>[];

    // Get upload requests
    const response = await prisma.uploadRequest.findMany({
        where: {
            requestedBy: {
                email: user.email
            }
        },
        include: {
            group: {
                select: {
                    name: true
                }
            },
            // TODO: Remove requestedBy once refactored out of table
            requestedBy: {
                select: {
                    name: true,
                    email: true
                }
            }
        }
    });

    // TODO: Handle empty response

    response.forEach(request => {
        userRequests.push(request);
    });

    // TODO: Get change requests

    return userRequests;
}

const createUploadRequest = async (group:string, file:File, justification:string, pii:boolean) => {
    const user = await getCurrentUser();
    // TODO: Validate request

    // TODO: Check for existing file request of same file and user

    const groupName = group.split(' - ')[1]
    const groupNcode = group.split(' - ')[0]

    const response = await prisma.uploadRequest.create({
        data: {
            id: uuid(),
            fileName: file.name,
            filePath: `${groupNcode}/${file.name}`,
            group: {
                connect: {
                    name: groupName
                }
            },
            pii: pii,
            justification: justification,
            notes: '',
            status: 'Pending',
            requestedBy: {
                connect: {
                    email: user.email
                }
            },
            requestTime: (new Date()).toISOString()
        }
    })

    // TODO: Remove when logging and/or audit records are in place
    console.log('created upload request: ' + JSON.stringify(response));
}

const updateUploadRequest = async (id:string, data:any) => {
    const response = await prisma.uploadRequest.update({
        where: {
            id: id
        },
        data: data
    })

    // TODO: Remove when logging and/or audit records are in place
    console.log('updateUploadRequest response: ' + JSON.stringify(response));
}

const getRecentlyViewedDocuments = async (userId: string) => {
    try {
        const recentDocuments = await prisma.userRecentDocument.findMany({
            where: { userId },
            orderBy: { viewedAt: 'desc' },
            take: 10
        })
        return recentDocuments
    } catch (error) {
        console.error('Error retrieving recently viewed documents:', error)
        throw error
    }
}

const fetchAllRecentlyViewedDocuments = async () => {
    const recentDocuments = await prisma.userRecentDocument.findMany({
        orderBy: { viewedAt: 'desc' },
        take: 8
    })
    return recentDocuments
}

const getAllRecentlyViewedDocuments = async () => {
    try {
        const allRecentlyViewedDocuments = await fetchAllRecentlyViewedDocuments()
        
        const finalRecentDocuments = await Promise.all(
            allRecentlyViewedDocuments.map(async doc => {
                const uploadedByName = await getUploadedByFromSearchIndex(doc.documentId)
                return {
                    ...doc,
                    uploadedBy: uploadedByName
                }
            })
        )
        console.log('FINAL RECENT DOCUMENTS TEST:', finalRecentDocuments)
        return finalRecentDocuments
    } catch (error) {
        console.error('Error retrieving recently viewed documents:', error)
        throw error
    }
}

const getFavoriteDocuments = async (userId: string) => {
    try {
        const favorites = await prisma.userFavorites.findMany({
            where: { userId },
            orderBy: { addedAt: 'desc' }
        })
        return favorites
    } catch (error) {
        console.error('Error retrieving favorite documents:', error)
        throw error
    }
}

/*const getFavoriteDocuments = async () => {
    const user = await getCurrentUser();
    const response = await prisma.userFavorites.findMany({
        where: {
            userId: user.id,
            document: {
                groupDocuments: {
                    some: {
                        group: {
                            userGroupRoles: {
                                some: {
                                    userId: user.id
                                }
                            }
                        }
                    }
                }
            }
        },
        select: {
            document: {
                select: {
                    fileName: true
                }
            }
        }
    })
    return response
}*/

const getRecommendedDocuments = async (userId: string) => {
    try {
        const userGroups = await prisma.userGroupRole.findMany({
            where: { userId },
            include: {
                group: {
                    select: {
                        id: true,
                        name: true, 
                        nCodeName: true
                    }
                }
            }
        })

        console.log('USER GROUPS:', userGroups)

        const groupIds = userGroups.map(ugr => ugr.group.id)
        const groupNames = userGroups.map(ugr => ugr.group.name)

        console.log('GROUP IDS:', groupIds)

        if (groupIds.length === 0) {
            console.log('No groups found for this user')
            return []
        }

        const documentViews = await prisma.documentViews.findMany({
            where: {
                groupId: {
                    in: groupIds
                }
            },
            orderBy: [
                { viewCount: 'desc' },
                { lastViewed: 'desc' }
            ],
            take: 10,
            include: {
                group: {
                    select: {
                        name: true
                    }
                }
            }
        })

        console.log('DOCUMENT VIEWS:', documentViews)

        const recommendedDocuments = await Promise.all(
            documentViews.map(async (doc:any) => {
                const fileName = await getFileNameFromSearchIndex(doc.documentId)
                console.log('TEST FILENAME:', fileName)
                return {
                    ...doc,
                    fileName: fileName || 'Unknown Document'
                }
            })
        )

        console.log('RECOMMENDED DOCUMENTS:', recommendedDocuments)

        return recommendedDocuments
    } catch (error) {
        console.error('Error retrieving recommended documents:', error)
        throw error
    }
}

const getGroups = async(userId: string | undefined) => {
    try {
        const userGroups = await prisma.userGroupRole.findMany({
             where: {
                userId: userId
             },
             select: {
                group: {
                    select: {
                        id: true,
                        name: true,
                        nCode: true,
                        nCodeName: true
                    }
                }
             }
        })

        const groups = userGroups.map(groupRole => ({
            id: groupRole.group.id,
            name: groupRole.group.name,
            nCode: groupRole.group.nCode,
            nCodeName: groupRole.group.nCodeName
        }))

        return groups
    } catch (error) {
        console.log('Failed to fetch all groups:', error)
        throw error
    }
}

const getUsersWithRolesAndGroups = async () => {
    const currentDate = new Date().toISOString() //TODO: delete after "Last Login" has been added

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                userGroupRoles: {
                    select: {
                        role: {
                            select: {
                                name: true
                            }
                        },
                        group: {
                            select: {
                                nCode: true,
                                nCodeName: true
                            }
                        }
                    }
                }
            }
        })

        const formattedUsers = users.map(user => ({
            userName: user.name,
            email: user.email,
            groups: user.userGroupRoles.map(role => ({
                groupName: role.group.nCodeName,
                nCode: role.group.nCode,
                roles: role.role.name
            })),
            lastLogin: currentDate
        }))

        return formattedUsers
    } catch (error) {
        console.log('Failed to fetch all users:', error)
        throw error
    }
}

export {
    getUserSession,
    getCurrentUser,
    clearCurrentUser,
    createUploadRequest,
    getUploadRequests,
    getUserRequests,
    updateUploadRequest,
    getRecentlyViewedDocuments,
    getAllRecentlyViewedDocuments,
    getFavoriteDocuments,
    getRecommendedDocuments,
    getGroups,
    getUsersWithRolesAndGroups
}
``