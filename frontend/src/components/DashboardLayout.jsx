import React, { useState } from 'react';
import {
    Box, Paper, Typography, Avatar, IconButton, Button, Divider,
    Drawer, useMediaQuery, Tooltip, Badge, Chip, InputBase
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
    Menu as MenuIcon,
    Logout as LogoutIcon,
    Search as SearchIcon,
    Notifications as NotificationsIcon,
    ChevronLeft as ChevronLeftIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import GlobalHeader from './GlobalHeader';
import ChangePasswordDialog from './ChangePasswordDialog';
import UserProfileMenu from './UserProfileMenu';

const SIDEBAR_WIDTH = 272;
const SIDEBAR_COLLAPSED = 72;

const DashboardLayout = ({
    children,
    title,
    subtitle,
    portalIcon,
    portalTitle,
    portalSubtitle,
    menuItems = [],
    activeSection,
    onSectionChange,
    notifications = 0,
    statusChip,
    headerActions,
}) => {
    const theme = useTheme();
    const { logout, user } = useAuth();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [openChangePassword, setOpenChangePassword] = useState(false);
    const isDark = theme.palette.mode === 'dark';

    const handleSectionClick = (id) => {
        onSectionChange?.(id);
        if (isMobile) setMobileOpen(false);
    };

    const SidebarContent = () => (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: isDark ? '#0B0F19' : 'background.paper',
            borderRight: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'divider',
        }}>
            {/* Portal Brand */}
            <Box sx={{
                p: 2.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                minHeight: 72,
            }}>
                <Box sx={{
                    width: 40, height: 40,
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                    flexShrink: 0,
                }}>
                    {portalIcon}
                </Box>
                <Box sx={{ overflow: 'hidden' }}>
                    <Typography variant="subtitle1" fontWeight={800} noWrap lineHeight={1.2} color="text.primary">
                        {portalTitle}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>
                        {portalSubtitle}
                    </Typography>
                </Box>
            </Box>

            {/* Navigation */}
            <Box sx={{ flexGrow: 1, py: 2, px: 1.5, overflow: 'auto' }}>
                {menuItems.map((item, idx) => {
                    if (item.divider) return <Divider key={`div-${idx}`} sx={{ my: 1.5, mx: 1 }} />;
                    if (item.label && item.isLabel) {
                        return (
                            <Typography
                                key={item.label}
                                variant="caption"
                                fontWeight={700}
                                color="text.secondary"
                                sx={{ px: 1.5, py: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}
                            >
                                {item.label}
                            </Typography>
                        );
                    }

                    const isActive = activeSection === item.id;
                    return (
                        <Box
                            key={item.id}
                            onClick={() => handleSectionClick(item.id)}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                p: 1.25,
                                px: 1.5,
                                mb: 0.5,
                                borderRadius: 2.5,
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                bgcolor: isActive
                                    ? isDark
                                        ? 'transparent'
                                        : alpha(theme.palette.primary.main, 0.08)
                                    : 'transparent',
                                background: isActive && isDark
                                    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.18)} 0%, ${alpha(theme.palette.secondary.main, 0.10)} 100%)`
                                    : undefined,
                                color: isActive ? 'primary.main' : 'text.secondary',
                                '&:hover': {
                                    bgcolor: isActive
                                        ? isDark
                                            ? alpha(theme.palette.primary.main, 0.22)
                                            : alpha(theme.palette.primary.main, 0.12)
                                        : alpha(theme.palette.text.primary, 0.04),
                                    transform: 'translateX(2px)',
                                },
                                ...(item.highlight && !isActive && {
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                    color: 'white',
                                    '&:hover': {
                                        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                                        transform: 'translateX(2px)',
                                    },
                                }),
                            }}
                        >
                            {isActive && (
                                <Box sx={{
                                    position: 'absolute',
                                    left: 0, top: '20%', bottom: '20%', width: 3,
                                    borderRadius: 4,
                                    bgcolor: 'primary.main',
                                    transition: 'all 0.2s ease',
                                }} />
                            )}
                            <Box sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                mr: 1.5, color: 'inherit', minWidth: 24,
                            }}>
                                {item.icon}
                            </Box>
                            <Typography
                                variant="body2"
                                fontWeight={isActive || item.highlight ? 700 : 500}
                                sx={{ flexGrow: 1 }}
                            >
                                {item.label}
                            </Typography>
                            {item.badge && (
                                <Chip
                                    label={item.badge}
                                    size="small"
                                    color={item.badgeColor || 'primary'}
                                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                                />
                            )}
                        </Box>
                    );
                })}
            </Box>

            {/* User Section */}
            <Box sx={{
                p: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: alpha(theme.palette.background.default, 0.5),
            }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                    <Avatar
                        sx={{
                            width: 40, height: 40,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: 'primary.main',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                        }}
                    >
                        {[user?.firstName, user?.lastName].filter(Boolean).map(n => n.charAt(0).toUpperCase()).join('') || (user?.sub || 'U').charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ overflow: 'hidden', flex: 1 }}>
                        <Typography variant="body2" fontWeight={700} noWrap color="text.primary">
                            {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.sub || user?.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {portalSubtitle}
                        </Typography>
                    </Box>
                </Box>
                <Box display="flex" gap={0.5}>
                    <Tooltip title="Change Password">
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setOpenChangePassword(true)}
                            sx={{
                                flex: 1, borderRadius: 2,
                                borderColor: alpha(theme.palette.divider, 0.5),
                                color: 'text.secondary',
                                fontSize: '0.75rem',
                                '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                            }}
                            startIcon={<SettingsIcon sx={{ fontSize: '0.9rem !important' }} />}
                        >
                            Settings
                        </Button>
                    </Tooltip>
                    <Tooltip title="Logout">
                        <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={logout}
                            sx={{
                                flex: 1, borderRadius: 2,
                                borderColor: alpha(theme.palette.error.main, 0.3),
                                fontSize: '0.75rem',
                                '&:hover': { borderColor: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.05) },
                            }}
                            startIcon={<LogoutIcon sx={{ fontSize: '0.9rem !important' }} />}
                        >
                            Logout
                        </Button>
                    </Tooltip>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
            <GlobalHeader />

            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                {/* Desktop Sidebar */}
                {!isMobile && (
                    <Box sx={{
                        width: sidebarOpen ? SIDEBAR_WIDTH : 0,
                        flexShrink: 0,
                        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        overflow: 'hidden',
                    }}>
                        <SidebarContent />
                    </Box>
                )}

                {/* Mobile Drawer */}
                <Drawer
                    anchor="left"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    PaperProps={{ sx: { width: SIDEBAR_WIDTH } }}
                    sx={{ display: { md: 'none' } }}
                >
                    <SidebarContent />
                </Drawer>

                {/* Main Content Area */}
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Content Header */}
                    <Box sx={{
                        px: { xs: 2, md: 3 },
                        py: 1.5,
                        bgcolor: 'background.paper',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1100,
                        minHeight: 56,
                        backdropFilter: 'blur(16px)',
                        backgroundColor: isDark
                            ? alpha('#0B0F19', 0.88)
                            : alpha(theme.palette.background.paper, 0.9),
                    }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <IconButton
                                onClick={() => isMobile ? setMobileOpen(true) : setSidebarOpen(!sidebarOpen)}
                                size="small"
                                sx={{
                                    color: 'text.secondary',
                                    '&:hover': { color: 'primary.main' },
                                }}
                            >
                                {sidebarOpen && !isMobile ? <ChevronLeftIcon /> : <MenuIcon />}
                            </IconButton>
                            <Box>
                                <Typography variant="h6" fontWeight={800} color="text.primary" lineHeight={1.3}>
                                    {title}
                                </Typography>
                                {subtitle && (
                                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                        {subtitle}
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1}>
                            {statusChip && (
                                <Chip
                                    label={statusChip.label}
                                    color={statusChip.color || 'success'}
                                    size="small"
                                    variant="outlined"
                                    sx={{ display: { xs: 'none', sm: 'flex' }, fontWeight: 600 }}
                                />
                            )}
                            {headerActions}
                            <IconButton size="small" sx={{ color: 'text.secondary' }}>
                                <Badge badgeContent={notifications} color="error">
                                    <NotificationsIcon fontSize="small" />
                                </Badge>
                            </IconButton>
                            <UserProfileMenu size={32} />
                        </Box>
                    </Box>

                    {/* Scrollable Content */}
                    <Box sx={{
                        flexGrow: 1,
                        overflow: 'auto',
                        p: { xs: 2, md: 3 },
                    }}>
                        {children}
                    </Box>
                </Box>
            </Box>

            <ChangePasswordDialog open={openChangePassword} onClose={() => setOpenChangePassword(false)} />
        </Box>
    );
};

export default DashboardLayout;
