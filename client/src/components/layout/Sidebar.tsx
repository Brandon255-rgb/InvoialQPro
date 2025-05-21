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
  const { logout } = useAuth();

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
        {navigation.map((item) => {
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <ListItem key={item.name} disablePadding>
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
          );
        })}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={logout}>
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