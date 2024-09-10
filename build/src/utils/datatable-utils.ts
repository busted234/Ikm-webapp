import { SortingFn } from '@tanstack/react-table'
import { IkmFile } from "@/services/search.models";

export const alphanumericSortingFn: SortingFn<IkmFile> = (rowA, rowB, columnId) => {
    const fileA = rowA.getValue<string | undefined>(columnId)
    const fileB = rowB.getValue<string | undefined>(columnId)

    const normalize = (value: any) => Array.isArray(value) ? value[0]?.toLowerCase() || '' : typeof value === 'string' ? value.toLowerCase() : ''
    
    const normalizeA = normalize(fileA)
    const normalizeB = normalize(fileB)

    const partsA = normalizeA.match(/(\d+|\D+)/g) || []
    const partsB = normalizeB.match(/(\d+|\D+)/g) || []

    for (let i=0; i<Math.max(partsA.length, partsB.length); i++) {
        const partA = partsA[i] || ''
        const partB = partsB[i] || ''

        if (!isNaN(Number(partA)) && !isNaN(Number(partB))) {
            const numA = parseInt(partA, 10)
            const numB = parseInt(partB, 10)
            if (numA !== numB) {
                return numA - numB
            }
        }

        if (partA !== partB) {
            return partA.localeCompare(partB)
        }
    }

    return 0
}