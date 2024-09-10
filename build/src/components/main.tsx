'use client'

import { useUserAuthenticationContext } from '@/context/UserAuthenticationContext'
import NavMenu from '@/components/nav-menu';
import BootstrapClient from "@/components/bootstrap-client"

import styles from "./main.module.scss"
import "@/app/globals.scss"

export default function Main({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    const { userSession } = useUserAuthenticationContext()

    return (
        <div className={`${styles.mainWrapper} ${!userSession ? 'disabled' : ''}`}>
            <NavMenu />
            <div className="content-wrapper">
                {children}
            <BootstrapClient />
            </div>
        </div>
    )
}
