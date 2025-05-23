import { useLocation } from 'wouter';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import React from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: DashboardIcon },
  { name: 'Invoices', href: '/invoices', icon: DescriptionIcon },
  { name: 'Clients', href: '/clients', icon: PeopleIcon },
  { name: 'Items', href: '/items', icon: InventoryIcon },
  { name: 'Reports', href: '/reports', icon: BarChartIcon },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

const drawerWidth = 240;

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { signOut, user } = useAuth();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
          invoiaiqpro
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {navigation.map((item, idx) => {
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <React.Fragment key={item.name}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={isActive}
                  onClick={() => setLocation(item.href)}
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: 'primary.50',
                      color: 'primary.main',
                      '& .MuiListItemIcon-root': {
                        color: 'primary.main',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? 'primary.main' : 'text.secondary',
                    }}
                  >
                    <item.icon />
                  </ListItemIcon>
                  <ListItemText primary={item.name} />
                </ListItemButton>
              </ListItem>
              {item.name === 'Settings' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1, mb: 1 }}>
                  <span
                    style={{
                      background: '#FF8906',
                      color: '#fff',
                      borderRadius: 8,
                      padding: '2px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      display: 'inline-block',
                    }}
                  >
                    Free
                  </span>
                  {/* Trial info and progress bar */}
                  {(() => {
                    // Hardcoded trial info for now
                    const trialDays = 30;
                    const trialStart = new Date('2024-06-01'); // TODO: Replace with real user data
                    const today = new Date();
                    const used = Math.max(1, Math.floor((today.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24)));
                    const left = Math.max(0, trialDays - used);
                    const percent = Math.min(100, Math.round((used / trialDays) * 100));
                    return (
                      <Box sx={{ width: '100%', mt: 1, px: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A1B2', mb: 0.5 }}>
                          <span>{used} days used</span>
                          <span>{left} days left</span>
                        </Box>
                        <Box sx={{ width: '100%', height: 8, background: '#2C2C30', borderRadius: 6, overflow: 'hidden', mb: 0.5 }}>
                          <Box sx={{ width: `${percent}%`, height: '100%', background: '#FF8906', transition: 'width 0.3s' }} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', fontSize: 10, color: '#FF8906', fontWeight: 600 }}>
                          Subscription plan
                        </Box>
                      </Box>
                    );
                  })()}
                </Box>
              )}
            </React.Fragment>
          );
        })}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={signOut}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
} 