'use client'

import { useCallback, useState } from 'react'
import { signIn, signOut } from "next-auth/react";
import { useRouter } from 'next/navigation'
import { useUserAuthenticationContext } from '@/context/UserAuthenticationContext'
import { FaUserCircle } from 'react-icons/fa';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CachedIcon from '@mui/icons-material/Cached';
import Divider from '@mui/material/Divider';
import { IoPersonSharp } from "react-icons/io5";
import { FiLogOut } from "react-icons/fi";
import Badge from '@mui/material/Badge';
import MailIcon from '@mui/icons-material/Mail';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import styles from "./user-info.module.scss";
import Link from 'next/link';

export default function UserInfo() {
    const router = useRouter()
    const { userInfo, selectedRole, setSelectedRole, availableRoles, userSession, currentUser } = useUserAuthenticationContext()
    const [notificationAnchorEl, setNotificationAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [userAnchorEl, setUserAnchorEl] = useState<HTMLButtonElement | null>(null);

    //TODO : IMPLEMENT!!
    const handleLogout = useCallback(async () => {
       const authenticate = userSession ? signOut({ callbackUrl: '/api/auth/logout'}) : signIn()
       return await authenticate 
    },[])

    const handleUserProfile = () => {
        router.push('/profile')
    }
    
    const handleNotificationPopover = (event: React.MouseEvent<HTMLButtonElement>) => {
        setNotificationAnchorEl(event.currentTarget);
    };
    const handleNotificationClose = () => {
        setNotificationAnchorEl(null);
    };
    const notificationOpen = Boolean(notificationAnchorEl);
    const notificationId = notificationOpen ? 'simple-popover' : undefined;

    const handleUserPopover = (event: React.MouseEvent<HTMLButtonElement>) => {
        setUserAnchorEl(event.currentTarget);
    };
    const handleUserClose = () => {
        setUserAnchorEl(null);
    };
    const userOpen = Boolean(userAnchorEl);
    const userId = userOpen ? 'simple-popover' : undefined;

    return (
        <div className={styles.userInfoGroup}>
            <Badge sx={{ cursor: 'pointer' }} badgeContent={3} color="primary" aria-describedby={notificationId} onClick={handleNotificationPopover}>
                <NotificationsIcon sx={{ color: '#fff' }} />
            </Badge>
            <button className={styles.userInfoWrapper} aria-describedby={userId} onClick={handleUserPopover}>
                <FaUserCircle className={styles.userIcon} size="1.25rem" />
                <span className="user-name">{userInfo.name}</span>
            </button>
            <Popover
                id={notificationId}
                open={notificationOpen}
                anchorEl={notificationAnchorEl}
                onClose={handleNotificationClose}
                anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
                }}
            >
                <Typography sx={{ p: 2, width: '320px', fontSize: '0.875rem' }}>
                <div className={styles.popoverGroup}>
                    <div className={styles.popoverTitle}>Notifications (3)</div>
                    <div className={styles.notificationGroup}>
                        <span>Content change request from John Smith</span>
                        <span>Submitted 07/01/24</span>
                        <Link className={styles.notificationGroupLink} href={''}>View Request</Link>
                    </div>
                    <div className={styles.notificationGroup}>
                        <span>Content change request from Carl Jones</span>
                        <span>Submitted 07/01/24</span>
                        <Link className={styles.notificationGroupLink} href={''}>View Request</Link>
                    </div>
                    <div className={styles.notificationGroup}>
                        <span>New user request from Jessica Johns</span>
                        <span>Submitted 07/01/24</span>
                        <Link className={styles.notificationGroupLink} href={''}>View Request</Link>
                    </div>
                </div>
                </Typography>
            </Popover>
            <Popover
                id={userId}
                open={userOpen}
                anchorEl={userAnchorEl}
                onClose={handleUserClose}
                anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
                }}
            >
                <Typography sx={{ p: 1, fontSize: '0.875rem' }}>
                <div className={styles.popoverGroup}>
                    <div className={styles.userGroup}>
                        <button onClick={handleUserProfile}><IoPersonSharp /> <span>PROFILE</span></button>
                        <Divider sx={{ backgroundColor: '#495057', width: '100%' }} />
                        {availableRoles.map((role, index) => (
                            <div key={index}>
                                <button
                                className={selectedRole === role ? `${styles.selected}` : `${styles.notSelected}`}
                                key={index}
                                onClick={() => setSelectedRole(role)}
                                >
                                    <Link key={index} href="/"><CachedIcon sx={{ fontSize: '1rem' }} /> <span>{role === 'manager' ? 'Content Manager' : 'Basic User'}</span></Link>
                                </button>
                                <Divider sx={{ backgroundColor: '#495057', width: '100%' }} />
                            </div>
                        ))}
                        <button onClick={handleLogout}><FiLogOut /> <span>LOG OUT</span></button>
                    </div>
                </div>
                </Typography>
            </Popover>
        </div>
    )
}
