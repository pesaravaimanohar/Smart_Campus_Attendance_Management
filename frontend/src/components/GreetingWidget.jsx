import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';

const GreetingWidget = () => {
    const { user } = useAuth();

    // Get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // Get display name from JWT decoded data
    const getDisplayName = () => {
        // Combine firstName and lastName from JWT claims
        const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
        if (fullName) return fullName;
        if (user?.name) return user.name;
        if (user?.sub) return user.sub;
        if (user?.username) return user.username;
        return 'there';
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: alpha('#6366f1', 0.03),
            }}
        >
            <Typography variant="h5" fontWeight={700} gutterBottom>
                {getGreeting()}, {getDisplayName()} 👋
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Here's a quick look at your attendance and today's schedule.
            </Typography>
        </Paper>
    );
};

export default GreetingWidget;
