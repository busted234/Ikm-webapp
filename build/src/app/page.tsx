'use client'

import { ReactNode, useEffect, useState } from "react";
import { useUserAuthenticationContext } from '@/context/UserAuthenticationContext'
import { getCurrentUser, getRecentlyViewedDocuments, getAllRecentlyViewedDocuments, getRecommendedDocuments, getFavoriteDocuments } from "@/services/db.service";
import { getUploadRequests, getUserRequests, updateUploadRequest } from "@/services/db.service";
//import type { UploadRequest } from "@/services/db.service";
import {
  ColumnDef,
  RowData,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable
} from "@tanstack/react-table";
import styles from "./page.module.scss";
import { FaRegFilePdf } from "react-icons/fa";

/*interface RecentDocument {
  fileName: string;
}

interface RecommendedDocument {
  fileName: string;
}

interface FavoriteDocument {
  fileName: string;
}

interface RecentDocumentWrapper {
  document: RecentDocument;
}

interface RecommendedDocumentWrapper {
  document: RecommendedDocument;
}

interface FavoriteDocumentWrapper {
  document: FavoriteDocument;
}*/

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [recentDocs, setRecentDocs] = useState<any[]>([])
  const [recommendedDocs, setRecommendedDocs] = useState<any[]>([])
  const [favoriteDocs, setFavoriteDocs] = useState<any[]>([])
  const { currentUser, selectedRole } = useUserAuthenticationContext()

  const fetchRecentDocuments = async () => {
    try {
      if (!currentUser) {
        return null
      }
      const recentDocuments = await getRecentlyViewedDocuments(currentUser?.id)
      console.log('RECENT VIEWED:', recentDocuments)
      setRecentDocs(recentDocuments)
    } catch (error) {
      console.error('Failed to get recently viewed documents', error)
    }
  }

  const fetchRecommendedDocuments = async () => {
    try {
      const response = await fetch('/api/recommended', {
        method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
          })
      })
      if (response.ok) {
        const data = await response.json()
        console.log('RECOMMENDED DATA:', data)
        setRecommendedDocs(data)
      } else {
        console.error('Failed to fetch recommended documents')
      }
    } catch (error) {
      console.error('Error fetching recommended documents', error)
    }
  }

  const fetchFavoriteDocuments = async () => {
    try {
      if (!currentUser) {
        return null
      }

      const favoriteDocuments = await getFavoriteDocuments(currentUser?.id)
      console.log('FAVORITE DOCUMENTS:', favoriteDocuments)
      setFavoriteDocs(favoriteDocuments)
    } catch (error) {
      console.error('Failed to get favorite documents', error)
    }
  }

  useEffect(() => {
    (async () => {
      setUser(await getCurrentUser());
    })();
    fetchRecentDocuments()
    fetchRecommendedDocuments()
    fetchFavoriteDocuments()
  }, []);

  const accessRequestData = [
    {
      uploadedBy: 'Christopher Kennedy',
      requestType: 'New Group',
      date: '09/09/2024',
      status: 'Pending'
    },
    {
      uploadedBy: 'Christopher Kennedy',
      requestType: 'New Group',
      date: '09/09/2024',
      status: 'Pending'
    },
    {
      uploadedBy: 'Christopher Kennedy',
      requestType: 'New Access Level',
      date: '09/08/2024',
      status: 'Pending'
    },
    {
      uploadedBy: 'Christopher Kennedy',
      requestType: 'New Access Level',
      date: '09/07/2024',
      status: 'Pending'
    },
    {
      uploadedBy: 'Christopher Kennedy',
      requestType: 'New Access Level',
      date: '09/08/2024',
      status: 'Pending'
    },
    {
      uploadedBy: 'Christopher Kennedy',
      requestType: 'New Group',
      date: '09/09/2024',
      status: 'Pending'
    }
  ]

  const [requests, setRequests] = useState<any[]>([]);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [requestsType, setRequestsType] = useState('content');
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectionDetails, setSelectionDetails] = useState<any>(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState({});
  const [isRequestEditable, setIsRequestEditable] = useState(false);

  const columnsAccessRequests: ColumnDef<any>[] = [
    {
      accessorKey: 'uploadedBy',
      header: 'Name'
    },
    {
      accessorKey: 'requestType',
      header: 'Request Type'
    },
    {
      accessorKey: 'date',
      header: 'Date'
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: props => <span>{props.getValue() as ReactNode}</span>
    },
  ];

  const tableAccessRequests = useReactTable({
    columns: columnsAccessRequests,
    data: accessRequestData,
    enableMultiRowSelection: false,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    state: {
      pagination,
      rowSelection
    }
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'fileName',
      header: 'File Name'
    },
    {
      accessorFn: x => 'File Upload',// TODO: Make this dynamic
      header: 'Change Type'
    },
    {
      accessorFn: x=> {
        return (new Date(x.requestTime)).toLocaleDateString('en-US');
      },
      header: 'Date'
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: props => <span>{props.getValue() as ReactNode}</span>
    },
  ];

  const table = useReactTable({
    columns,
    data: requests,
    enableMultiRowSelection: false,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    state: {
      pagination,
      rowSelection
    }
  });

  const columnsRecentFiles: ColumnDef<any>[] = [
    {
      accessorKey: 'fileName',
      header: 'Name'
    },
    {
      accessorKey: 'fileType',
      header: 'File Type'
    },
    {
      accessorFn: x=> {
        return (new Date(x.viewedAt)).toLocaleDateString('en-US');
      },
      accessorKey: 'viewedAt',
      header: 'Updated On'
    },
    {
      accessorKey: 'uploadedBy',
      header: 'Uploaded By'
    },
    {
      accessorFn: x=> {
        return x.groupName.split(' - ')[0]
      },
      accessorKey: 'groupName',
      header: 'Group'
    },
    {
      accessorKey: 'folderName',
      header: 'Folder Name'
    }
  ];

  const tableRecentFiles = useReactTable({
    columns: columnsRecentFiles,
    data: recentFiles,
    enableMultiRowSelection: false,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    state: {
      pagination,
      rowSelection
    }
  });

  const loadRequests = async () => {
    if (!user) return;
    let requestList = [];
    //let requestList = [] as UploadRequest[];
    requestsType === 'user' && (requestList = await getUserRequests());
    requestsType === 'content' && (requestList = await getUploadRequests());
    //requestsType === 'access' && (requestList = await getAccessRequests()); // TODO: Implement

    const testUploadRequests = await getUploadRequests()
    console.log('UPLOAD REQUESTS:', testUploadRequests)

    const allRecentFiles = await getAllRecentlyViewedDocuments()
    setRecentFiles(allRecentFiles)

    setRequests(requestList);
    setLoadingRequests(false);
  }

  useEffect(() => {
    table.resetRowSelection(true);
    loadRequests();
  }, [user, requestsType]);

  useEffect(() => {
    (async () => {
      const selectedRow = table.getSelectedRowModel().rows[0];
      if (!selectedRow) return;
      setSelectionDetails(selectedRow.original);
      setIsRequestEditable(selectedRow.original?.requestedBy.email !== user.email && selectedRow.original?.status === 'pending');
    })();
  }, [table.getSelectedRowModel().rows]);

  return (
    <div className={styles.pageWrapper}>
        {selectedRole === 'user' && (
        <div className={styles.highlightsWrapper}>
        <div className={styles.filesHighlight}>
          <div className={styles.contentTitle}>RECENTLY VIEWED</div>
          <div className={styles.contentContainer}>
            {recentDocs.map((docWrapper, index) => <div key={`document-${index}`} className={styles.contentContainerItem}><FaRegFilePdf /> {docWrapper.fileName}</div>)}
          </div>
        </div>
        <div className={styles.filesHighlight}>
        <div className={styles.contentTitle}>RECOMMENDED</div>
        <div className={styles.contentContainer}>
            {recommendedDocs.map((recommendedDoc, index) => <div key={`document-${index}`} className={styles.contentContainerItem}><FaRegFilePdf /> {recommendedDoc.fileName}</div>)}
          </div>
        </div>
        <div className={styles.filesHighlight}>
        <div className={styles.contentTitle}>FAVORITES</div>
        <div className={styles.contentContainer}>
            {favoriteDocs.map((favDocWrapper, index) => <div key={`document-${index}`} className={styles.contentContainerItem}><FaRegFilePdf /> {favDocWrapper.fileName}</div>)}
          </div>
        </div>
        </div>
        )}
        {selectedRole === 'manager' && (
        <div className={styles.filesGroup}>
          <div className={styles.highlightsWrapper}>
          <div className={styles.filesHighlight}>
            <div className={styles.contentTitle}>ACCESS REQUESTS</div>
            <div className={styles.contentContainer}>
              <table className={styles.fileTable}>
              <thead>
                {tableAccessRequests.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {tableAccessRequests.getRowModel().rows.map(row => (
                  <tr key={row.id} className={row.getIsSelected() ? styles.selected : ''} onClick={row.getToggleSelectedHandler()}>
                    {row.getVisibleCells().map(cell => {
                      if (cell.column.columnDef.header?.toString().toLowerCase() === 'status') {
                        return (
                          <td key={cell.id} title={cell.getValue() as string}
                            className={`${styles.status} ${styles[cell.getValue() as string] || ''}`}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td> 
                        )
                      } else {
                        return (<td key={cell.id} title={cell.getValue() as string}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)
                      }
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          <div className={styles.filesHighlight}>
          <div className={styles.contentTitle}>CONTENT CHANGE REQUESTS</div>
          <div className={styles.contentContainer}>
          <table className={styles.fileTable}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className={row.getIsSelected() ? styles.selected : ''} onClick={row.getToggleSelectedHandler()}>
                  {row.getVisibleCells().map(cell => {
                    if (cell.column.columnDef.header?.toString().toLowerCase() === 'status') {
                      return (
                        <td key={cell.id} title={cell.getValue() as string}
                          className={`${styles.status} ${styles[cell.getValue() as string] || ''}`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td> 
                      )
                    } else {
                      return (<td key={cell.id} title={cell.getValue() as string}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)
                    }
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {/*<div className={`${styles.loading} ${!loadingRequests ? styles.hidden : ''}`}>Loading ...</div>*/}
            </div>
          </div>
          </div>
          <div className={`${styles.highlightsWrapper} ${styles.hightlightsAlign}`}>
            <div className={styles.filesHighlight}>
            <div className={styles.contentTitle}>RECENT FILES</div>
            <div className={styles.contentContainer}>
            <table className={styles.recentfileTable}>
            <thead>
              {tableRecentFiles.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {tableRecentFiles.getRowModel().rows.map(row => (
                <tr key={row.id} className={row.getIsSelected() ? styles.selected : ''} onClick={row.getToggleSelectedHandler()}>
                  {row.getVisibleCells().map(cell => {
                    if (cell.column.columnDef.header?.toString().toLowerCase() === 'status') {
                      return (
                        <td key={cell.id} title={cell.getValue() as string}
                          className={`${styles.status} ${styles[cell.getValue() as string] || ''}`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td> 
                      )
                    } else {
                      return (<td key={cell.id} title={cell.getValue() as string}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)
                    }
                  })}
                </tr>
              ))}
            </tbody>
          </table>
            </div>
            </div>
          </div>
        </div>
        )}
    </div>
  );
}
