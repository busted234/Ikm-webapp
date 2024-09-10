'use client'

import styles from "./search.module.scss";
import { FaSearch } from 'react-icons/fa';
import { useRouter } from "next/navigation";
import { KeyboardEvent, MouseEvent, useCallback, useRef } from "react";

export default function Search() {
    const router = useRouter();
    const searchInputRef = useRef<HTMLInputElement>(null)

    const handleSearch = useCallback(async (searchPhrase: string | undefined) => {
        if (searchPhrase) return await router.push('/search?q=' + encodeURI(searchPhrase as string))
    },[])

    const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
        return await handleSearch(searchInputRef.current?.value)
    }

    const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') return await handleSearch((e.target as HTMLInputElement).value)
    }

    return (
        <span className={styles.inputWrapper}>
            <input id="search-input" type="text" className={styles.searchInput} ref={searchInputRef} onKeyDown={handleKeyDown} placeholder="Search" />
            <button className={styles.searchBtn} onClick={handleClick}><FaSearch size=".8rem" /></button>
        </span>
    )
}
