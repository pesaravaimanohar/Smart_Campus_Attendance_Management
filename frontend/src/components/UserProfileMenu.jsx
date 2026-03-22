import React, { useState, useRef } from 'react';
import {
    Box,
    Avatar,
    Typography,
    Menu,
    MenuItem,
    Divider,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
    Alert,
    Chip
} from '@mui/material';
import {
    Person as PersonIcon,
    CameraAlt as CameraAltIcon,
    Delete as DeleteIcon,
    Logout as LogoutIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { updateProfileImage, removeProfileImage } from '../services/api';
import { useAuth } from '../context/AuthContext';

const UserProfileMenu = ({ size = 40 }) => {
    const { user, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState(null);
    const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleOpenPhotoDialog = () => {
        setPhotoDialogOpen(true);
        handleClose();
    };

    const handleClosePhotoDialog = () => {
        setPhotoDialogOpen(false);
        setError('');
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            uploadPhoto(file);
        }
    };

    const uploadPhoto = async (file) => {
        // Validate file
        if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
            setError('Please upload a valid image (JPG, PNG, or WEBP)');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setError('Image size must be less than 2MB');
            return;
        }

        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            await updateProfileImage(formData);

            // Reload to get updated profile
            window.location.reload();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload profile picture');
        } finally {
            setUploading(false);
        }
    };

    const handleRemovePhoto = async () => {
        setUploading(true);
        setError('');

        try {
            await removeProfileImage();
            window.location.reload();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to remove profile picture');
        } finally {
            setUploading(false);
        }
    };

    // Get user initials for fallback avatar
    const getInitials = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
        }
        if (user?.firstName) {
            return user.firstName.charAt(0).toUpperCase();
        }
        if (user?.name) {
            const parts = user.name.split(' ');
            if (parts.length >= 2) {
                return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
            }
            return user.name.charAt(0).toUpperCase();
        }
        if (user?.username) {
            return user.username.charAt(0).toUpperCase();
        }
        return 'U';
    };

    // Get full name
    const getFullName = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        if (user?.firstName) {
            return user.firstName;
        }
        if (user?.name) {
            return user.name;
        }
        if (user?.username) {
            return user.username;
        }
        return 'User';
    };

    // Get role label
    const getRoleLabel = () => {
        const role = user?.role || 'USER';
        const roleMap = {
            'STUDENT': 'Student',
            'FACULTY': 'Faculty',
            'HOD': 'Head of Department',
            'ADMIN': 'Administrator',
            'SUPER_ADMIN': 'Super Administrator'
        };
        return roleMap[role] || role;
    };

    // Get role color
    const getRoleColor = () => {
        const role = user?.role || 'USER';
        const colorMap = {
            'STUDENT': 'primary',
            'FACULTY': 'secondary',
            'HOD': 'warning',
            'ADMIN': 'error',
            'SUPER_ADMIN': 'error'
        };
        return colorMap[role] || 'default';
    };

    return (
        <>
            <IconButton
                onClick={handleClick}
                size="small"
                sx={{ padding: 0 }}
                aria-controls={open ? 'profile-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
            >
                <Avatar
                    src={user?.profileImage || user?.profilePicture}
                    alt={getFullName()}
                    sx={{
                        width: size,
                        height: size,
                        bgcolor: 'primary.main',
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: 'background.paper',
                        boxShadow: 1,
                        transition: 'all 0.2s',
                        '&:hover': {
                            boxShadow: 3,
                            transform: 'scale(1.05)'
                        }
                    }}
                >
                    {getInitials()}
                </Avatar>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                id="profile-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                    elevation: 3,
                    sx: {
                        minWidth: 240,
                        overflow: 'visible',
                        mt: 1.5,
                        borderRadius: 2,
                        '& .MuiAvatar-root': {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {/* Profile Header */}
                <Box sx={{ px: 2, py: 2, bgcolor: alpha('#000', 0.02) }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                            src={user?.profileImage || user?.profilePicture}
                            sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}
                        >
                            {getInitials()}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" fontWeight={700} noWrap>
                                {getFullName()}
                            </Typography>
                            <Chip
                                label={getRoleLabel()}
                                size="small"
                                color={getRoleColor()}
                                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                            />
                        </Box>
                    </Box>
                    {user?.department && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            {user.department} {user?.yearLevel ? `• Year ${user.yearLevel}` : ''}
                        </Typography>
                    )}
                    {user?.username && (
                        <Typography variant="caption" color="text.secondary" display="block">
                            {user.username}
                        </Typography>
                    )}
                </Box>

                <Divider />

                {/* Menu Items */}
                <MenuItem onClick={handleOpenPhotoDialog} sx={{ py: 1.5 }}>
                    <CameraAltIcon fontSize="small" sx={{ mr: 1.5 }} />
                    Update Profile Picture
                </MenuItem>

                <Divider />

                <MenuItem onClick={logout} sx={{ py: 1.5, color: 'error.main' }}>
                    <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                    Logout
                </MenuItem>
            </Menu>

            {/* Photo Upload Dialog */}
            <Dialog
                open={photoDialogOpen}
                onClose={handleClosePhotoDialog}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Update Profile Picture</DialogTitle>
                <DialogContent>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Avatar
                            src={user?.profileImage || user?.profilePicture}
                            sx={{
                                width: 120,
                                height: 120,
                                mx: 'auto',
                                mb: 3,
                                bgcolor: 'primary.main',
                                fontSize: '3rem'
                            }}
                        >
                            {getInitials()}
                        </Avatar>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            style={{ display: 'none' }}
                        />

                        <Button
                            variant="contained"
                            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CameraAltIcon />}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            fullWidth
                            sx={{ mb: 1 }}
                        >
                            {uploading ? 'Uploading...' : 'Upload New Photo'}
                        </Button>

                        {(user?.profileImage || user?.profilePicture) && (
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={handleRemovePhoto}
                                disabled={uploading}
                                fullWidth
                            >
                                Remove Photo
                            </Button>
                        )}

                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                            JPG, PNG, or WEBP • Max 2MB
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClosePhotoDialog} disabled={uploading}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default UserProfileMenu;
