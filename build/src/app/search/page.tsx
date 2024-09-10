'use client'

import { useEffect, useState, useMemo, useRef, ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import { FaEdit, FaFile, FaFileDownload, FaSearch } from "react-icons/fa";
import { BsChevronDoubleLeft, BsChevronDoubleRight, BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { TiArrowUnsorted, TiArrowSortedUp, TiArrowSortedDown } from "react-icons/ti";
import { MdArrowBackIos } from "react-icons/md";
import { FaRegFilePdf, FaUpload, FaTrash } from "react-icons/fa";
import { MdOutlineStarBorder, MdOutlineStar } from "react-icons/md";
import FileSaver from "file-saver";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable, 
  SortingState,
  ColumnFiltersState
} from "@tanstack/react-table";
import Search from "@/components/search";

import { useUserAuthenticationContext } from '@/context/UserAuthenticationContext'
import { AzureSearchQuery, type IkmFile } from "@/services/search.models";
import { searchFiles } from "@/services/search.service";
import { getSearchResultDetails } from "@/services/storage.service";

import { SearchResults, FileResults, FileTypes, RequestEditTypes } from '@/enums/search'
import { alphanumericSortingFn } from '@/utils/datatable-utils'

import styles from "./page.module.scss";

export default function Files() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState<string | null>('#');
  const [files, setFiles] = useState<any[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [selectionDetails, setSelectionDetails] = useState<any>(null);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState({});
  const [pageCount, setPageCount] = useState<number>(0)
  const [rowCount, setRowCount] = useState<number>(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    const favs: Record<string, boolean> = {}
    files.forEach(doc => {
      favs[doc.name] = doc.favorites
    })  
    return favs
  })
  const [documentId, setDocumentId] = useState<string>('')
  const [groupName, setGroupName] = useState<string>('')
  const [folderName, setFolderName] = useState<string>('')
  const [fileType, setFileType] = useState<string>('')
  const [favoriteDocuments, setFavoriteDocuments] = useState<string[]>([])
  const fileRequestEditFormEl = useRef<HTMLFormElement>(null);
  const fileRequestEditInputEl = useRef<HTMLInputElement>(null);
  const requestEditModalEl = useRef<HTMLDivElement>(null);
  const requestEditModalCloseEl = useRef<HTMLButtonElement>(null);
  const { currentUser } = useUserAuthenticationContext()

  const toggleFavorites = async (fileName: string) => {
    setFavorites(prev => ({
      ...prev,
      [fileName]: !prev[fileName]
    }))

    //const details:any = await getSearchResultDetails(fileName);
    //setSelectionDetails(details ? JSON.parse(details) : {});
    console.log('TESTTTTT SELECTION DETAILS: ', selectionDetails)
    //const documentData = JSON.parse(details)
    //setDocumentId(documentData.documentId)

    try {
      console.log('INSIDE TRY STATEMENT OF FAVORITES')
      const isFavorited = favoriteDocuments.includes(selectionDetails.documentId)
      const documentId = selectionDetails.documentId
      const fileName = selectionDetails.fileName[0]
      const groupName = selectionDetails.group
      const folderName = selectionDetails.folder
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId,
          fileName,
          groupName,
          folderName,
          isFavorited
        })
      })
      console.log('FAVORITES RESPONSE:', response)
      if (response.ok) {
        setFavoriteDocuments(prev =>
          isFavorited ? prev.filter(id => id !== documentId) : [...prev, documentId]
        )
      } else {
        console.error('Failed to update favorite status:', await response.text())
      }
    } catch (error) {
      console.error('Error updating favorite status:', error)
      throw error
    }
  }
  const columns: ColumnDef<IkmFile>[] = [
    {
      accessorFn: x => x.name.split('/').slice(-1),
      accessorKey: 'fileName',
      header: 'File Name',
      sortingFn: alphanumericSortingFn,
      filterFn: 'includesString',
      cell: info => {
        return <div>
          {favorites[info.row.original.name] ? (
            <MdOutlineStar onClick={() => toggleFavorites(info.row.original.name)} title="Unfavorite" />
          ) : (
            <MdOutlineStarBorder onClick={() => toggleFavorites(info.row.original.name)} title="favorite" />
          )}
          <FaRegFilePdf /> 
          {(info as any).getValue()}
        </div>
      }
    },
    {
      accessorKey: 'uploadedBy',
      header: 'Uploaded By',
      sortingFn: alphanumericSortingFn,
      filterFn: (row, columnId, filterValue) => {
        const cellValue = row.getValue<string>(columnId)
        return (filterValue as string).split(',').some(value => cellValue.includes(value))
      }
    },
    {
      accessorFn: x => x.uploadDate.split(' ')[0],
      accessorKey: 'uploadDate',
      header: 'Date',
      sortingFn: alphanumericSortingFn,
      filterFn: (row, columnId, filterValue) => {
        const cellValue = row.getValue<string>(columnId)
        return (filterValue as string).split(' ').some(value => cellValue.includes(value))
      }
    },
    /*{
      accessorFn: x => x.name.split('/').slice(-1),
      accessorKey: 'fileName',
      header: 'File Name',
      sortingFn: alphanumericSortingFn,
      filterFn: 'includesString',
      cell: info => {
        return <div>
          <MdOutlineStarBorder /> <FaRegFilePdf /> {(info as any).getValue()}
        </div>
      }
    },*/
    // TODO: Figure out where to get this data
    // {
    //   accessorKey: 'TBD',
    //   header: 'Uploaded By'
    // },
    // {
    //   accessorFn: x => '--/--/----',
    //   // accessorKey: 'metadata_storage_last_modified',
    //   header: 'Date'
    // },
    // TODO: Switch to this when the metadata is available
    // {
    //   accessorFn: x => x.group,
    //   header: 'Group'
    // },
    {
      accessorFn: x => x.name.split('/').slice(0, -1).join('/'),
      accessorKey: 'group',
      header: 'Group',
      sortingFn: alphanumericSortingFn,
      filterFn: (row, columnId, filterValue) => {
        const cellValue = row.getValue<string>(columnId)
        return (filterValue as string).split(',').some(value => cellValue.includes(value))
      },
      cell: info => {
        if (info.getValue() === 'Strategic Competition') {
          return <div style={{ color: '#548235' }}>{(info as any).getValue()}</div>  
        } else {
          return <div style={{ color: '#002060' }}>{(info as any).getValue()}</div>
        }
      }
    },
    {
      accessorKey: 'type',
      header: 'File Type',
      filterFn: (row, columnId, filterValue) => {
        const cellValue = row.getValue<string>(columnId)
        return (filterValue as string).split(',').some((value: string) => cellValue.includes(value))
      },
      enableColumnFilter: true
    }
  ];

  const columnVisibility = {
    type: false
  }

  const table = useReactTable({
    columns,
    data: files,
    enableMultiRowSelection: false,
    enableSorting: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    rowCount: rowCount,
    pageCount: pageCount,
    state: {
      pagination,
      rowSelection,
      sorting,
      columnFilters,
      columnVisibility
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters
  });

  const doSearch = async (searchTerm:string, groups:string[], documentIds?:string[]) => {
    const searchQuery = new AzureSearchQuery();
    searchQuery.search = searchTerm;
    const files = await searchFiles(JSON.stringify(searchQuery), groups, documentIds); 
    setRowCount(files.length)
    setPageCount(Math.ceil(files.length / 10))
    return files;
  };

  const handleSort = (columnId: string) => {
    const existingSort = sorting.find(sort => sort.id === columnId)
    let newSortDirection = 'asc'
    if (existingSort) {
      newSortDirection = existingSort.desc ? 'asc' : 'desc'
    }
    setSorting([{ id: columnId, desc: newSortDirection === 'desc' }])
  }

  const handleGroupChange = (group: string) => {
    setColumnFilters(prev => {
      const existingFilter = prev.find(filter => filter.id === 'group')
      const existingValues = existingFilter ? (existingFilter.value as string).split(',') : []
      let newFilterValues = []

      if (existingValues.includes(group)) {
        newFilterValues = existingValues.filter(value => value !== group)
      } else {
        newFilterValues = [...existingValues, group]
      }
      
      return newFilterValues.length > 0
        ? [{ id: 'group', value: newFilterValues.join(',') }]
        : []
    })
  }

  const handleFilterChange = (filterId: string, value: string) => {
    setColumnFilters(prev => {
      const existingFilter = prev.find(filter => filter.id === filterId)
      const existingValues = existingFilter ? (existingFilter.value as string).split(',') : []
      let newFilterValues = []

      if (existingValues.includes(value)) {
        newFilterValues = existingValues.filter((val: string) => val !== value)
      } else {
        newFilterValues = [...existingValues, value]
      }

      return newFilterValues.length > 0
        ? [{ id: filterId, value: newFilterValues.join(',') }]
        : prev.filter(filter => filter.id !== filterId)
    })
  }

  const maxPageNumbers = 10
  const totalPages = table.getPageCount()
  const paginationNumbers = useMemo(() => {
    const startPage = Math.max(0, Math.min(pagination.pageIndex - Math.floor(maxPageNumbers / 2), totalPages - maxPageNumbers))
    return Array.from({ length: Math.min(maxPageNumbers, totalPages) }, (_, i) => i + startPage)
  }, [pagination.pageIndex, totalPages]) 

  const downloadFile = async () => {
    if (!selectionDetails?.downloadPath) return;
    
    const fileStream = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: selectionDetails.downloadPath })
    });

    console.log('fileStream: ' + JSON.stringify(fileStream));
    const fileBlob = await fileStream.blob();
    FileSaver.saveAs(fileBlob, selectionDetails.fileName);
  }

  const handleFileInputChange = (e:ChangeEvent<HTMLInputElement>) => {
    console.log('Handling file change ...');
    if (e.target.files?.length) {
      const newFiles = [...uploadFiles];
      Array.from(e.target.files).forEach((file:File) => {
        if (!newFiles.find(x => x.name === file.name)) {
          newFiles.push(file)
        }
      });
      setUploadFiles(newFiles);
      fileRequestEditInputEl.current!.value = ''; // reset hidden input
    }
  }

  const deleteFile = (file:File) => {
    setUploadFiles(uploadFiles.filter(x => x.name !== file.name));
  }

  const submitHandler = async () => {
    // TODO: Validate form

    if (!uploadFiles?.length) return;

    const formData = new FormData(fileRequestEditFormEl.current!);
    for (let i = 0; i < uploadFiles.length; i++) {
      formData[i ? 'append' : 'set']('files', uploadFiles[i]);
    }

    const response = await fetch('/api/request/upload', {
      method: 'POST',
      body: formData
    });

    if (response.status === 200) {
      requestEditModalCloseEl.current?.click();
      fileRequestEditFormEl.current?.reset();
    }

    console.log(JSON.stringify(response));
  }

  useEffect(() => {
    (async () => {
      const term = searchParams.get('q');
      setSearchTerm(term);
      let fileList = [] as IkmFile[];
      const groupsArray = [] as string[]
      currentUser?.userGroupRoles.map(groupItem => (
        groupsArray.push((groupItem as unknown as { group: { nCodeName: string } }).group.nCodeName)
      ))
      if (term) {
        fileList = await doSearch(decodeURI(term), groupsArray); //TODO: Add group, pull from contextAPI group obj
      }
      setFiles(fileList);
      console.log('Filesss:')
      console.log(fileList)
      // TODO: Update to x.group when available from search index
      setGroups(fileList.map(x => x.name.split('/').slice(0, -1).join('/')).filter((v, i, a) => {
        return i === a.indexOf(v);
      }));
    })();
  },[searchParams]);

  useEffect(() => {
    (async () => {
      const selectedRow = table.getSelectedRowModel().rows[0];
      if (!selectedRow) return;

      const details:any = await getSearchResultDetails(selectedRow.original);
      setSelectionDetails(details ? JSON.parse(details) : {});
      const documentData = JSON.parse(details)
      setDocumentId(documentData.documentId)
      const fileName = documentData.fileName[0]
      setGroupName(documentData.group)
      setFileType(documentData.fileType)
      setFolderName(documentData.folder)

      try {
        const response = await fetch('/api/recentlyviewed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            documentId,
            fileName,
            fileType,
            groupName,
            folderName
          })
        })
        if (!response.ok) {
          console.error('Failed to log recently viewed document:', await response.text())
        }
      } catch (error) {
          console.error('Error logging recently viewed document:', error)
      }
      try {
        const documentId = documentData.documentId
        const groupName = documentData.group
        const groupId = documentData.groupId
        const name = groupName.split(" - ")[1]
        const response = await fetch('/api/viewcount', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            documentId,
            groupName,
            name
          })
        })
        if (!response.ok) {
          console.error('Failed to increment view count:', await response.text())
        }
      } catch (error) {
        console.error('Error incrementing view count:', error)
      }
    })();
  }, [table.getSelectedRowModel().rows]);

  return (
    <div>
      {/* Search results view */}
      <div className={`${styles.contentWrapper} ${showFullDetails ? 'hidden' : ''}`}>
        <div className={`content-pane ${styles.filtersPane}`}>
          {!!groups.length && <div className={styles.paneHeading}>{SearchResults.Filters}</div>}
          {!!groups.length && <div className={styles.paneHeading}>{SearchResults.Group}</div>}
          {groups.map((group, i) => (
            <div className="form-check" key={`group-filter-${i}`}>
              <input 
                type="checkbox" 
                id={`group-filter-${i}`} 
                name={`group-${i}`} 
                className={`${styles.formCheckbox} form-check-input`}
                checked={columnFilters.some(filter => filter.id === 'group' && (filter.value as string).split(',').includes(group))}
                onChange={() => handleGroupChange(group)} 
              />
              <label className={`form-check-label`} htmlFor={`group-filter-${i}`}>{group.toUpperCase()}</label>
            </div>
          ))}
          {!!groups.length && <div className={`${styles.paneHeading} ${styles.filterTitleAlign}`}>{SearchResults.FileTypes}</div>}
          {!!groups.length && <div>{FileTypes.map((fileType, i) => (
            <div className="form-check" key={`fileType-${i}`}>
              <input
                type="checkbox" 
                id={`fileType-filter-${i}`} 
                name={`fileType-${i}`}
                className={`${styles.formCheckbox} form-check-input`}
                checked={columnFilters.some(filter => filter.id === 'type' && (filter.value as string).split(',').includes(fileType.toLowerCase()))}
                onChange={() => handleFilterChange('type', fileType.toLowerCase())}
              />
              <label className={`form-check-label`} htmlFor={fileType}>{fileType.toUpperCase()}</label>
            </div>
          ))}</div>}
        </div>
        <div className={`content-pane ${styles.filesPane}`}>
          {!!groups.length && <><div className={styles.paneHeading}>{SearchResults.Files}</div>
          <table className={styles.fileTable}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} onClick={() => handleSort(header.id)} style={{ cursor: 'pointer' }}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {header.column.getIsSorted() === false ? <TiArrowUnsorted /> : ''}
                      {header.column.getIsSorted() === 'asc' ? <TiArrowSortedUp /> : ''}
                      {header.column.getIsSorted() === 'desc' ? <TiArrowSortedDown /> : ''}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className={row.getIsSelected() ? styles.selected : ''} onClick={row.getToggleSelectedHandler()}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} title={cell.getValue() as string}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.paginationButtonGroup}>
          <button
            className={styles.paginationArrowButton}
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <BsChevronDoubleLeft />
          </button>
          <button
            className={styles.paginationArrowButton}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <BsChevronLeft />
          </button>
          <div className={styles.paginationNumberButtonGroup}>
            {paginationNumbers.map(pageNumber => (
              <button
                key={pageNumber}
                onClick={() => table.setPageIndex(pageNumber)}
                className={pageNumber === pagination.pageIndex ? `${styles.paginationButton} ${styles.active}` : styles.paginationButton}
              >
                {pageNumber + 1}
              </button>
            ))}
          </div>
          <button
            className={styles.paginationArrowButton}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <BsChevronRight />
          </button>
          <button
            className={styles.paginationArrowButton}
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}
          >
            <BsChevronDoubleRight />
          </button>
          </div></>
          }
          <div className={`${styles.searching} ${(!searchTerm || files.length) ? styles.hidden : ''}`}>{SearchResults.Searching}</div>
        </div>
        <div className={styles.rightCol}>
          <div className={styles.smallSearch}>
            <Search />
          </div>
          <div className={`content-pane ${styles.detailsPane}`}>
            {table.getSelectedRowModel().rows.map(row => (
              <div key={row.id}>
                <div className={styles.fileName}>{selectionDetails?.fileName}</div>
                <div className={styles.actions}>
                  <div onClick={() => setShowFullDetails(true)}><FaFile className={styles.icon} /> {SearchResults.ViewDetails}</div>
                  <div onClick={downloadFile}><FaFileDownload className={styles.icon} onClick={downloadFile} /> {SearchResults.Download}</div>
                  <div className="hidden">{SearchResults.RequestAccess}</div>
                </div>
                <div className={styles.paneSection}>
                  <div>{SearchResults.ShortSummary}</div>
                  <p className="line-break-text">{selectionDetails?.shortSummary}</p>
                </div>
                <div className={styles.paneSection}>
                  <div>{SearchResults.Tags}</div>
                  <div className={styles.tag}>{row.original.name.split('/').slice(0, -1).join('/')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* File details view */}
      {table.getSelectedRowModel().rows.map(row => (
        <div key={`details-${row.id}`} className={!showFullDetails ? 'hidden' : ''}>
          <div className={styles.fileDetailsBackLink} onClick={() => setShowFullDetails(false)}><MdArrowBackIos /> {FileResults.BackToSearch}</div>
          <div className={`${styles.contentWrapper} ${styles.fileDetails}`}>
            <div className={`content-pane ${styles.leftPane}`}>
              <div className={styles.actions}>
                <div className={styles.fileName}>{selectionDetails?.fileName}</div>
                <div onClick={downloadFile}><FaFileDownload className={styles.icon} /> {FileResults.Download}</div>
              </div>
              <div className={styles.paneSection}>
                <div>{FileResults.ShortSummary}</div>
                <p className="line-break-text">{selectionDetails?.shortSummary}</p>
              </div>
              <div className={styles.paneSection}>
                <div>{FileResults.LongSummary}</div>
                <p className="line-break-text">{selectionDetails?.longSummary}</p>
              </div>
            </div>
            <div className={`content-pane ${styles.rightPane}`}>
              <div className={styles.actions}>
                <div data-bs-toggle="modal" data-bs-target="#requestEditModal"><FaEdit className={styles.icon} /> {FileResults.RequestEdits}</div>
                <div ref={requestEditModalEl} className="modal fade" id="requestEditModal" tabIndex={-1} aria-labelledby="requestEditModalLabel" aria-hidden="true">
                  <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h1 className="modal-title fs-5" id="requestEditModalLabel">Request Edits</h1>
                        <button ref={requestEditModalCloseEl} type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                        <form ref={fileRequestEditFormEl}>
                          <div className="mb-3">
                            <label htmlFor="requestEditTypeInput" className="form-label">Type of Change</label>
                            <div className={styles.fileSelectWrapper}>
                              <select id="requestEditTypeInput" name="requestEditTypeInput" className="form-select" defaultValue="" required>
                                <option value="">Select Option</option>
                                {RequestEditTypes.map((editType:any, i:number) =>(
                                  <option value={editType} key={`key-${i}`}>{editType}</option>
                                ))}
                              </select>
                              <button type="button" className="btn" onClick={() => fileRequestEditInputEl.current?.click()}><FaUpload size={14} />Attach</button>
                              <input ref={fileRequestEditInputEl} type="file" name="files" multiple={true} onChange={handleFileInputChange} className="hidden" required/>
                            </div>
                          </div>
                          <div className="mb-3">
                            <label htmlFor="justificationInput" className="form-label">Justification</label>
                            <textarea id="justificationInput" name="justification" className="form-control" placeholder="Write Justification Here" rows={3}></textarea>
                          </div>
                          {uploadFiles.map((file:File, i:number) => (
                            <div className={styles.file} key={`file-${i}`}>
                              <div className={styles.name}>{file.name}</div>
                              <FaTrash className={styles.trash} onClick={e => deleteFile(file)}/>
                              <div className="form-check">
                                <input type="checkbox" id={`pii-input-${i}`} name={`pii-${i}`} className="form-check-input" />
                                <label className={`form-check-label ${styles.piiLabel}`} htmlFor={`pii-input-${i}`}>This file contains PII/PHI</label>
                              </div>
                            </div>
                          ))}
                        </form>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-outline-dark" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" className="btn btn btn-primary" onClick={submitHandler}>Submit</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* <div>Updated: selectionDetails?.metadata_storage_last_modified</div> TODO: Uncomment once data is available */}
              <div className={styles.paneSection}>
                <div>{FileResults.Tags}</div>
                <div className={styles.tags}>
                  <div className={styles.tagRow}>
                    <div className={styles.tag}>{row.original.name.split('/').slice(0, -1).join('/')}</div>
                  </div>
                </div>
              </div>
              <div className={styles.paneSection}>
                <div>{FileResults.KeyPhrases}</div>
                <div className={styles.phrases}>{selectionDetails?.keyPhrases?.join(', ')}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
