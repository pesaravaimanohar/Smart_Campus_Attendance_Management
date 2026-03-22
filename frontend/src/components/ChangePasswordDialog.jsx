import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Alert, useMediaQuery, useTheme,
    Box, LinearProgress, InputAdornment, IconButton
} from '@mui/material';
import { changePassword } from '../services/api';
import { LockReset, Visibility, VisibilityOff, Key } from '@mui/icons-material';

const ChangePasswordDialog = ({ open, onClose }) => {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Visibility toggles
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = async () => {
        setError('');
        setSuccess('');

        if (!oldPassword) {
            setError('Current password is required');
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await changePassword(oldPassword, newPassword);
            setSuccess('Password changed successfully.');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password. Check your current password.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return; // Prevent closing while loading
        setError('');
        setSuccess('');
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullScreen={fullScreen}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    backgroundImage: 'none',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }
            }}
        >
            <DialogTitle sx={{
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'primary.50',
                color: 'primary.main',
                py: 2
            }}>
                <Key /> Change Password
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

                <Box component="form" noValidate autoComplete="off" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        autoFocus
                        label="Current Password"
                        type={showOld ? "text" : "password"}
                        fullWidth
                        variant="outlined"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        disabled={loading}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowOld(!showOld)} edge="end">
                                        {showOld ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <TextField
                        label="New Password"
                        type={showNew ? "text" : "password"}
                        fullWidth
                        variant="outlined"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={loading}
                        helperText="Must be at least 6 characters"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowNew(!showNew)} edge="end">
                                        {showNew ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <TextField
                        label="Confirm New Password"
                        type={showConfirm ? "text" : "password"}
                        fullWidth
                        variant="outlined"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end">
                                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button onClick={handleClose} color="inherit" disabled={loading} size="large" sx={{ borderRadius: 2 }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    size="large"
                    startIcon={<LockReset />}
                    sx={{ borderRadius: 2, px: 3 }}
                >
                    Update Password
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ChangePasswordDialog;
