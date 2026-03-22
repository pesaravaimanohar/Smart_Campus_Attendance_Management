import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Paper, Alert, Fade } from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import { changePassword } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ChangePassword = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!oldPassword) {
            setError('Current password is required');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await changePassword(oldPassword, password);
            setSuccess('Password changed successfully. Redirecting to login...');
            setTimeout(() => {
                logout(); // Logout to force re-login with new password/status
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
            }}
        >
            <Container component="main" maxWidth="xs">
                <Fade in timeout={800}>
                    <Paper
                        elevation={6}
                        sx={{
                            p: 4,
                            borderRadius: 4,
                            backdropFilter: 'blur(10px)',
                            background: 'rgba(255, 255, 255, 0.95)',
                            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
                        }}
                    >
                        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                            <Box
                                sx={{
                                    p: 2,
                                    bgcolor: '#e8eaf6',
                                    borderRadius: '50%',
                                    mb: 2,
                                    color: 'primary.main',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                }}
                            >
                                <LockResetIcon fontSize="large" color="inherit" />
                            </Box>
                            <Typography component="h1" variant="h5" fontWeight="800" color="#333">
                                Set New Password
                            </Typography>
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1, maxWidth: 280 }}>
                                Your security is important. Please enter your old password and define a new secure one.
                            </Typography>
                        </Box>

                        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
                        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

                        <Box component="form" onSubmit={handleSubmit} noValidate>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="oldPassword"
                                label="Current Password"
                                type="password"
                                id="oldPassword"
                                variant="outlined"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="New Password"
                                type="password"
                                id="password"
                                variant="outlined"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="confirmPassword"
                                label="Confirm New Password"
                                type="password"
                                id="confirmPassword"
                                variant="outlined"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                sx={{ mb: 3 }}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                size="large"
                                sx={{
                                    py: 1.5,
                                    fontWeight: 'bold',
                                    borderRadius: 3,
                                    bgcolor: 'primary.main',
                                    fontSize: '1rem',
                                    boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)'
                                }}
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </Button>
                        </Box>
                    </Paper>
                </Fade>
            </Container>
        </Box>
    );
};

export default ChangePassword;
