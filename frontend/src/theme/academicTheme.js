// Design System Configuration
// Academic ERP Theme - Modern University Management
export const academicTheme = {
    // Brand Colors
    colors: {
        // Primary - Deep Blue
        primary: {
            main: '#1E3A8A',
            light: '#3B82F6',
            dark: '#1E40AF',
            contrast: '#FFFFFF',
        },
        // Accent - Teal/Green
        accent: {
            main: '#10B981',
            light: '#34D399',
            dark: '#059669',
        },
        // Status Colors
        warning: {
            main: '#F59E0B',
            light: '#FCD34D',
            dark: '#D97706',
        },
        error: {
            main: '#EF4444',
            light: '#F87171',
            dark: '#DC2626',
        },
        success: {
            main: '#10B981',
            light: '#34D399',
            dark: '#059669',
        },
        info: {
            main: '#3B82F6',
            light: '#60A5FA',
            dark: '#2563EB',
        },
        // Neutrals
        grey: {
            50: '#F9FAFB',
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#9CA3AF',
            500: '#6B7280',
            600: '#4B5563',
            700: '#374151',
            800: '#1F2937',
            900: '#111827',
        },
        // Backgrounds
        background: {
            default: '#F9FAFB', // grey.50
            paper: '#FFFFFF',
            elevated: '#FFFFFF',
        },
    },

    // Typography
    typography: {
        // Font Families
        fontFamily: {
            heading: "'Inter', 'Poppins', sans-serif",
            body: "'Inter', 'Roboto', sans-serif",
            mono: "'JetBrains Mono', 'Courier New', monospace",
        },
        // Font Sizes
        fontSize: {
            xs: '0.75rem',    // 12px
            sm: '0.875rem',   // 14px
            base: '1rem',     // 16px
            lg: '1.125rem',   // 18px
            xl: '1.25rem',    // 20px
            '2xl': '1.5rem',  // 24px
            '3xl': '1.875rem', // 30px
            '4xl': '2.25rem',  // 36px
            '5xl': '3rem',     // 48px
        },
        // Font Weights
        fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            extrabold: 800,
        },
    },

    // Spacing (8px base)
    spacing: {
        0: '0',
        1: '0.25rem',  // 4px
        2: '0.5rem',   // 8px
        3: '0.75rem',  // 12px
        4: '1rem',     // 16px
        5: '1.25rem',  // 20px
        6: '1.5rem',   // 24px
        8: '2rem',     // 32px
        10: '2.5rem',  // 40px
        12: '3rem',    // 48px
        16: '4rem',    // 64px
        20: '5rem',    // 80px
    },

    // Border Radius
    borderRadius: {
        none: '0',
        sm: '0.25rem',   // 4px
        base: '0.5rem',  // 8px
        md: '0.75rem',   // 12px
        lg: '1rem',      // 16px
        xl: '1.5rem',    // 24px
        full: '9999px',
    },

    // Shadows
    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },

    // Transitions
    transitions: {
        fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
        base: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
        slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
    },

    // Layout
    layout: {
        sidebarWidth: '280px',
        sidebarCollapsedWidth: '72px',
        headerHeight: '64px',
        maxContentWidth: '1440px',
    },

    // Z-Index Layers
    zIndex: {
        dropdown: 1000,
        sticky: 1020,
        fixed: 1030,
        modalBackdrop: 1040,
        modal: 1050,
        popover: 1060,
        tooltip: 1070,
    },
};

// MUI Theme Configuration
export const createMuiTheme = (mode = 'light') => ({
    palette: {
        mode,
        primary: {
            main: academicTheme.colors.primary.main,
            light: academicTheme.colors.primary.light,
            dark: academicTheme.colors.primary.dark,
            contrastText: academicTheme.colors.primary.contrast,
        },
        secondary: {
            main: academicTheme.colors.accent.main,
            light: academicTheme.colors.accent.light,
            dark: academicTheme.colors.accent.dark,
        },
        error: {
            main: academicTheme.colors.error.main,
            light: academicTheme.colors.error.light,
            dark: academicTheme.colors.error.dark,
        },
        warning: {
            main: academicTheme.colors.warning.main,
            light: academicTheme.colors.warning.light,
            dark: academicTheme.colors.warning.dark,
        },
        info: {
            main: academicTheme.colors.info.main,
            light: academicTheme.colors.info.light,
            dark: academicTheme.colors.info.dark,
        },
        success: {
            main: academicTheme.colors.success.main,
            light: academicTheme.colors.success.light,
            dark: academicTheme.colors.success.dark,
        },
        grey: academicTheme.colors.grey,
        background: {
            default: mode === 'light' ? academicTheme.colors.background.default : '#111827',
            paper: mode === 'light' ? academicTheme.colors.background.paper : '#1F2937',
        },
    },
    typography: {
        fontFamily: academicTheme.typography.fontFamily.body,
        h1: {
            fontFamily: academicTheme.typography.fontFamily.heading,
            fontSize: academicTheme.typography.fontSize['4xl'],
            fontWeight: academicTheme.typography.fontWeight.bold,
        },
        h2: {
            fontFamily: academicTheme.typography.fontFamily.heading,
            fontSize: academicTheme.typography.fontSize['3xl'],
            fontWeight: academicTheme.typography.fontWeight.semibold,
        },
        h3: {
            fontFamily: academicTheme.typography.fontFamily.heading,
            fontSize: academicTheme.typography.fontSize['2xl'],
            fontWeight: academicTheme.typography.fontWeight.semibold,
        },
        h4: {
            fontFamily: academicTheme.typography.fontFamily.heading,
            fontSize: academicTheme.typography.fontSize.xl,
            fontWeight: academicTheme.typography.fontWeight.medium,
        },
        h5: {
            fontFamily: academicTheme.typography.fontFamily.heading,
            fontSize: academicTheme.typography.fontSize.lg,
            fontWeight: academicTheme.typography.fontWeight.medium,
        },
        h6: {
            fontFamily: academicTheme.typography.fontFamily.heading,
            fontSize: academicTheme.typography.fontSize.base,
            fontWeight: academicTheme.typography.fontWeight.medium,
        },
        body1: {
            fontSize: academicTheme.typography.fontSize.base,
        },
        body2: {
            fontSize: academicTheme.typography.fontSize.sm,
        },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: academicTheme.typography.fontWeight.medium,
                    borderRadius: academicTheme.borderRadius.base,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: academicTheme.borderRadius.lg,
                    boxShadow: academicTheme.shadows.md,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: academicTheme.borderRadius.base,
                },
            },
        },
    },
});

export default academicTheme;
