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
    { label: 'Home', path: '/', icon: <Home />, public: true },
    { label: 'Resources', path: '/resources', icon: <School />, auth: true },
    { label: 'Jobs', path: '/jobs', icon: <Work />, auth: true },
  ];

  const resourceItems = [
    { label: 'Videos', path: '/admin/videos' },
    { label: 'Notes', path: '/admin/notes' },
    { label: 'CATs', path: '/admin/cats' },
    { label: 'Exams', path: '/admin/exams' }
  ];

  const adminItems = [
    { label: 'Admin Dashboard', path: '/admin', roles: ['mini_admin', 'super_admin'] },
    { label: 'Super Admin', path: '/super-admin', roles: ['super_admin'] },
  ];

  const renderDesktopMenu = () => (
    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
      {navigationItems.map((item) => {
        if (item.auth && !isAuthenticated) return null;
        if (!item.public && !item.auth && !isAuthenticated) return null;
        
        return (
          <Button
            key={item.path}
            color="inherit"
            onClick={() => navigate(item.path)}
            sx={{
              backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            {item.label}
          </Button>
        );
      })}

      {isAuthenticated && hasAnyRole(['mini_admin', 'super_admin']) && (
        <Button
          color="inherit"
          onClick={() => navigate(hasAnyRole(['super_admin']) ? '/super-admin' : '/admin')}
          sx={{
            backgroundColor: location.pathname.includes('admin') ? 'rgba(255,255,255,0.1)' : 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)',
            },
          }}
        >
          Dashboard
        </Button>
      )}

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
              {user?.firstName?.charAt(0) || <AccountCircle />}
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
          <Button
            onClick={() => navigate('/register')}
            variant="contained"
            sx={{ 
              bgcolor: theme.palette.secondary.main,
              '&:hover': { bgcolor: theme.palette.secondary.dark }
            }}
          >
            Register
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
          if (!item.public && !item.auth && !isAuthenticated) return null;
          
          return (
            <ListItem
              button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                handleMobileMenuToggle();
              }}
              sx={{
                backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          );
        })}

        {isAuthenticated && hasAnyRole(['mini_admin', 'super_admin']) && (
          <ListItem
            button
            onClick={() => {
              navigate(hasAnyRole(['super_admin']) ? '/super-admin' : '/admin');
              handleMobileMenuToggle();
            }}
            sx={{
              backgroundColor: location.pathname.includes('admin') ? 'rgba(255,255,255,0.1)' : 'transparent',
            }}
          >
            <ListItemIcon sx={{ color: 'white' }}>
              <Dashboard />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
        )}

        {isAuthenticated ? (
          <>
            <ListItem
              button
              onClick={() => {
                navigate('/profile');
                handleMobileMenuToggle();
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}>
                <Person />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItem>
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
            <ListItem
              button
              onClick={() => {
                navigate('/register');
                handleMobileMenuToggle();
              }}
            >
              <ListItemText primary="Register" />
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
        <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
          <Person sx={{ mr: 1 }} />
          Profile
        </MenuItem>
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
