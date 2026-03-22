import React from 'react';
import { useTheme, styled } from '@mui/material/styles';
import { Box, Tooltip } from '@mui/material';
import { useColorMode } from '../context/ThemeContext';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';

const ToggleSwitch = styled('div')(({ theme }) => ({
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 68,
    height: 34,
    borderRadius: 50,
    padding: '4px',
    cursor: 'pointer',
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
    backdropFilter: 'blur(10px)',
    '&:hover': {
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
        boxShadow: `0 0 15px ${theme.palette.primary.main}40`,
    },
}));

const Knob = styled('div')(({ theme, mode }) => ({
    width: 26,
    height: 26,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mode === 'dark' ? '#1E293B' : '#FFFFFF',
    boxShadow: mode === 'dark'
        ? '0 2px 5px rgba(0,0,0,0.3)'
        : '0 2px 5px rgba(0,0,0,0.1)',
    position: 'absolute',
    left: mode === 'dark' ? '38px' : '4px',
    top: '3px',
    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring-like effect
    zIndex: 2,
}));

const IconWrapper = styled(Box)(({ theme, active }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    opacity: active ? 1 : 0.3,
    transform: active ? 'scale(1)' : 'scale(0.8)',
    transition: 'all 0.3s ease',
    color: active
        ? (theme.palette.mode === 'dark' ? '#FBBF24' : '#F59E0B') // Active colors
        : theme.palette.text.disabled,
}));

const ThemeToggle = () => {
    const theme = useTheme();
    const { toggleColorMode } = useColorMode();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Tooltip title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}>
            <ToggleSwitch onClick={toggleColorMode}>
                {/* Background Icons for Reference */}
                <Box position="absolute" left="8px" display="flex" alignItems="center">
                    <IconWrapper active={!isDark}>
                        <WbSunnyRoundedIcon sx={{ fontSize: 18 }} />
                    </IconWrapper>
                </Box>
                <Box position="absolute" right="8px" display="flex" alignItems="center">
                    <IconWrapper active={isDark}>
                        <DarkModeRoundedIcon sx={{ fontSize: 18 }} />
                    </IconWrapper>
                </Box>

                {/* Moving Knob */}
                <Knob mode={theme.palette.mode}>
                    {isDark ? (
                        <DarkModeRoundedIcon sx={{ fontSize: 16, color: '#FBBF24' }} />
                    ) : (
                        <WbSunnyRoundedIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
                    )}
                </Knob>
            </ToggleSwitch>
        </Tooltip>
    );
};

export default ThemeToggle;
