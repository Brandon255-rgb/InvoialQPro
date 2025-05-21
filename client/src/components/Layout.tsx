import { ReactNode } from 'react';
import { Box, Container } from '@mui/material';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Header />
        <Box component="main" sx={{ flex: 1, overflow: 'auto', py: 3 }}>
          <Container maxWidth="xl">
            {children}
          </Container>
        </Box>
      </Box>
    </Box>
  );
} 