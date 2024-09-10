'use client'

import { useEffect, useState, useMemo, useRef, ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import { FaEdit, FaFile, FaFileDownload, FaSearch } from "react-icons/fa";
import { BsChevronDoubleLeft, BsChevronDoubleRight, BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { TiArrowUnsorted, TiArrowSortedUp, TiArrowSortedDown } from "react-icons/ti";
import { MdArrowBackIos } from "react-icons/md";
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

import { SearchResults, FileResults, FileTypes, RequestEditTypes } from '@/enums/search'
import { Groups } from '@/enums/usermeta'
import { alphanumericSortingFn } from '@/utils/datatable-utils'

import styles from "./page.module.scss";

const menuData = [
    {
        id: '2414f9e4-2815-48f3-aa07-df5c5e65a508',
        name: 'N00 - Chief, BUMED',
        subItems: [
            {
                id: '7b37bf95-68fc-4866-be76-b0ec7388ece7',
                name: 'Covid References'
            },
            {
                id: 'a7450c80-4358-4972-a113-4c527aa6d2cd',
                name: 'Medicine R&D'
            },
            {
                id: '9828e3cd-99d2-4797-89f1-ddbb6d497517',
                name: 'Navy Manuals, SOPs, and FMs'
            },
            {
                id: '3d1e3fbb-1e7e-47c3-bd9e-4abbfad7eef7',
                name: 'Policies, Regulations, Standards, and Definitions'
            }
        ]
    },
    {
        id: '8165a2e2-96cc-43cd-a5b0-9ef11f70e593',
        name: 'N001 - EA',
        subItems: [
            {
                id: '18743a1a-aebc-473b-9f2e-35e8c1f7d4cc',
                name: 'Navy Manuals, SOPs, and FMs'
            },
            {
                id: '741af04e-f5e9-4859-8d8b-1aea797c5ae1',
                name: 'Policy, Regulations, Standards, and Definitions'
            },
            {
                id: '92cab5ed-c126-4cc0-99cf-11c5391d5320',
                name: 'Medicine R&D'
            },
            {
                id: 'a62ef42b-89dd-4167-9322-c46a202604d4',
                name: 'Covid References'
            }
        ]
    },
    {
        id: '2f4f8c55-befc-49ec-8f9e-5c00274c0ad2',
        name: 'N008 - FORCM',
        subItems: [
            {
                id: 'c7ce026a-c2be-4acb-b30f-d1f1af579e14',
                name: 'Medicine R&D'
            },
            {
                id: '4ab69797-f354-4fb5-a0ae-fe5a6f00d096',
                name: 'Covid References'
            },
            {
                id: '7e20d90d-9d3d-4fc8-8db2-7dabf02fdd2c',
                name: 'Policy, Regulations, Standards, and Definitions'
            },
            {
                id: 'e1476cb0-8be7-4b39-9fe4-e7b4d567a3ee',
                name: 'Navy Manuals, SOPs, and FMs'
            }
        ]
    },
    {
        id: '75696bec-7b70-4643-a6e8-d5f94358512e',
        name: 'N01 - Deputy Chief, BUMED',
        subItems: [
            {
                id: 'c42333a4-9b02-4566-8709-76824cd4f015',
                name: 'Policy, Regulations, Standards, and Definitions'
            },
            {
                id: '4644949e-52a7-405d-8e2d-6b3de31d146a',
                name: 'Navy Manuals, SOPs, and FMs'
            },
            {
                id: '5116f87a-aaa4-476b-a657-e6052a3dab83',
                name: 'Covid References'
            },
            {
                id: '75198d22-a1ed-4475-ba11-51476b0d4d9a',
                name: 'Medicine R&D'
            }
        ]
    },
    {
        id: '09a94c4d-549a-48c9-8f4f-878aecc8bb11',
        name: 'N01R - Vice Chief, Reserve Policy & Integration for BUMED',
        subItems: [
            {
                id: 'd66c33c8-9690-4d47-8940-5c74914ca6a3',
                name: 'Medicine R&D'
            },
            {
                id: 'e52fc96b-75f2-4f50-a707-c3f66bb38d01',
                name: 'Policy, Regulations, Standards, and Definitions'
            },
            {
                id: 'c9c9aa8b-66da-4999-9e24-fdcec7f8ddad',
                name: 'Covid References'
            },
            {
                id: 'b1e32b72-260c-41b7-91dc-21f641ecd278',
                name: 'Navy Manuals, SOPs, and FMs'
            }
        ]
    }
]

const FolderTypes = [
  'Public',
  'Private'
]

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
  const [allDocuments, setAllDocuments] = useState<any[]>([])
  const fileRequestEditFormEl = useRef<HTMLFormElement>(null);
  const fileRequestEditInputEl = useRef<HTMLInputElement>(null);
  const requestEditModalEl = useRef<HTMLDivElement>(null);
  const requestEditModalCloseEl = useRef<HTMLButtonElement>(null);
  const newFolderFormEl = useRef<HTMLFormElement>(null);
  const newFolderModalEl = useRef<HTMLDivElement>(null);
  const newFolderModalCloseEl = useRef<HTMLButtonElement>(null);


  const toggleFavorites = (fileName: string) => {
    setFavorites(prev => ({
      ...prev,
      [fileName]: !prev[fileName]
    }))
  }

  useEffect(() => {
    const fetchAllDocuments = async () => {
      setMenuItems(menuData)
      const docs = await getAllDocuments()
      console.log('FETCH ALL DOCUMENTS:', docs)
      setAllDocuments(docs)
    }
    fetchAllDocuments()
  }, [])

  const columns: ColumnDef<any>[] = [
    {
      accessorFn: x => x.file_name.split('/')[1],
      accessorKey: 'fileName',
      header: 'File Name',
      sortingFn: alphanumericSortingFn,
      filterFn: 'includesString',
      cell: info => {
        return <div>
          <input 
                type="checkbox" 
                className={`${styles.formCheckboxResults} form-check-input`} 
              />
          <FaRegFilePdf /> 
          {(info as any).getValue()}
        </div>
      }
    },
    {
      accessorKey: 'uploaded_by',
      header: 'Uploaded By',
      sortingFn: alphanumericSortingFn,
      filterFn: (row, columnId, filterValue) => {
        const cellValue = row.getValue<string>(columnId)
        return (filterValue as string).split(',').some(value => cellValue.includes(value))
      }
    },
    {
      accessorFn: x => x.upload_date.split(' ')[0],
      accessorKey: 'upload_date',
      header: 'Date',
      sortingFn: alphanumericSortingFn,
      filterFn: (row, columnId, filterValue) => {
        const cellValue = row.getValue<string>(columnId)
        return (filterValue as string).split(',').some(value => cellValue.includes(value))
      }
    },
    {
      accessorFn: x => x.group.split(' - ')[0],
      accessorKey: 'group',
      header: 'Group',
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
    data: allDocuments,
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

  useEffect(() => {
    (async () => {
      const term = searchParams.get('q');
      setSearchTerm(term);
      let fileList = [] as IkmFile[];
      if (term) {
        fileList = await doSearch(decodeURI(term), [], []); //TODO: Add groups array from contextAPI, Add documentId to test
      }
      setFiles(fileList);
      console.log('Files:')
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

      console.log('TEST:', selectedRow)

      const details = await getSearchResultDetails(selectedRow.original);
      setSelectionDetails(details ? JSON.parse(details) : {});
    })();
  }, [table.getSelectedRowModel().rows]);


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

  return (
    <div>
      {/* Search results view */}
      <div className={`${styles.contentWrapper} ${showFullDetails ? 'hidden' : ''}`}>
        <div className={`content-pane ${styles.filtersPane}`}>
          <div className={styles.leftPaneHeaderGroup}>
            <div className={`${styles.paneHeading} ${styles.paneHeadingTitle}`}>{SearchResults.Folders}</div>
            <div className={styles.addFolderGroup} data-bs-toggle="modal" data-bs-target="#newFolderModal"><IoIosAddCircle /> NEW FOLDER</div>
          </div>
          {/*!!groups.length && <div className={styles.paneHeading}>{SearchResults.Folders}</div>*/}
          {menuItems.map((item, i) => (
            <div className={styles.leftMenuGroup} key={`menu-item-${i}`}>
              {/*<input 
                type="checkbox" 
                id={`group-filter-${i}`} 
                name={`group-${i}`} 
                className={`${styles.formCheckbox} form-check-input`}
                checked={columnFilters.some(filter => filter.id === 'group' && (filter.value as string).split(',').includes(group))}
                onChange={() => handleGroupChange(group)} 
              />
              <label className={`form-check-label`} htmlFor={`group-filter-${i}`}>{group.toUpperCase()}</label>*/}
              <List
                sx={{ width: '100%', bgcolor: 'background.paper', minWidth: '300px', marginLeft: '-16px', fontSize: '0.8rem', fontWeight: 'bold', paddingBottom: 0, paddingTop: 0 }}
                component="nav"
                aria-labelledby="nested-list-subheader"
                >
                <ListItemButton sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', width: '100%' }} key={i} id={`menu-item-${i}`} onClick={() => handleToggle(item.id)}>
                    <div className={styles.expandGroupLeft}>
                        {open[item.id] ? <FaFolderOpen className={`${styles.folderIcon} ${styles.folderOpen}`} /> : <FaFolderClosed className={styles.folderIcon} />}
                        <label className={`form-check-label ${styles.menuItemName}`} htmlFor={`menu-item-${i}`}>{item.name.toUpperCase()}</label>
                    </div>
                    <div className={styles.expandGroupRight}>
                        {open[item.id] ? <ExpandLess /> : <ExpandMore />}
                    </div>
                </ListItemButton>
                <Collapse id={`submenu-${i}`} in={open[item.id]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {item.subItems.map((subItem) => (
                            <ListItemButton sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', width: '100%', pl: 4 }} key={subItem.id} id={`submenu-item-${i}`}>
                                <FaFolderClosed className={styles.folderIcon} />
                                <ListItemText className={styles.menuItemName} primary={subItem.name.toUpperCase()} />
                            </ListItemButton>
                        )) }
                    </List>
                </Collapse>
                </List>
                <Divider sx={{ borderColor: '#333', marginRight: '20px' }} />
            </div>
          ))}
        </div>
        <div className={`content-pane ${styles.filesPane}`}>
          <div className={styles.paneHeading}>{SearchResults.Files}</div>
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
                  <div className={styles.tag}>{/*row.original.file_name.split('/')[1]*/}</div>
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
                    <div className={styles.tag}>{/*row.original.file_name.split('/')[1]*/}</div>
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
                      {FolderTypes.map((type:any, i:number) =>(
                        <option value={type} key={`key-${i}`}>{type}</option>
                      ))}
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
    </div>
  );
}
