'use client'

import { useEffect, useCallback, useState, useRef } from "react";
import { signIn, signOut } from "next-auth/react";
import { useUserAuthenticationContext } from '@/context/UserAuthenticationContext'
import { useAuth } from '@/context/AuthContext'
import { FiLogOut } from "react-icons/fi";
import { FaEdit } from "react-icons/fa";

import { getCurrentUser } from "@/services/db.service";
import { RanksRoles } from '@/enums/usermeta'

import styles from "./page.module.scss";

interface Group {
  name: string;
}

interface UserGroupRole {
  group: Group;
}

interface CurrentUser {
  userGroupRoles: UserGroupRole[];
}

interface Props {
  currentUser: CurrentUser | null;
}

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const editPhoneNumberFormEl = useRef<HTMLFormElement>(null);
  const editPhoneNumberModalCloseEl = useRef<HTMLButtonElement>(null)
  const editDepartmentFormEl = useRef<HTMLFormElement>(null);
  const editDepartmentModalCloseEl = useRef<HTMLButtonElement>(null)
  const editPositionFormEl = useRef<HTMLFormElement>(null);
  const editPositionModalCloseEl = useRef<HTMLButtonElement>(null)
  const { selectedRole, userSession, currentUser } = useUserAuthenticationContext()
  //const { profile, groups, loading } = useAuth()

  const handleLogout = useCallback(async () => {
    const authenticate = userSession ? signOut({ callbackUrl: '/api/auth/logout'}) : signIn()
    return await authenticate 
  },[])

  useEffect(() => {
    (async () => {
      setUser(await getCurrentUser());
    })();
  },[]);

  return (
    <>
        <div className={styles.contentWrapper}>
            <div className={styles.profileGroup}>
                <div className={styles.profileHeaderGroup}>
                    <div className={styles.profileHeaderLeft}>
                        <h5>WELCOME COMMANDER CHRISTOPHER KENNEDY</h5>
                        <div>BUMED Director</div>
                        {selectedRole === 'manager' && (
                          <div>Content Manager Information. Content Manager selected</div>
                        )}
                        {selectedRole === 'user' && (
                          <div>Basic User Information. Basic User selected!</div>
                        )}
                        {/*<div>
                          Name: {profile?.displayName}<br/>
                          Email: {profile?.mail || profile?.userPrincipalName}<br/>
                          Username: {profile?.userPrincipalName}
                        </div>}
                        <div>
                          Groups:<br/>
                          {groups.length > 0 ? (
                            <ul>
                              {groups.map((group) => (
                                <li key={group.id}>{group.displayName}</li>
                              ))}
                            </ul>
                          ) : (
                            <p>No groups found</p>
                          )}
                        </div>*/}
                    </div>
                    <div className={styles.profileHeaderRight}>
                        <button onClick={handleLogout}><FiLogOut /> <span>LOG OUT</span></button>
                    </div>
                </div>
                <div className={styles.profileContentGroup}>
                    <div className={styles.profileContentTitle}>CONTACT INFORMATION</div>
                    <div className={styles.profileContentWrapper}>
                        <div className={styles.profileContentCell}>
                            <span className={styles.profileContentCellTitle}>Email</span>
                            <span>christopher.kennedy@kpmg.com</span>
                        </div>
                        <div className={styles.profileContentCell}>
                            <div className={styles.profileContentCellIconGroup}>
                                <span className={styles.profileContentCellTitle}>Phone Number</span>
                            </div>
                            <span>703-587-4477</span>
                        </div>
                    </div>
                    <div className={styles.profileContentWrapper}>
                        <div className={styles.profileContentCell}>
                            <div className={styles.profileContentCellIconGroup}>
                                <span className={styles.profileContentCellTitle}>Department</span>
                            </div>
                            <span>NavMed</span>
                        </div>
                        <div className={styles.profileContentCell}>
                            <span className={styles.profileContentCellTitle}>Job Type</span>
                            <span>Military</span>
                        </div>
                        <div className={styles.profileContentCell}>
                            <div className={styles.profileContentCellIconGroup}>
                                <span className={styles.profileContentCellTitle}>Position</span>
                            </div>
                            <span>Commander</span>
                        </div>
                    </div>
                </div>
                <div className={styles.profileContentGroup}>
                    <div className={styles.profileContentTitle}>GROUP INFORMATION</div>
                    <div className={styles.profileContentWrapper}>
                        <div className={`${styles.profileContentCell} ${styles.marginRight40}`}>
                            <span className={styles.profileContentCellTitle}>Group</span>
                            <span>MHQ/N1 - Total Force Manpower & Personnel/N12 - Manpower Plans & Business Policy</span>
                            <span>MHQ/N6 - Communication & Information Systems/N64 - ITACS</span>
                            <span>MOC/N2 - Medical Information & R&D/N21 - Joint Programs & Research Policy</span>
                        </div>
                        <div className={styles.profileContentCell}>
                            <div className={styles.profileContentCellIconGroup}>
                                <span className={styles.profileContentCellTitle}>Role</span><span>{/*<FaEdit />*/}</span>
                            </div>
                            <span>Basic Viewer</span>
                            <span>Administrator</span>
                            <span>Content Manager</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
  );
}
