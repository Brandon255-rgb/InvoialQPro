import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'wouter';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/icons-material/Search';

export default function Header() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleClose();
    setLocation('/settings');
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Centered Global Invoice Search Bar */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ position: 'relative', width: 360 }}>
            <SearchIcon sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'text.disabled' }} />
            <input
              type="text"
              placeholder="Search invoices..."
              style={{
                width: '100%',
                padding: '6px 8px 6px 32px',
                borderRadius: 6,
                border: '1px solid #E5E7EB',
                background: '#1A1A1E',
                color: '#E5E7EB',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </Box>
        </Box>
        {/* Profile/Avatar section at right */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>
          <IconButton
            onClick={handleMenu}
            size="small"
            sx={{ ml: 2 }}
            aria-controls="menu-appbar"
            aria-haspopup="true"
          >
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleProfile}>Your Profile</MenuItem>
            <MenuItem onClick={handleProfile}>Settings</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
} 