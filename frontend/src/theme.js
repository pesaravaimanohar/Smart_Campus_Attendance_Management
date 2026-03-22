
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
                    default: '#F3F4F6', // Cool Gray 100
                    paper: '#FFFFFF',
                },
                text: {
                    primary: '#111827', // Gray 900
                    secondary: '#4B5563', // Gray 600
                },
            }
            : {
                // Dark Mode - Richer, deeper colors
                primary: {
                    main: '#818CF8', // Indigo 400
                    light: '#A5B4FC',
                    dark: '#4338CA',
                    contrastText: '#0F172A',
                },
                secondary: {
                    main: '#A78BFA', // Violet 400
                    light: '#C4B5FD',
                    dark: '#7C3AED',
                    contrastText: '#0F172A',
                },
                background: {
                    default: '#0B1121', // Darker Slate/Navy for depth
                    paper: '#151E32',   // Slightly lighter Slate
                },
                text: {
                    primary: '#F8FAFC', // Slate 50
                    secondary: '#94A3B8', // Slate 400
                },
            }),
        success: {
            main: mode === 'light' ? '#10B981' : '#34D399',
        },
        warning: {
            main: mode === 'light' ? '#F59E0B' : '#FBBF24',
        },
        error: {
            main: mode === 'light' ? '#EF4444' : '#F87171',
        },
    },
    typography: {
        fontFamily: '"Outfit", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        h1: { fontWeight: 800, letterSpacing: '-0.025em' },
        h2: { fontWeight: 800, letterSpacing: '-0.025em' },
        h3: { fontWeight: 700, letterSpacing: '-0.025em' },
        h4: { fontWeight: 700, letterSpacing: '-0.025em' },
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
                    scrollbarColor: mode === 'dark' ? "#334155 #0B1121" : "#D1D5DB #F3F4F6",
                    "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
                        backgroundColor: mode === 'dark' ? "#0B1121" : "#F3F4F6",
                        width: 10,
                    },
                    "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
                        borderRadius: 8,
                        backgroundColor: mode === 'dark' ? "#334155" : "#D1D5DB",
                        minHeight: 24,
                        border: mode === 'dark' ? "2px solid #0B1121" : "2px solid #F3F4F6",
                    },
                    "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
                        backgroundColor: mode === 'dark' ? "#475569" : "#9CA3AF",
                    },
                    "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active": {
                        backgroundColor: mode === 'dark' ? "#475569" : "#9CA3AF",
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
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    },
                },
                containedPrimary: {
                    background: mode === 'light'
                        ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
                        : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    boxShadow: mode === 'light'
                        ? '0 4px 6px -1px rgba(79, 70, 229, 0.3)'
                        : '0 4px 12px -1px rgba(99, 102, 241, 0.5)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    ...(mode === 'dark' && {
                        backgroundColor: 'rgba(21, 30, 50, 0.7)', // Glassmorphism base
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                    })
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: mode === 'light'
                        ? '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                        : '0 8px 16px -4px rgba(0, 0, 0, 0.4)', // Deeper shadow for dark mode
                    border: mode === 'light'
                        ? '1px solid rgba(229, 231, 235, 0.5)'
                        : '1px solid rgba(255, 255, 255, 0.08)', // Subtle border
                    background: mode === 'dark'
                        ? 'linear-gradient(145deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%)' // Gradient card bg
                        : '#FFFFFF',
                    backdropFilter: mode === 'dark' ? 'blur(10px)' : 'none',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                        backgroundColor: mode === 'light' ? '#F9FAFB' : 'rgba(15, 23, 42, 0.6)',
                        '& fieldset': {
                            borderColor: mode === 'light' ? '#E5E7EB' : 'rgba(255, 255, 255, 0.1)',
                        },
                        '&:hover fieldset': {
                            borderColor: mode === 'light' ? '#D1D5DB' : 'rgba(255, 255, 255, 0.2)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: mode === 'light' ? '#4F46E5' : '#818CF8',
                        },
                    },
                    '& .MuiInputLabel-root': {
                        color: mode === 'dark' ? '#94A3B8' : undefined,
                    },
                    '& .MuiInputBase-input': {
                        color: mode === 'dark' ? '#F8FAFC' : undefined,
                    }
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    background: mode === 'light'
                        ? 'rgba(255,255,255,0.8)'
                        : 'linear-gradient(to right, rgba(11, 17, 33, 0.9), rgba(21, 30, 50, 0.9))',
                    backdropFilter: 'blur(12px)',
                    color: mode === 'light' ? '#111827' : '#F9FAFB',
                    borderBottom: '1px solid',
                    borderColor: mode === 'light' ? '#E5E7EB' : 'rgba(255,255,255,0.05)',
                    boxShadow: mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
                }
            }
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: mode === 'light' ? '#FFFFFF' : '#0B1121',
                    borderRight: '1px solid',
                    borderColor: mode === 'light' ? '#E5E7EB' : 'rgba(255,255,255,0.05)',
                }
            }
        },
        MuiListItem: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        backgroundColor: mode === 'light' ? '#F3F4F6' : 'rgba(255,255,255,0.05)',
                    }
                }
            }
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : undefined,
                },
                head: {
                    color: mode === 'dark' ? '#94A3B8' : undefined,
                }
            }
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: mode === 'dark' ? '#1E293B' : '#FFFFFF',
                    backgroundImage: 'none',
                    border: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                }
            }
        }
    },
});
