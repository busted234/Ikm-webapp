'use client'

import React from 'react'
import { SessionProvider } from 'next-auth/react'
import { UserAuthenticationProvider } from '@/context/UserAuthenticationContext'
import { AuthProvider } from '@/context/AuthContext' 

interface ClientLayoutProps {
    children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <UserAuthenticationProvider>
        {children}
    </UserAuthenticationProvider>
  );
}
