import React from 'react';
import { Box, Typography, useTheme, useMediaQuery, Container } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import ThemeToggle from './ThemeToggle';

const GlobalHeader = ({ showToggle = true }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Box
            component="header"
            sx={{
                width: '100%',
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider',
                py: 1.5,
                position: 'sticky',
                top: 0,
                zIndex: 1200, // Higher than sidebar (usually 1100-1200)
                boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 2px 10px rgba(0,0,0,0.05)',
            }}
        >
            <Container maxWidth="xl" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            bgcolor: 'primary.main',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                        }}
                    >
                        <SchoolIcon />
                    </Box>
                    <Box>
                        <Typography
                            variant={isMobile ? "h6" : "h5"}
                            fontWeight="800"
                            sx={{
                                background: theme.palette.mode === 'dark'
                                    ? 'linear-gradient(135deg, #FFF 0%, #A5B4FC 100%)'
                                    : 'linear-gradient(135deg, #111827 0%, #4F46E5 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.5px'
                            }}
                        >
                            {isMobile ? "JNTUA CEA" : "JNTUA College of Engineering"}
                        </Typography>
                    </Box>
                </Box>

                {showToggle && (
                    <Box>
                        <ThemeToggle />
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default GlobalHeader;
