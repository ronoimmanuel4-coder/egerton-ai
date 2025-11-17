import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Paper,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  MicOff as MuteIcon,
  PersonRemove as KickIcon,
  Security as AdminIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Timeline as TimelineIcon,
  Announcement as AnnouncementIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import ProphetPath from './ProphetPath';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`metaverse-admin-tabpanel-${index}`}
      aria-labelledby={`metaverse-admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const MetaverseAdminPanel = ({ token }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [message, setMessage] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [peers, setPeers] = useState([]);
  const [serverSettings, setServerSettings] = useState({
    maxUsers: 100,
    allowVoiceChat: true,
    allowTextChat: true,
    requireApproval: false,
    maintenanceMode: false
  });
  const { enqueueSnackbar } = useSnackbar();

  // Fetch connected peers
  const fetchPeers = async () => {
    try {
      const response = await axios.get('/api/metaverse/peers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPeers(response.data);
    } catch (error) {
      enqueueSnackbar('Failed to fetch peers', { variant: 'error' });
    }
  };

  // Fetch server settings
  const fetchServerSettings = async () => {
    try {
      const response = await axios.get('/api/metaverse/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServerSettings(response.data);
    } catch (error) {
      enqueueSnackbar('Failed to fetch server settings', { variant: 'error' });
    }
  };

  useEffect(() => {
    fetchPeers();
    fetchServerSettings();
    const interval = setInterval(fetchPeers, 10000); // Refresh peers every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSettingChange = async (setting, value) => {
    try {
      await axios.post('/api/metaverse/settings', 
        { [setting]: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setServerSettings(prev => ({ ...prev, [setting]: value }));
      enqueueSnackbar('Settings updated successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to update settings', { variant: 'error' });
    }
  };

  const handleMutePeer = async (peerId, mute) => {
    try {
      await axios.post(`/api/metaverse/peers/${peerId}/mute`, 
        { mute },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPeers(peers.map(p => 
        p.id === peerId ? { ...p, isMuted: mute } : p
      ));
      enqueueSnackbar(`User ${mute ? 'muted' : 'unmuted'} successfully`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to update user status', { variant: 'error' });
    }
  };

  const handleKickPeer = async (peerId) => {
    try {
      await axios.post(`/api/metaverse/peers/${peerId}/kick`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPeers(peers.filter(p => p.id !== peerId));
      enqueueSnackbar('User kicked successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to kick user', { variant: 'error' });
    }
  };

  const handleMakeAdmin = async (peerId) => {
    try {
      await axios.post(`/api/metaverse/peers/${peerId}/admin`, 
        { isAdmin: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPeers(peers.map(p => 
        p.id === peerId ? { ...p, isAdmin: true } : p
      ));
      enqueueSnackbar('User promoted to admin', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to update user role', { variant: 'error' });
    }
  };

  const handleBroadcast = async () => {
    if (!message.trim()) return;
    
    try {
      await axios.post('/api/metaverse/broadcast', 
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('');
      setOpenModal(false);
      enqueueSnackbar('Message broadcasted successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to broadcast message', { variant: 'error' });
    }
  };

  return (
    <Paper elevation={3} sx={{ width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<PeopleIcon />} label="Connected Users" />
          <Tab icon={<TimelineIcon />} label="Activity Timeline" />
          <Tab icon={<SettingsIcon />} label="Server Settings" />
          <Tab icon={<SecurityIcon />} label="Moderation" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Connected Users ({peers.length})</Typography>
          <Button 
            variant="contained" 
            startIcon={<AnnouncementIcon />}
            onClick={() => setOpenModal(true)}
          >
            Broadcast Message
          </Button>
        </Box>
        
        <List>
          {peers.map((peer) => (
            <ListItem 
              key={peer.id}
              secondaryAction={
                <Box>
                  <Tooltip title={peer.isMuted ? "Unmute" : "Mute"}>
                    <IconButton 
                      edge="end" 
                      onClick={() => handleMutePeer(peer.id, !peer.isMuted)}
                      color={peer.isMuted ? "error" : "default"}
                    >
                      <MuteIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Kick">
                    <IconButton 
                      edge="end" 
                      onClick={() => handleKickPeer(peer.id)}
                      color="error"
                    >
                      <KickIcon />
                    </IconButton>
                  </Tooltip>
                  {!peer.isAdmin && (
                    <Tooltip title="Make Admin">
                      <IconButton 
                        edge="end" 
                        onClick={() => handleMakeAdmin(peer.id)}
                        color="primary"
                      >
                        <AdminIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              }
            >
              <ListItemText 
                primary={peer.name || `User ${peer.id.substring(0, 6)}`}
                secondary={
                  <>
                    <span>ID: {peer.id}</span>
                    {peer.isAdmin && <>, <strong>Admin</strong></>}
                    {peer.isMuted && <>, <em>Muted</em></>}
                  </>
                } 
              />
            </ListItem>
          ))}
        </List>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Typography variant="h5" gutterBottom>Activity Timeline</Typography>
        <ProphetPath />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Typography variant="h5" gutterBottom>Server Settings</Typography>
        
        <Box component="form" sx={{ '& .MuiFormControl-root': { mb: 2 } }}>
          <FormControlLabel
            control={
              <Switch
                checked={serverSettings.allowVoiceChat}
                onChange={(e) => handleSettingChange('allowVoiceChat', e.target.checked)}
              />
            }
            label="Enable Voice Chat"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={serverSettings.allowTextChat}
                onChange={(e) => handleSettingChange('allowTextChat', e.target.checked)}
              />
            }
            label="Enable Text Chat"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={serverSettings.requireApproval}
                onChange={(e) => handleSettingChange('requireApproval', e.target.checked)}
              />
            }
            label="Require Admin Approval for New Users"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={serverSettings.maintenanceMode}
                onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                color="error"
              />
            }
            label="Maintenance Mode"
          />
          
          <TextField
            fullWidth
            label="Maximum Users"
            type="number"
            value={serverSettings.maxUsers}
            onChange={(e) => handleSettingChange('maxUsers', parseInt(e.target.value) || 0)}
            margin="normal"
            variant="outlined"
          />
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <Typography variant="h5" gutterBottom>Moderation Tools</Typography>
        <Typography paragraph>
          Additional moderation features will be available here, including:
        </Typography>
        <ul>
          <li>User ban management</li>
          <li>Chat moderation logs</li>
          <li>Reported content review</li>
          <li>Automated moderation rules</li>
        </ul>
      </TabPanel>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Broadcast Message to All Users
          <IconButton
            aria-label="close"
            onClick={() => setOpenModal(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Your Message"
            fullWidth
            variant="outlined"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            multiline
            rows={4}
            placeholder="Type your announcement here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button 
            onClick={handleBroadcast} 
            variant="contained"
            color="primary"
            disabled={!message.trim()}
          >
            Send Broadcast
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default MetaverseAdminPanel;
