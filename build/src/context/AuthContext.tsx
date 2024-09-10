'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface Profile {
    displayName: string;
    mail?: string;
    userPrincipalName: string;
}

interface Group {
    id: string;
    displayName: string;
}

interface AuthContextType {
    profile: Profile | null;
    //groups: Group[];
    loading: boolean;
}

interface AuthProviderProps {
    children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const { data: session } = useSession()
    const [profile, setProfile] = useState<Profile | null>(null)
    //const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        const fetchProfileAndGroups = async () => {
            console.log('SESSION!!:')
            console.log(session)
            if (session?.accessToken) {
                console.log('OK INSIDE!!!!')
                try {
                    const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
                        headers: {
                            Authorization: `Bearer ${session.accessToken}`
                        }
                    })
                    const profileData = await profileResponse.json()
                    console.log('PROFILE DATA:')
                    console.log(profileData)
                    setProfile(profileData)

                    /*const groupsResponse = await fetch('https://graph.microsoft.com/v1.0/me/memberOf', {
                        headers: {
                            Authorization: `Bearer ${session.accessToken}`
                        }
                    })
                    const groupsData = await groupsResponse.json()
                    console.log('GROUPS DATA:')
                    console.log(groupsData)
                    setGroups(groupsData.value)*/
                } catch (error) {
                    console.error('Error fetching profile or groups: ', error)
                } finally {
                    setLoading(false)
                }
            }
        }
        fetchProfileAndGroups()
    }, [session])

    return (
        <AuthContext.Provider value={{ profile, /*groups,*/ loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}