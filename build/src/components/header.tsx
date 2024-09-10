'use client'

import Link from "next/link";
import UserInfo from '@/components/user-info';
import Search from "@/components/search";
import { usePathname } from "next/navigation";
import { useUserAuthenticationContext } from '@/context/UserAuthenticationContext'

import "../app/globals.scss";
import styles from "./header.module.scss";

import { SearchInfo } from '@/enums/search'
import { HeaderInfo } from '@/enums/header'

export default function Header() {
    const pathname = usePathname();
    const { userSession } = useUserAuthenticationContext()

    return (
        <>
            <header>
                <Link href='/'>
                    <span className="logo-wrapper">
                        <img src="/mainLogo2023.png" alt="BUMED logo" className="header-logo" />
                        {HeaderInfo.HeaderTitle}
                    </span>
                </Link>
                <UserInfo />
            </header>
            <div className={`${pathname !== '/' ? 'hidden' : ''}`}>
                <div className={`${styles.homeHeaderWrapper} ${!userSession ? 'disabled' : ''}`}>
                    <div className={styles.searchPane}>
                        <div className={styles.prompt}>{SearchInfo.SearchHeader}</div>
                        <div className={styles.searchWrapper}>
                            <Search />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

