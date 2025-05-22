import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7F5AF0',
    },
    secondary: {
      main: '#FF8906',
    },
    background: {
      default: '#0F0F10',
      paper: '#1A1A1E',
    },
    text: {
      primary: '#E5E7EB',
      secondary: '#94A1B2',
    },
    success: {
      main: '#2CB67D',
    },
    warning: {
      main: '#F0A202',
    },
    error: {
      main: '#EF4565',
    },
    info: {
      main: '#2563eb',
    },
    divider: '#2C2C30',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '0.5rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '1rem',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
});

export default theme; 