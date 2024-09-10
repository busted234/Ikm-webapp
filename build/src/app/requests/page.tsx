'use client'

import { ReactNode, useEffect, useRef, useState } from "react";
import { FaFileDownload } from "react-icons/fa";
import { IoWarningOutline } from "react-icons/io5";
import FileSaver from "file-saver";
import {
  ColumnDef,
  RowData,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable
} from "@tanstack/react-table";

import { moveApprovedFile } from "@/services/storage.service";
import { getCurrentUser, getUploadRequests, getUserRequests, updateUploadRequest } from "@/services/db.service";
//import type { UploadRequest } from "@/services/db.service";

import styles from "./page.module.scss";

export default function Requests() {
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsType, setRequestsType] = useState('content');
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectionDetails, setSelectionDetails] = useState<any>(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState({});
  const [isRequestEditable, setIsRequestEditable] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const columns: ColumnDef<any>[] = [
    {
      accessorFn: x => 'File Upload',// TODO: Make this dynamic
      header: 'Request Type'
    },
    {
      accessorKey: 'fileName',
      header: 'File Name'
    },
    {
      accessorKey: 'group.name',
      header: 'Group'
    },
    {
      accessorKey: 'requestedBy.name',
      header: 'Requested By'
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

  const downloadFile = async () => {
    if (!selectionDetails?.filePath) return;
    
    const fileStream = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'request', path: selectionDetails.filePath })
    });

    console.log('fileStream: ' + JSON.stringify(fileStream));
    const fileBlob = await fileStream.blob();
    FileSaver.saveAs(fileBlob, selectionDetails.fileName);
  }

  const loadRequests = async () => {
    if (!user) return;
    setLoadingRequests(true);
    let requestList = [];
    requestsType === 'user' && (requestList = await getUserRequests());
    requestsType === 'content' && (requestList = await getUploadRequests());
    //requestsType === 'access' && (requestList = await getAccessRequests()); // TODO: Implement
    setRequests(requestList);
    setLoadingRequests(false);
}

  const approveUpload = async () => {
    if (!selectionDetails) return;
    
    const fileMoved = await moveApprovedFile(selectionDetails.filePath, selectionDetails.filePath);
    console.log('File moved: ' + fileMoved);
    if (!fileMoved) return; // TODO: Handle failure
    
    await updateUploadRequest(selectionDetails.id, {
      status: 'approved',
      notes: notesRef.current?.value || ''
    });
    loadRequests(); // reload
  };

  const rejectUpload = async () => {
    if (!selectionDetails) return;
    await updateUploadRequest(selectionDetails.id, {
      status: 'rejected',
      notes: notesRef.current?.value || ''
    });
    loadRequests(); // reload
  };

  useEffect(() => {
    (async () => {
      setUser(await getCurrentUser());
    })();
  },[]);

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
    <div>
      <div className={styles.contentWrapper}>
        <div className={styles.filesPane}>
          <ul className={styles.requestsMenu}>
            <li className={requestsType === 'content' ? styles.active : ''} onClick={() => { setRequestsType('content')}}>Content Requests</li>
            <li className={styles.disabled}>Access Requests</li>
            <li className={requestsType === 'user' ? styles.active : ''} onClick={() => { setRequestsType('user')}}>My Requests</li>
          </ul>
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
          <div className={`${styles.loading} ${!loadingRequests ? styles.hidden : ''}`}>Loading ...</div>
        </div>
        <div className={styles.rightCol}>
          {table.getSelectedRowModel().rows.map(row => (
            <div key={row.id}>
              <div className={styles.fileName}>
                {selectionDetails?.fileName}
                { isRequestEditable && <button className={styles.downloadBtn}><FaFileDownload onClick={downloadFile} /></button> }
              </div>
              { selectionDetails?.pii && <div className={styles.piiNotice}><IoWarningOutline/> This file containes PII/PHI</div> }
              <div className={styles.justification}>
                <div>Justification</div>
                <p className="line-break-text">{selectionDetails?.justification}</p>
              </div>
              <div className={styles.notes}>
                <div>Notes from Content Manager</div>
                { !isRequestEditable && <p className="line-break-text">{selectionDetails?.notes}</p> }
                { isRequestEditable && <textarea ref={notesRef} name="notes" className="line-break-text" rows={5} defaultValue={selectionDetails?.notes}/> }
              </div>
              { isRequestEditable &&
                <div className={styles.actions}>
                  <button type="button" className="btn btn-primary" onClick={approveUpload}>Approve</button>
                  <button type="button" className="btn btn-primary" onClick={rejectUpload}>Reject</button>
                </div>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
