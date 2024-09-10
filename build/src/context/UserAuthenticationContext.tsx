'use client'

import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { getUserSession as fetchUserSession, getCurrentUser as fetchCurrentUser } from '@/services/db.service'
import { User, UserSession } from '@/types/userAuthentication'

interface Group {
    id: string;
    name: string;
    nCode: string;
    nCodeName: string;
    path: string;
}

interface Role {
    name: string;
    read: boolean;
    write: boolean;
}

interface UserGroupRole {
    group: Group;
    role: Role;
}

interface UserMetadata {
    id: string;
    name: string;
    email: string;
    userGroupRoles: UserGroupRole[];
}

interface UserAuthenticationContextType {
    userSession: UserSession | null;
    currentUser: User | null;
    userInfo: UserMetadata;
    selectedRole: string;
    setSelectedRole: (role: string) => void;
    availableRoles: string[]
}

interface UserAuthenticationProviderProps {
    children: React.ReactNode;
}

const UserAuthenticationContext = createContext<UserAuthenticationContextType | undefined>(undefined)

export const UserAuthenticationProvider = ({ children }: UserAuthenticationProviderProps) => {
    const [userSession, setUserSession] = useState<any | null>(null)
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [userInfo, setUserInfo] = useState<UserMetadata | null>(null)
    const [selectedRole, setSelectedRole] = useState<string>('user')
    const [availableRoles, setAvailableRoles] = useState<string[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    const getUserSession = useCallback(async () => {
        try {
            const session = await fetchUserSession()
            setUserSession(session)
        } catch (error) {
            console.error('Error: failed to get user session', error)
        }
    }, [userSession])

    const getCurrentUser = useCallback(async () => {
        try {
            const user = await fetchCurrentUser()
            setCurrentUser(user)
        } catch (error) {
            console.error('Error: failed to get current user', error)
        }
    }, [currentUser])

    const fetchUserData = async () => {
        try {
            const userData = await fetchCurrentUser()
            const savedRole = sessionStorage.getItem('selectedRole')

            const roles = new Set<string>()
            userData.userGroupRoles.forEach((ugr:any) => roles.add(ugr.role.name))

            const sortedRoles = Array.from(roles).sort()
            setAvailableRoles(sortedRoles)

            if (savedRole) {
                setSelectedRole(savedRole)
            } else {
                sessionStorage.setItem('selectedRole', 'user')
            }

            //sortedRoles.includes('user') ? 'user' : sortedRoles[0]

            setUserInfo(userData)
        } catch (error) {
            console.error('Error fetching user data: ', error)
        } finally {
            setLoading(false)
        }
    }

    const updateRole = (role: string) => {
        setSelectedRole(role)
        sessionStorage.setItem('selectedRole', role)
    }

    useEffect(() => {
        getUserSession()
        getCurrentUser()
        fetchUserData()
    },[])

    if (loading) {
        return <div>Loading...</div>
    }

    if (!userInfo) {
        return <div>Error loading user data</div>
    }

    return (
        <UserAuthenticationContext.Provider value={{ userInfo, selectedRole, setSelectedRole: updateRole, availableRoles, userSession, currentUser }}>
            {children}
        </UserAuthenticationContext.Provider>
    )
}

export const useUserAuthenticationContext = (): UserAuthenticationContextType => {
    const context = useContext(UserAuthenticationContext)
    if (!context) {
        throw new Error('Error: useUserAuthenticationContext is required to be used within a UserAuthenticationProvider')
    }
    return context
}

