import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  School,
  Work,
  Dashboard,
  Logout,
  Home,
  Person,
  Analytics,
  Security,
  AssignmentTurnedIn,
  SupervisorAccount,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationCenter from '../Notifications/NotificationCenter';

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, hasAnyRole } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navigationItems = [
    { label: 'Dashboard', path: '/super-admin', icon: <Dashboard />, auth: true, roles: ['super_admin'] },
    { label: 'Institutions', path: '/super-admin#institutions', icon: <School />, auth: true, roles: ['super_admin'] },
    { label: 'User Management', path: '/super-admin#user-management', icon: <SupervisorAccount />, auth: true, roles: ['super_admin'] },
    { label: 'Content Approval', path: '/super-admin#content-approval', icon: <AssignmentTurnedIn />, auth: true, roles: ['super_admin'] },
    { label: 'Financial Analytics', path: '/super-admin#financial', icon: <Analytics />, auth: true, roles: ['super_admin'] },
    { label: 'System Health', path: '/super-admin#system-health', icon: <Security />, auth: true, roles: ['super_admin'] },
  ];

  const handleTabNavigation = (path) => {
    if (path.includes('#')) {
      // Handle tab navigation within super admin dashboard
      const [basePath, tabId] = path.split('#');
      if (location.pathname !== basePath) {
        navigate(basePath);
      }
      window.location.hash = `#${tabId}`;
      
      // Dispatch custom event to switch tabs
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('superAdminTabChange', { 
          detail: { tabId } 
        }));
      }, 100);
    } else {
      if (location.pathname !== path) {
        navigate(path);
      }
      window.location.hash = '#overview';
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('superAdminTabChange', {
          detail: { tabId: 'overview' }
        }));
      }, 100);
    }
  };

  const renderDesktopMenu = () => (
    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
      {navigationItems.map((item) => {
        if (item.auth && !isAuthenticated) return null;
        if (item.roles && !hasAnyRole(item.roles)) return null;

        const [basePath, hash] = item.path.split('#');
        const isActive = hash
          ? location.pathname === basePath && location.hash === `#${hash}`
          : location.pathname === item.path && (!location.hash || location.hash === '#overview' || location.hash === '');

        return (
          <Button
            key={item.path}
            color="inherit"
            onClick={() => handleTabNavigation(item.path)}
            sx={{
              position: 'relative',
              px: 2.5,
              py: 1,
              borderRadius: 3,
              transition: 'all 0.3s ease',
              background: isActive ? 'linear-gradient(120deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05))' : 'transparent',
              boxShadow: isActive ? '0 8px 20px rgba(124,77,255,0.35)' : 'none',
              '&::after': {
                content: '""',
                position: 'absolute',
                left: 12,
                right: 12,
                bottom: 6,
                height: 3,
                borderRadius: 999,
                background: 'linear-gradient(90deg, #ff4081, #7c4dff)',
                transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'center',
                transition: 'transform 0.35s ease',
              },
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.12)',
                boxShadow: '0 8px 20px rgba(124,77,255,0.25)',
              },
            }}
          >
            {item.label}
          </Button>
        );
      })}

      {isAuthenticated ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationCenter />
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main }}>
              {user?.firstName?.charAt(0) || user?.name?.charAt(0) || <AccountCircle />}
            </Avatar>
          </IconButton>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            onClick={() => navigate('/login')}
            variant="outlined"
            sx={{ borderColor: 'white', color: 'white' }}
          >
            Login
          </Button>
        </Box>
      )}
    </Box>
  );

  const renderMobileMenu = () => (
    <Drawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={handleMobileMenuToggle}
      sx={{
        '& .MuiDrawer-paper': {
          width: 250,
          bgcolor: theme.palette.primary.main,
          color: 'white',
        },
      }}
    >
      <List>
        {navigationItems.map((item) => {
          if (item.auth && !isAuthenticated) return null;
          if (item.roles && !hasAnyRole(item.roles)) return null;
          
          const isActive = item.path.includes('#') 
            ? location.pathname === '/super-admin' && location.hash === item.path.split('#')[1]
            : location.pathname === item.path;
          
          return (
            <ListItem
              button
              key={item.path}
              onClick={() => {
                handleTabNavigation(item.path);
                handleMobileMenuToggle();
              }}
              sx={{
                backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          );
        })}

        {isAuthenticated ? (
          <>
            <ListItem
              button
              onClick={() => {
                handleLogout();
                handleMobileMenuToggle();
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem
              button
              onClick={() => {
                navigate('/login');
                handleMobileMenuToggle();
              }}
            >
              <ListItemText primary="Login" />
            </ListItem>
          </>
        )}
      </List>
    </Drawer>
  );

  return (
    <>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: theme.palette.primary.main }}>
        <Toolbar>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
            onClick={() => navigate('/')}
          >
            <School sx={{ fontSize: 28 }} />
            EduVault
          </Typography>

          {isMobile ? (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMobileMenuToggle}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            renderDesktopMenu()
          )}
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
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
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Mobile Menu */}
      {renderMobileMenu()}
    </>
  );
};

export default Navbar;
