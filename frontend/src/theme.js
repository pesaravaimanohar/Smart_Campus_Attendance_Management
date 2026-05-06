
export const getThemeOptions = (mode) => ({
    palette: {
        mode,
        ...(mode === 'light'
            ? {
                // Light Mode
                primary: {
                    main: '#4F46E5', // Indigo 600
                    light: '#818CF8',
                    dark: '#3730A3',
                    contrastText: '#ffffff',
                },
                secondary: {
                    main: '#7C3AED', // Violet 600
                    light: '#A78BFA',
                    dark: '#5B21B6',
                    contrastText: '#ffffff',
                },
                background: {
                    default: '#F8F9FC',  // Slightly blue-tinted gray
                    paper: '#FFFFFF',
                },
                text: {
                    primary: '#111827', // Gray 900
                    secondary: '#6B7280', // Gray 500
                },
            }
            : {
                // Dark Mode — Premium SaaS
                primary: {
                    main: '#6366F1', // Indigo 500
                    light: '#818CF8',
                    dark: '#4338CA',
                    contrastText: '#FFFFFF',
                },
                secondary: {
                    main: '#8B5CF6', // Violet 500
                    light: '#A78BFA',
                    dark: '#7C3AED',
                    contrastText: '#FFFFFF',
                },
                background: {
                    default: '#0B0F19',   // Deep Dark
                    paper: '#111827',     // Card Dark
                },
                text: {
                    primary: '#F1F5F9',  // Slate 100
                    secondary: '#94A3B8', // Slate 400
                },
            }),
        success: {
            main: mode === 'light' ? '#10B981' : '#22C55E',
            light: mode === 'light' ? '#D1FAE5' : '#064E3B',
        },
        warning: {
            main: mode === 'light' ? '#F59E0B' : '#F59E0B',
            light: mode === 'light' ? '#FEF3C7' : '#78350F',
        },
        error: {
            main: mode === 'light' ? '#EF4444' : '#EF4444',
            light: mode === 'light' ? '#FEE2E2' : '#7F1D1D',
        },
        info: {
            main: mode === 'light' ? '#3B82F6' : '#60A5FA',
            light: mode === 'light' ? '#DBEAFE' : '#1E3A5F',
        },
        divider: mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)',
    },
    typography: {
        fontFamily: '"Outfit", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        h1: { fontWeight: 800, letterSpacing: '-0.025em' },
        h2: { fontWeight: 800, letterSpacing: '-0.025em' },
        h3: { fontWeight: 700, letterSpacing: '-0.02em' },
        h4: { fontWeight: 700, letterSpacing: '-0.02em' },
        h5: { fontWeight: 600, letterSpacing: '-0.015em' },
        h6: { fontWeight: 600, letterSpacing: '-0.015em' },
        subtitle1: { fontWeight: 500 },
        subtitle2: { fontWeight: 500 },
        button: {
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: '0.01em',
        },
    },
    shape: {
        borderRadius: 16,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarColor: mode === 'dark' ? "#334155 #0B1121" : "#D1D5DB #F8F9FC",
                    "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
                        backgroundColor: mode === 'dark' ? "#0B1121" : "#F8F9FC",
                        width: 8,
                    },
                    "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
                        borderRadius: 8,
                        backgroundColor: mode === 'dark' ? "#334155" : "#D1D5DB",
                        minHeight: 24,
                        border: mode === 'dark' ? "2px solid #0B1121" : "2px solid #F8F9FC",
                    },
                    "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
                        backgroundColor: mode === 'dark' ? "#475569" : "#9CA3AF",
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    padding: '10px 24px',
                    boxShadow: 'none',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: mode === 'dark'
                            ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                            : '0 4px 12px rgba(0, 0, 0, 0.1)',
                    },
                    '&:active': {
                        transform: 'translateY(0)',
                    },
                },
                containedPrimary: {
                    background: mode === 'light'
                        ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
                        : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    boxShadow: mode === 'light'
                        ? '0 4px 6px -1px rgba(79, 70, 229, 0.3)'
                        : '0 4px 12px -1px rgba(99, 102, 241, 0.4)',
                    '&:hover': {
                        background: mode === 'light'
                            ? 'linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)'
                            : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                        boxShadow: mode === 'light'
                            ? '0 8px 16px -2px rgba(79, 70, 229, 0.4)'
                            : '0 8px 20px -2px rgba(99, 102, 241, 0.5)',
                    },
                },
                outlined: {
                    borderColor: mode === 'dark' ? 'rgba(255,255,255,0.12)' : undefined,
                    '&:hover': {
                        borderColor: mode === 'dark' ? 'rgba(255,255,255,0.2)' : undefined,
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    ...(mode === 'dark' && {
                        backgroundColor: 'rgba(19, 28, 49, 0.8)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                    })
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: mode === 'light'
                        ? '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)'
                        : '0 4px 16px rgba(0, 0, 0, 0.3)',
                    border: mode === 'light'
                        ? '1px solid rgba(0, 0, 0, 0.06)'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                    background: mode === 'dark'
                        ? 'linear-gradient(145deg, rgba(17, 24, 39, 0.9) 0%, rgba(11, 15, 25, 0.85) 100%)'
                        : '#FFFFFF',
                    backdropFilter: mode === 'dark' ? 'blur(12px)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                        backgroundColor: mode === 'light' ? '#F9FAFB' : 'rgba(15, 23, 42, 0.6)',
                        transition: 'all 0.2s ease',
                        '& fieldset': {
                            borderColor: mode === 'light' ? '#E5E7EB' : 'rgba(255, 255, 255, 0.08)',
                            transition: 'border-color 0.2s ease',
                        },
                        '&:hover fieldset': {
                            borderColor: mode === 'light' ? '#D1D5DB' : 'rgba(255, 255, 255, 0.15)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: mode === 'light' ? '#4F46E5' : '#818CF8',
                        },
                        '&.Mui-focused': {
                            boxShadow: mode === 'light'
                                ? '0 0 0 3px rgba(79, 70, 229, 0.1)'
                                : '0 0 0 3px rgba(129, 140, 248, 0.15)',
                        },
                    },
                    '& .MuiInputLabel-root': {
                        color: mode === 'dark' ? '#94A3B8' : undefined,
                    },
                    '& .MuiInputBase-input': {
                        color: mode === 'dark' ? '#F1F5F9' : undefined,
                    }
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    background: mode === 'light'
                        ? 'rgba(255,255,255,0.85)'
                        : 'rgba(11, 17, 33, 0.85)',
                    backdropFilter: 'blur(12px)',
                    color: mode === 'light' ? '#111827' : '#F1F5F9',
                    borderBottom: '1px solid',
                    borderColor: mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)',
                    boxShadow: mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
                }
            }
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: mode === 'light' ? '#FFFFFF' : '#0F172A',
                    borderRight: '1px solid',
                    borderColor: mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)',
                }
            }
        },
        MuiListItem: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        backgroundColor: mode === 'light'
                            ? 'rgba(0,0,0,0.03)'
                            : 'rgba(255,255,255,0.04)',
                    }
                }
            }
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: mode === 'dark'
                        ? '1px solid rgba(255, 255, 255, 0.05)'
                        : '1px solid rgba(0, 0, 0, 0.06)',
                },
                head: {
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: mode === 'dark' ? '#94A3B8' : '#6B7280',
                    backgroundColor: mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(0, 0, 0, 0.02)',
                }
            }
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    transition: 'background-color 0.15s ease',
                    '&:hover': {
                        backgroundColor: mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.03)'
                            : 'rgba(0, 0, 0, 0.02)',
                    },
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: mode === 'dark' ? '#1E293B' : '#FFFFFF',
                    backgroundImage: 'none',
                    border: mode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    boxShadow: mode === 'dark'
                        ? '0 24px 48px rgba(0,0,0,0.5)'
                        : '0 24px 48px rgba(0,0,0,0.15)',
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                    borderRadius: 8,
                },
                outlined: {
                    borderColor: mode === 'dark' ? 'rgba(255,255,255,0.12)' : undefined,
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                root: {
                    '& .MuiTabs-indicator': {
                        height: 3,
                        borderRadius: '3px 3px 0 0',
                    },
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                    textTransform: 'none',
                    minHeight: 48,
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    borderRadius: 8,
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    backgroundColor: mode === 'dark' ? '#334155' : '#1E293B',
                    backdropFilter: 'blur(8px)',
                },
            },
        },
        MuiLinearProgress: {
            styleOverrides: {
                root: {
                    borderRadius: 4,
                    height: 6,
                },
            },
        },
        MuiSelect: {
            styleOverrides: {
                outlined: {
                    backgroundColor: mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : undefined,
                },
            },
        },
    },
});
