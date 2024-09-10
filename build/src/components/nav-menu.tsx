'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { FaTrash, FaUpload } from "react-icons/fa";
import { IoInformationCircle } from "react-icons/io5";
import { FaFileUpload } from "react-icons/fa";
import { BsPersonFillAdd } from "react-icons/bs";
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { v4 as uuidv4 } from 'uuid'

import { getCurrentUser, getGroups } from "@/services/db.service";
import { useUserAuthenticationContext } from '@/context/UserAuthenticationContext'
import { UserRoles, RanksRoles } from '@/enums/usermeta'

import styles from "./nav-menu.module.scss";

interface IGroups {
  id:string;
  name: string;
  nCode: string;
  nCodeName: string;
}

export default function NavMenu() {
  const pathname = usePathname();
  const { selectedRole, userSession, currentUser } = useUserAuthenticationContext()
  const [user, setUser] = useState<any>(null);
  const [groups, setGroups] = useState<IGroups[]>([])
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const fileUploadFormEl = useRef<HTMLFormElement>(null);
  const fileInputEl = useRef<HTMLInputElement>(null);
  const uploadModalEl = useRef<HTMLDivElement>(null);
  const uploadModalCloseEl = useRef<HTMLButtonElement>(null);
  const requestAccessFormEl = useRef<HTMLFormElement>(null);
  const requestAccessModalEl = useRef<HTMLDivElement>(null);
  const requestAccessModalCloseEl = useRef<HTMLButtonElement>(null);
  //const [userRole, setUserRole] = useState<string>('')

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
      fileInputEl.current!.value = ''; // reset hidden input
    }
  }

  const deleteFile = (file:File) => {
    setUploadFiles(uploadFiles.filter(x => x.name !== file.name));
  }

  const submitHandler = async () => {
    // TODO: Validate form

    if (!uploadFiles?.length) return;

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

    console.log(JSON.stringify(response));
  }

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const handlePopoverClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  //TODO: TESTING ONLY - Delete
  const Folders = [
    'COVID References',
    'Medicine R&D',
    'Policy, Regulations, Standards, and Definitions',
    'Navy Manuals, SOPs, and FMs'
  ]
  const handleMenuChange = () => {
    console.log('USER:')
    console.log(currentUser?.name)
    console.log('DATE:')
    console.log(Date())
    console.log('FORM DATA')
    console.log(new FormData(fileUploadFormEl.current!))
  }

  const userId = currentUser?.id

  useEffect(() => {
    (async () => {
      setUser(await getCurrentUser());
      setGroups(await getGroups(userId))
    })();
  }, []);

  useEffect(() => {
    uploadModalEl.current?.addEventListener('hidden.bs.modal', () => { setUploadFiles([]) });
  }, [uploadModalEl.current]);

  /*type linkObj = {
    path: string;
    label: string
  }
  let links:linkObj[] = []*/
  const managerLinks = [
    { path: '/', label: 'Home' },
    { path: '/files-management', label: 'File Management' },
    { path: '/search', label: 'Search' },
    { path: '/requests', label: 'Requests' },
    { path: '/users', label: 'Users' },
    { path: '/analytics', label: 'Analytics' }
  ]
  const userLinks = [
    { path: '/', label: 'Home' },
    { path: '/search', label: 'Search' },
    { path: '/requests', label: 'Requests' }
  ];

  /*useEffect(() => {
    if (selectedRole === 'manager') {
      links = [
        { path: '/', label: 'Home' },
        { path: '/files-management', label: 'File Management' },
        { path: '/search', label: 'Search' },
        { path: '/requests', label: 'Requests' },
        { path: '/users', label: 'Users' },
        { path: '/analytics', label: 'Analytics' }
      ];
    } else if (selectedRole === 'user') {
     
    }
  }, [])*/

  useEffect(() => {
    console.log('SELECTED ROLE:', selectedRole)
  }, [selectedRole])

  return (
    <nav className="header-menu">
      <ul className="main-nav">
        {selectedRole === 'manager' &&
           managerLinks.map((link, i) => (
            <li key={`header-link-${i}`} className={pathname === link.path ? 'active' : ''}><Link href={link.path}>{link.label}</Link></li>
          ))
        }
        {selectedRole === 'user' &&
           userLinks.map((link, i) => (
            <li key={`header-link-${i}`} className={pathname === link.path ? 'active' : ''}><Link href={link.path}>{link.label}</Link></li>
          ))
        }
      </ul>
      <ul className={`${styles.requestActions} request-actions`}>
        <li data-bs-toggle="modal" data-bs-target="#uploadRequestModal"><FaFileUpload className={`${styles.rightAlign} ${styles.uploadIcon}`} /> Upload File</li>
        <li data-bs-toggle="modal" data-bs-target="#requestAccessModal"><BsPersonFillAdd className={`${styles.rightAlign} ${styles.accessIcon}`} /> Request Access</li>
      </ul>
      <div ref={uploadModalEl} className="modal fade" id="uploadRequestModal" tabIndex={-1} aria-labelledby="uploadRequestModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="uploadRequestModalLabel">Upload File</h1>
              <button ref={uploadModalCloseEl} type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form ref={fileUploadFormEl}>
                <div className="mb-3">
                  <label htmlFor="group" className="form-label">Select Group to Upload File</label>
                  <div className={styles.fileSelectWrapper}>
                    <select id="group" name="group" onChange={handleMenuChange} className="form-select" defaultValue="" required>
                      <option value="">Select Option</option>
                      {groups.map((group:any, i:number) =>(
                        <option value={group.nCodeName} key={`key-${i}`}>{group.nCodeName}</option>
                      ))}
                    </select>
                    <button type="button" className="btn" onClick={() => fileInputEl.current?.click()}><FaUpload size={14} />Attach</button>
                    <input ref={fileInputEl} type="file" name="files" multiple={true} onChange={handleFileInputChange} className="hidden" required/>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="folder" className="form-label">Select Folder to Upload File (Optional)</label>
                  <select id="folder" name="folder" className="form-select" defaultValue="">
                    <option value="">Select Option</option>
                    {Folders.map((folder:any, i:number) =>(
                      <option value={folder} key={`key-${i}`}>{folder}</option>
                    ))}
                  </select>
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
      <div ref={requestAccessModalEl} className="modal fade" id="requestAccessModal" tabIndex={-1} aria-labelledby="requestAccessModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="uploadRequestModalLabel">Request Access</h1>
              <button ref={requestAccessModalCloseEl} type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form ref={requestAccessFormEl}>
                <div className="mb-3">
                  <label htmlFor="nameInput" className="form-label">Name</label>
                  <input id="nameInput" name="name" className="form-control" />
                </div>
                <div className="mb-3">
                  <label htmlFor="groupInput" className={`${styles.labelGroup} form-label`}>
                    <span className={styles.popoverIconContainer} aria-describedby={id} onClick={handlePopoverClick}><IoInformationCircle className={styles.popoverIcon} /></span><span>Requested Level of Access</span>
                    <Popover
                      id={id}
                      open={open}
                      anchorEl={anchorEl}
                      onClose={handleClose}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                      }}
                    >
                      <Typography sx={{ p: 2, width: '400px', fontSize: '0.875rem' }}>
                        <div className={styles.popoverGroup}>
                          <div className={styles.popoverTitle}>Roles</div>
                          <div className={styles.popoverSubtitle}>Basic Viewer</div>
                          <p>Basic Viewer Search and download documents, request edits to documents, request document uploads, and add files to favorites.</p>
                          <div className={styles.popoverSubtitle}>Content Manager</div>
                          <p>All basic viewer privileges plus upload documents and approve upload requests, edit documents and accept edit requests, move documents and create folders, approve user access to their group, and view analytics and reports for their group.</p>
                          <div className={styles.popoverSubtitle}>Administrator</div>
                          <p>All BV and CM privileges plus approve user access level requests, manage all users in the KM system, perform system updates, view reports and analytics for the system as a whole, and perform password resets.</p>
                        </div>
                      </Typography>
                    </Popover>
                  </label>
                  <div className={styles.fileSelectWrapper}>
                    <select id="requestAccessLevel" name="requestAccessLevel" className="form-select" defaultValue="" required>
                      <option value="">Select</option>
                      {UserRoles.map((userRole:any, i:number) =>(
                        <option value={userRole} key={`key-${i}`}>{userRole}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="groupAccessInput" className="form-label">Group</label>
                  <div className={styles.fileSelectWrapper}>
                    <select id="groupAccessInput" name="groupAccessInput" className="form-select" defaultValue="" required>
                      <option value="">Select</option>
                      {groups.map((group:any, i:number) =>(
                        <option value={group.nCodeName} key={`key-${i}`}>{group.nCodeName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="roleRankInput" className="form-label">Role and Rank</label>
                  <div className={styles.fileSelectWrapper}>
                    <select id="roleRankInput" name="roleRankInput" className="form-select" defaultValue="" required>
                      <option value="">Select</option>
                      {RanksRoles.map((rankRole:any, i:number) =>(
                        <option value={rankRole} key={`key-${i}`}>{rankRole}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="justificationAccessInput" className="form-label">Justification</label>
                  <textarea id="justificationAccessInput" name="justificationAccessInput" className="form-control" placeholder="Write Justification Here" rows={3}></textarea>
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
    </nav>
  );
}
