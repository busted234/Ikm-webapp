'use client'

import { useEffect, useState, useMemo, useRef, ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import { FaEdit, FaFile, FaFileDownload, FaSearch } from "react-icons/fa";
import { BsChevronDoubleLeft, BsChevronDoubleRight, BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { TiArrowUnsorted, TiArrowSortedUp, TiArrowSortedDown } from "react-icons/ti";
import { MdArrowBackIos } from "react-icons/md";
import { FaUserMinus } from "react-icons/fa";
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { FaFolderClosed, FaFolderOpen } from "react-icons/fa6";
import { FaRegFilePdf, FaUpload, FaTrash } from "react-icons/fa";
import { IoIosAddCircle } from "react-icons/io";
import { MdOutlineStarBorder, MdOutlineStar } from "react-icons/md";

import ListSubheader from '@mui/material/ListSubheader';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import DraftsIcon from '@mui/icons-material/Drafts';
import SendIcon from '@mui/icons-material/Send';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import StarBorder from '@mui/icons-material/StarBorder';
import TopicIcon from '@mui/icons-material/Topic';
import Divider from '@mui/material/Divider';
import { IoFolderSharp } from "react-icons/io5";

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

import { AzureSearchQuery, type IkmFile } from "@/services/search.models";
import { getAllDocuments, searchFiles } from "@/services/search.service";
import { getSearchResultDetails } from "@/services/storage.service";
import { getUsersWithRolesAndGroups } from "@/services/db.service"

import { SearchResults, FileResults, FileTypes, RequestEditTypes } from '@/enums/search'
import { Groups } from '@/enums/usermeta'
import { alphanumericSortingFn } from '@/utils/datatable-utils'

import styles from "./page.module.scss";

export default function FilesManagement() {
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
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>()

  const fileRequestEditFormEl = useRef<HTMLFormElement>(null);
  const fileRequestEditInputEl = useRef<HTMLInputElement>(null);
  const requestEditModalEl = useRef<HTMLDivElement>(null);
  const requestEditModalCloseEl = useRef<HTMLButtonElement>(null);
  const newFolderFormEl = useRef<HTMLFormElement>(null);
  const newFolderModalEl = useRef<HTMLDivElement>(null);
  const newFolderModalCloseEl = useRef<HTMLButtonElement>(null);

  const removeUserFormEl = useRef<HTMLFormElement>(null);
  const removeUserModalEl = useRef<HTMLDivElement>(null);
  const removeUserModalCloseEl = useRef<HTMLButtonElement>(null);
  const editUserFormEl = useRef<HTMLFormElement>(null);
  const editUserModalEl = useRef<HTMLDivElement>(null);
  const editUserModalCloseEl = useRef<HTMLButtonElement>(null);


  const toggleFavorites = (fileName: string) => {
    setFavorites(prev => ({
      ...prev,
      [fileName]: !prev[fileName]
    }))
  }

  useEffect(() => {
    const fetchUsers = async () => {
      const allUsers = await getUsersWithRolesAndGroups()
      console.log('FETCH ALL USERS:', allUsers)
      setAllUsers(allUsers)
    }
    fetchUsers()
  }, [])

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'userName',
      header: 'User Name',
      sortingFn: alphanumericSortingFn,
      filterFn: 'includesString',
      cell: info => {
        return <div>
          <button className={styles.userIcon} data-bs-toggle="modal" data-bs-target="#removeUserModal"><FaUserMinus /></button>
          {(info as any).getValue()}
        </div>
      }
    },
    {
      accessorFn: x => {
        if (x.groups[0].roles === 'manager') {
            return 'Content Manager'
        } else {
            return 'Basic User'
        }
      },
      accessorKey: 'roles',
      header: 'Role',
      sortingFn: alphanumericSortingFn,
      filterFn: (row, columnId, filterValue) => {
        const cellValue = row.getValue<string>(columnId)
        return (filterValue as string).split(',').some(value => cellValue.includes(value))
      }
    },
    {
      accessorFn: x => { 
        return x.groups[0].groupName.split(' - ')[0]
      },
      accessorKey: '',
      header: 'Group',
      sortingFn: alphanumericSortingFn,
      filterFn: (row, columnId, filterValue) => {
        const cellValue = row.getValue<string>(columnId)
        return (filterValue as string).split(',').some(value => cellValue.includes(value))
      }
    },
    {
        accessorFn: x => { 
            const date = new Date(x.lastLogin)
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            })
            return formattedDate
        },
      accessorKey: 'lastLogin',
      header: 'Last Login',
      sortingFn: alphanumericSortingFn,
      filterFn: (row, columnId, filterValue) => {
        const cellValue = row.getValue<string>(columnId)
        return (filterValue as string).split(',').some(value => cellValue.includes(value))
      }
      /*cell: info => {
        if (info.getValue() === 'Strategic Competition') {
          return <div style={{ color: '#548235' }}>{(info as any).getValue()}</div>  
        } else {
          return <div style={{ color: '#002060' }}>{(info as any).getValue()}</div>
        }
      }*/
    }
  ];

  const table = useReactTable({
    columns,
    data: allUsers,
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
      columnFilters
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters
  });

  useEffect(() => {
    (async () => {
      const selectedRow = table.getSelectedRowModel().rows[0];
      if (!selectedRow) return;

      console.log('SELECTED ROW:', selectedRow.original)

      const updateUserRoles = (user:any) => {
        return {
            ...user,
            groups: user.groups.map((group:any) => {
                let updatedRole = group.roles

                if (group.roles === 'manager') {
                    updatedRole = 'Content Manager'
                } else if (group.roles === 'user') {
                    updatedRole = 'Basic User'
                }

                return {
                    ...group,
                    roles: updatedRole
                }
            })
        }
      }

      const updatedUser = updateUserRoles(selectedRow.original)

      setSelectedUser(updatedUser) 

      /*const details:any = await getSearchResultDetails(selectedRow.original);
      setSelectionDetails(details ? JSON.parse(details) : {});*/
    })();
  }, [table.getSelectedRowModel().rows]);

  const doSearch = async (searchTerm:string, groups:string[], documentId?:string[]) => {
    const searchQuery = new AzureSearchQuery();
    searchQuery.search = searchTerm;
    const files = await searchFiles(JSON.stringify(searchQuery), groups, documentId);
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

  const submitRemoveUserHandler = async () => {
    // TODO: Validate form

    /*if (!uploadFiles?.length) return;

    const formData = new FormData(fileUploadFormEl.current!);
    for (let i = 0; i < uploadFiles.length; i++) {
      formData[i ? 'append' : 'set']('files', uploadFiles[i]);
    }
    //TODO: Verify the following new code
    const activeUser: any = currentUser?.name
    formData.append('uploadedBy', activeUser)
    formData.append('uploadDate', new Date().toISOString())
    console.log('INSIDE UPLOAD FORM, formDate:')
    console.log(formData)

    const response = await fetch('/api/request/upload', {
      method: 'POST',
      body: formData
    });

    if (response.status === 200) {
      uploadModalCloseEl.current?.click();
      fileUploadFormEl.current?.reset();
    }

    console.log(JSON.stringify(response));*/
  }

  const submitEditUserHandler = async () => {
    // TODO: Validate form

    /*if (!uploadFiles?.length) return;

    const formData = new FormData(fileUploadFormEl.current!);
    for (let i = 0; i < uploadFiles.length; i++) {
      formData[i ? 'append' : 'set']('files', uploadFiles[i]);
    }
    //TODO: Verify the following new code
    const activeUser: any = currentUser?.name
    formData.append('uploadedBy', activeUser)
    formData.append('uploadDate', new Date().toISOString())
    console.log('INSIDE UPLOAD FORM, formDate:')
    console.log(formData)

    const response = await fetch('/api/request/upload', {
      method: 'POST',
      body: formData
    });

    if (response.status === 200) {
      uploadModalCloseEl.current?.click();
      fileUploadFormEl.current?.reset();
    }

    console.log(JSON.stringify(response));*/
  }

  /*useEffect(() => {
    (async () => {
      const term = searchParams.get('q');
      setSearchTerm(term);
      let fileList = [] as IkmFile[];
      if (term) {
        fileList = await doSearch(decodeURI(term), [], ''); //TODO: Add groups array from contextAPI, Add documentId to test
      }
      setFiles(fileList);
      console.log('Files:')
      console.log(fileList)
      // TODO: Update to x.group when available from search index
      setGroups(fileList.map(x => x.name.split('/').slice(0, -1).join('/')).filter((v, i, a) => {
        return i === a.indexOf(v);
      }));
    })();

  },[searchParams]);*/

  /*useEffect(() => {
    (async () => {
      const selectedRow = table.getSelectedRowModel().rows[0];
      if (!selectedRow) return;

      const details = await getSearchResultDetails(selectedRow.original);
      setSelectionDetails(details ? JSON.parse(details) : {});
    })();
  }, [table.getSelectedRowModel().rows]);*/


  interface SubMenuItem {
    id: string;
    name: string;
  }

  interface MenuItem {
    id: string;
    name: string;
    subItems: SubMenuItem[];
  }

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [open, setOpen] = useState<{ [key: string]: boolean }>({})
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [newItemName, setNewItemName] = useState<string>('')

  /*useEffect(() => {
    (async () => {
      setMenuItems(menuData)
      const allDocs = await getAllDocuments()
      console.log('TEST ALL DOCS:', allDocs)
      setAllDocuments(allDocs)
    })
  }, [])*/

  const handleToggle = (id: string) => {
    setOpen((prevState) => ({
        ...prevState,
        [id]: !prevState[id]
    }))
  }

  const handleAddMainItem = (mainItemId: string) => {
    const newSubItem: MenuItem = {
        id: `main-${Date.now()}`,
        name: newItemName,
        subItems: []
    }
    setMenuItems(menuItems.map(item => 
        item.id === mainItemId
            ? { ...item, subItems: [...item.subItems, newSubItem] }
            : item
    ))
  }

  const handleEditItem = (id: string, name: string) => {
    setMenuItems(menuItems.map(item =>
        item.id === id
            ? { ...item, name }
            : { ...item, subItems: item.subItems.map(subItem =>
                subItem.id === id ? { ...subItem, name } : subItem
            )}
    ))
    setEditingItemId(null)
  }

  const handleDeleteItem = (id: string) => {
    setMenuItems(menuItems.filter(item => item.id).map(item => ({
        ...item,
        subItems: item.subItems.filter(subItem => subItem.id !== id)
    })))
  }

  const renderSelectedUserRoles = () => {
    selectedUser?.groups.map((group:any, index:any) => {
       //const groupItem = group
        if (group.roles === 'manager') {
            return <span key={index} className="line-break-text">Content Manager</span>
        } else {
            return <span key={index} className="line-break-text">Basic User</span>
        }  
  })
    
    
  }

  return (
    <div>
      {/* Search results view */}
      <div className={styles.contentWrapper}>
        <div className={`content-pane ${styles.filesPane}`}>
          <div className={styles.paneHeading}>USERS</div>
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
          </div>
          
          {/*<div className={`${styles.searching} ${(!searchTerm || files.length) ? styles.hidden : ''}`}>{SearchResults.Searching}</div>*/}
        </div>
        <div className={styles.rightCol}>
          <div className={styles.smallSearch}>
            <Search />
          </div>
          <div className={`content-pane ${styles.detailsPane}`}>
            {table.getSelectedRowModel().rows.map((row, index) => (
              <div key={row.id}>
                <div className={styles.fileName}>{selectionDetails?.fileName}</div>
                <div className={styles.actions}>
                  <div><button className={styles.editUserIcon} data-bs-toggle="modal" data-bs-target="#editUserModal"><FaEdit className={styles.icon} /> Edit User Details</button></div>
                  <div className="hidden">Edit User Details</div>
                </div>
                <div className={styles.paneSection}>
                  <div className={styles.userGroupItem}>
                    <div className={styles.userGroupTitle}>Name</div>
                    <p className="line-break-text">{selectedUser?.userName}</p>
                  </div>
                  <div className={styles.userGroupItem}>
                    <div className={styles.userGroupTitle}>Email</div>
                    <p className="line-break-text">{selectedUser?.email}</p>
                  </div>
                </div>
                <div className={`${styles.paneSection} ${styles.groupRoleWrapper}`}>
                    <div className={styles.userGroupItem}>
                        <div className={styles.userGroupTitle}>Group</div>
                        {selectedUser?.groups.map((group:any, index:any) => (
                            <span key={index} className="line-break-text">{group.nCode}</span>
                        ))}
                    </div>
                    <div className={styles.userGroupItem}>
                        <div className={styles.userGroupTitle}>Role</div>
                        {selectedUser?.groups.map((group:any, index:any) => (
                            <span key={index} className="line-break-text">{group.roles}</span>
                        ))}
                    </div>
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
                    <div className={styles.tag}>{/*row.original.name.split('/').slice(0, -1).join('/')*/}</div>
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
      <div ref={newFolderModalEl} className="modal fade" id="newFolderModal" tabIndex={-1} aria-labelledby="newFolderModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="newFolderModalLabel">New Folder</h1>
              <button ref={newFolderModalCloseEl} type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form ref={newFolderFormEl}>
                <div className="mb-3">
                  <label htmlFor="folderNameInput" className="form-label">Folder Name</label>
                  <input id="folderNameInput" name="name" className="form-control" />
                </div>
                <div className="mb-3">
                  <label htmlFor="groupAccessInput" className="form-label">Select Group for Folder</label>
                  <div className={styles.fileSelectWrapper}>
                    <select id="groupAccessInput" name="groupAccessInput" className="form-select" defaultValue="" required>
                      <option value="">Select</option>
                      {Groups.map((group:any, i:number) =>(
                        <option value={group} key={`key-${i}`}>{group}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="folderTypeInput" className="form-label">Folder Type</label>
                  <div className={styles.fileSelectWrapper}>
                    <select id="folderTypeInput" name="folderTypeInput" className="form-select" defaultValue="" required>
                      <option value="">Select</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-dark" data-bs-dismiss="modal">Cancel</button>
              <button type="button" className="btn btn btn-primary" onClick={submitHandler}>Submit</button>
            </div>
          </div>
        </div>
    </div>
    <div ref={removeUserModalEl} className="modal fade" id="removeUserModal" tabIndex={-1} aria-labelledby="removeUserModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="removeUserModalLabel">Remove User</h1>
              <button ref={removeUserModalCloseEl} type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <p>Please enter a justification to remove a user from the IKM System</p>
              <form ref={removeUserFormEl}>
                <div className="mb-3">
                  <label htmlFor="nameInput" className="form-label">Name</label>
                  <input id="nameInput" name="name" className="form-control" />
                </div>
                <div className="mb-3">
                  <label htmlFor="justificationAccessInput" className="form-label">Justification</label>
                  <textarea id="justificationAccessInput" name="justificationAccessInput" className="form-control" placeholder="Enter Justification Here" rows={3}></textarea>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-dark" data-bs-dismiss="modal">Cancel</button>
              <button type="button" className="btn btn btn-primary" onClick={submitRemoveUserHandler}>Submit</button>
            </div>
          </div>
        </div>
      </div>
      <div ref={editUserModalEl} className="modal fade" id="editUserModal" tabIndex={-1} aria-labelledby="editUserModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="editUserModalLabel">Edit User Details</h1>
              <button ref={editUserModalCloseEl} type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
             <form ref={editUserFormEl}>
                <div className="mb-3">
                  <label htmlFor="nameInput" className="form-label">Name</label>
                  <input id="nameInput" name="name" placeholder={selectedUser?.userName} className="form-control" />
                </div>
                <div className="mb-3">
                  <label htmlFor="justificationAccessInput" className="form-label">Justification</label>
                  <textarea id="justificationAccessInput" name="justificationAccessInput" className="form-control" placeholder="Enter Justification Here" rows={3}></textarea>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-dark" data-bs-dismiss="modal">Cancel</button>
              <button type="button" className="btn btn btn-primary" onClick={submitEditUserHandler}>Submit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
