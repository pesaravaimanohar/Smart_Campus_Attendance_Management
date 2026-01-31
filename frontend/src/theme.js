import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#0d47a1', // Deep Blue
        },
        secondary: {
            main: '#f50057', // Pink/Red for accents
        },
        background: {
            default: '#f4f6f8',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 700,
        },
        h5: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 500,
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: '8px 20px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0px 4px 10px rgba(0,0,0,0.1)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                elevation3: {
                    boxShadow: '0px 4px 20px rgba(0,0,0,0.05)',
                },
            },
        },
    },
});

export default theme;
