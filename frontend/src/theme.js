import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        mode: 'light',
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
        success: {
            main: '#10B981', // Emerald 500
        },
        warning: {
            main: '#F59E0B', // Amber 500
        },
        error: {
            main: '#EF4444', // Red 500
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
        borderRadius: 16, // Softer, more modern corners
    },
    components: {
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
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
                elevation1: {
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                },
                elevation2: {
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                },
                elevation3: {
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                    border: '1px solid rgba(229, 231, 235, 0.5)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                        backgroundColor: '#F9FAFB',
                        '& fieldset': {
                            borderColor: '#E5E7EB',
                        },
                        '&:hover fieldset': {
                            borderColor: '#D1D5DB',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#4F46E5',
                        },
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 500,
                    borderRadius: 8,
                },
            },
        },
    },
});

export default theme;
