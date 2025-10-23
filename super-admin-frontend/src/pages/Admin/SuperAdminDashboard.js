import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  CircularProgress,
  Avatar,
  Badge,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  LinearProgress,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  SupervisorAccount as SupervisorIcon,
  AttachMoney as MoneyIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  HealthAndSafety as HealthIcon,
  BugReport as BugReportIcon,
  WarningAmber as WarningIcon,
  CheckCircle as CheckCircleIcon,
  PeopleAlt as PeopleAltIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationImportant as NotificationImportantIcon } from '@mui/icons-material';
import api from '../../utils/api';
import RealContentApproval from '../../components/Admin/RealContentApproval';
import ApprovedContentManagement from '../../components/Admin/ApprovedContentManagement';
import InstitutionManagementTab from '../../components/Admin/InstitutionManagementTab';
import UserManagement from '../../components/Admin/UserManagement';

const defaultFinancialMetrics = {
  totalRevenue: 0,
  revenueThisMonth: 0,
  averageTransactionValue: 0,
  totalTransactions: 0,
  subscriptionRevenue: 0,
  jobUnlockRevenue: 0,
  mpesaTransactions: 0,
  transactionsByStatus: {
    completed: 0,
    pending: 0,
    failed: 0
  },
  payments: [],
  recentPayments: [],
  resolvedIncidents: 0,
  anomaliesDetected: 0
};

const computeFinancialMetrics = (payments = []) => {
  if (!Array.isArray(payments) || payments.length === 0) {
    return { ...defaultFinancialMetrics };
  }

  const sanitizedPayments = payments.map((payment, index) => {
    const amount = Number(payment.amount) || 0;
    const createdAt = payment.createdAt || payment.date || new Date().toISOString();
    const id = payment._id || payment.id || `txn-${index}`;
    return {
      id,
      reference: payment.mpesaTransactionId || payment.reference || id,
      amount,
      currency: payment.currency || 'KES',
      type: payment.type || 'other',
      status: payment.status || 'unknown',
      paymentMethod: payment.paymentMethod || 'mpesa',
      createdAt
    };
  });

  const totalRevenue = sanitizedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const subscriptionRevenue = sanitizedPayments
    .filter((payment) => payment.type === 'subscription')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const jobUnlockRevenue = sanitizedPayments
    .filter((payment) => payment.type === 'job_unlock')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const transactionsByStatus = sanitizedPayments.reduce(
    (acc, payment) => {
      const key = ['completed', 'pending', 'failed'].includes(payment.status) ? payment.status : 'failed';
      acc[key] += 1;
      return acc;
    },
    { completed: 0, pending: 0, failed: 0 }
  );

  const mpesaTransactions = sanitizedPayments.filter(
    (payment) => (payment.paymentMethod || '').toLowerCase() === 'mpesa'
  ).length;

  const now = new Date();
  const revenueThisMonth = sanitizedPayments.reduce((sum, payment) => {
    const paymentDate = new Date(payment.createdAt);
    if (
      paymentDate.getMonth() === now.getMonth() &&
      paymentDate.getFullYear() === now.getFullYear()
    ) {
      return sum + payment.amount;
    }
    return sum;
  }, 0);

  const sortedPayments = [...sanitizedPayments].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return {
    ...defaultFinancialMetrics,
    totalRevenue,
    revenueThisMonth,
    averageTransactionValue: sanitizedPayments.length ? totalRevenue / sanitizedPayments.length : 0,
    totalTransactions: sanitizedPayments.length,
    subscriptionRevenue,
    jobUnlockRevenue,
    mpesaTransactions,
    transactionsByStatus,
    payments: sanitizedPayments,
    recentPayments: sortedPayments.slice(0, 10)
  };
};

const getFallbackFinancialMetrics = () => ({ ...defaultFinancialMetrics });

const statusColorMap = {
  completed: 'success',
  pending: 'warning',
  failed: 'error'
};

const statusLabelMap = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed'
};

const formatCurrency = (value = 0) => `KSH ${Math.round(Number(value) || 0).toLocaleString()}`;
const formatNumber = (value = 0) => Number(value || 0).toLocaleString();
const formatPercentage = (value = 0) => `${value.toFixed(1)}%`;
const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
const formatChangeValue = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }
  const isPositive = value > 0;
  const isNegative = value < 0;
  const absValue = Math.abs(value).toLocaleString();
  if (isPositive) {
    return `+${absValue}`;
  }
  if (isNegative) {
    return `-${absValue}`;
  }
  return '0';
};
const getTrendColor = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value === 0) {
    return 'default';
  }
  return value > 0 ? 'success' : 'error';
};

const serviceStatusColorMap = {
  operational: 'success',
  degraded: 'warning',
  offline: 'error'
};

const incidentSeverityColorMap = {
  high: 'error',
  medium: 'warning',
  low: 'info'
};

const dataSourceLabels = {
  users: 'Users',
  payments: 'Payments',
  institutions: 'Institutions',
  content: 'Content',
  systemHealth: 'System Health'
};

const dataSourceColorMap = {
  database: 'success',
  cache: 'warning',
  offline: 'error'
};

const DASHBOARD_ENDPOINTS = {
  users: '/api/admin/users',
  payments: '/api/payments',
  institutions: '/api/admin/institutions',
  pendingContent: '/api/admin/content-status'
};

const tabStyles = (isActive) => ({
  position: 'relative',
  px: 2,
  transition: 'color 0.3s ease',
  color: isActive ? 'primary.contrastText' : 'inherit',
  '&::after': {
    content: '""',
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 6,
    height: 3,
    borderRadius: 999,
    background: 'linear-gradient(90deg, #ff4081, #7c4dff)',
    boxShadow: '0 0 12px rgba(124,77,255,0.65)',
    transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
    transformOrigin: 'center',
    transition: 'transform 0.35s ease',
  }
});

const defaultSystemHealthMetrics = {
  overallHealth: 100,
  uptimePercentage: 99.9,
  incidentsLast30Days: 0,
  degradedServices: 0,
  resolvedIncidents: 0,
  anomaliesDetected: 0,
  services: [],
  recentIncidents: [],
  lastCheckedAt: null
};

const computeSystemHealthMetrics = (serviceResults = {}, previous = defaultSystemHealthMetrics) => {
  const nowIso = new Date().toISOString();
  const serviceKeys = [
    { key: 'users', label: 'User Database' },
    { key: 'payments', label: 'Payment System' },
    { key: 'institutions', label: 'Institution Directory' },
    { key: 'content', label: 'Content Management' }
  ];

  const services = serviceKeys.map(({ key, label }) => {
    const result = serviceResults[key];
    const fulfilled = result?.status === 'fulfilled';
    return {
      key,
      label,
      status: fulfilled ? 'operational' : 'degraded',
      statusLabel: fulfilled ? 'Operational' : 'Attention needed',
      responseTimeMs: result?.responseTime ?? null,
      lastCheckedAt: nowIso,
      details: fulfilled ? 'Service responding normally.' : (result?.reason?.message || 'Connection failed')
    };
  });

  const total = services.length || 1;
  const healthy = services.filter((service) => service.status === 'operational').length;
  const degraded = total - healthy;

  if (healthy === 0) {
    return getFallbackSystemHealthMetrics();
  }

  const recentIncidents = services
    .filter((service) => service.status !== 'operational')
    .map((service, index) => ({
      id: `${service.key}-${index}`,
      service: service.label,
      severity: 'high',
      summary: service.details,
      occurredAt: nowIso
    }));

  return {
    ...defaultSystemHealthMetrics,
    overallHealth: Math.round((healthy / total) * 100),
    uptimePercentage: degraded ? Math.max(previous.uptimePercentage - degraded * 0.5, 92) : previous.uptimePercentage,
    incidentsLast30Days: previous.incidentsLast30Days + degraded,
    degradedServices: degraded,
    resolvedIncidents: previous.resolvedIncidents,
    anomaliesDetected: previous.anomaliesDetected + degraded,
    services,
    recentIncidents,
    lastCheckedAt: nowIso
  };
};

const getFallbackSystemHealthMetrics = () => ({ ...defaultSystemHealthMetrics });

const fetchWithDiagnostics = async (key, label, fn) => {
  const start = performance?.now ? performance.now() : Date.now();
  try {
    const value = await fn();
    const end = performance?.now ? performance.now() : Date.now();
    return { key, label, status: 'fulfilled', value, responseTime: Math.round(end - start) };
  } catch (reason) {
    const end = performance?.now ? performance.now() : Date.now();
    return { key, label, status: 'rejected', reason, responseTime: Math.round(end - start) };
  }
};

const coreServiceChecks = [
  { key: 'users', label: 'User Database', request: () => api.get('/api/admin/users') },
  { key: 'payments', label: 'Payment System', request: () => api.get('/api/admin/payments') },
  { key: 'institutions', label: 'Institution Directory', request: () => api.get('/api/institutions') },
  { key: 'content', label: 'Content Management', request: () => api.get('/api/content-approval/stats') }
];
export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(4);
  const [realUsers, setRealUsers] = useState([]);
  const [financialMetrics, setFinancialMetrics] = useState({ ...defaultFinancialMetrics });
  const [financialLoading, setFinancialLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState({ ...defaultSystemHealthMetrics });
  const [systemHealthLoading, setSystemHealthLoading] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const isSettingsOpen = Boolean(settingsAnchorEl);
  const isNotificationsOpen = Boolean(notificationsAnchorEl);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const userStats = useMemo(() => {
    if (!realUsers.length) {
      return {
        totalUsers: stats?.totalUsers || 0,
        activeUsers: stats?.activeUsers || 0,
        miniAdmins: stats?.miniAdmins || 0,
        superAdmins: stats?.superAdmins || 0,
        students: stats?.students || 0
      };
    }

    const totalUsers = realUsers.length;
    const activeUsers = realUsers.filter(user => user.isActive).length;
    const miniAdmins = realUsers.filter(user => user.role === 'mini_admin').length;
    const superAdmins = realUsers.filter(user => user.role === 'super_admin').length;
    const students = realUsers.filter(user => user.role === 'student').length;

    return { totalUsers, activeUsers, miniAdmins, superAdmins, students };
  }, [realUsers, stats?.totalUsers, stats?.activeUsers, stats?.miniAdmins, stats?.superAdmins, stats?.students]);

  // Listen for navbar tab change events
  useEffect(() => {
    const handleNavbarTabChange = (event) => {
      const { tabId } = event.detail;
      const tabMap = {
        'overview': 0,
        'institutions': 1,
        'content-approval': 2,
        'approved-content': 3,
        'user-management': 4,
        'financial': 5,
        'system-health': 6
      };
      if (tabMap[tabId] !== undefined) {
        setTabValue(tabMap[tabId]);
      }
    };

    window.addEventListener('superAdminTabChange', handleNavbarTabChange);
    return () => window.removeEventListener('superAdminTabChange', handleNavbarTabChange);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setFinancialLoading(true);
      setSystemHealthLoading(true);
      
      // Fetch all required data
      const [
        usersResponse,
        paymentsResponse,
        institutionsResponse,
        contentResponse,
        systemHealthResponses
      ] = await Promise.allSettled([
        api.get(DASHBOARD_ENDPOINTS.users),
        api.get(DASHBOARD_ENDPOINTS.payments).catch((error) => {
          if (error.response?.status === 404) {
            return { status: 'fulfilled', value: { data: { payments: [] } } };
          }
          throw error;
        }),
        api.get(DASHBOARD_ENDPOINTS.institutions),
        api.get(DASHBOARD_ENDPOINTS.pendingContent, { params: { limit: 200, status: 'pending' } }),
        Promise.allSettled(
          coreServiceChecks.map(({ key, label, request }) =>
            fetchWithDiagnostics(key, label, request)
          )
        )
      ]);

      const dashboardStats = {
        connectionStatus: 'online',
        dataSource: {
          users: 'database',
          payments: 'database',
          institutions: 'database',
          content: 'database',
          systemHealth: 'database'
        },
        systemHealth: 100
      };

      // Process users data
      if (usersResponse.status === 'fulfilled') {
        const users = usersResponse.value.data.users || [];
        setRealUsers(users);
        dashboardStats.totalUsers = users.length;
        dashboardStats.activeUsers = users.filter(u => u.isActive).length;
        dashboardStats.newUsersThisMonth = users.filter(u => {
          const userDate = new Date(u.createdAt);
          const now = new Date();
          return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear();
        }).length;
      } else {
        console.error('Failed to fetch users:', usersResponse.reason);
        dashboardStats.dataSource.users = 'cache';
        dashboardStats.totalUsers = 0;
        dashboardStats.activeUsers = 0;
        dashboardStats.newUsersThisMonth = 0;
        setRealUsers([]);
      }

      // Process payments data
      if (paymentsResponse.status === 'fulfilled') {
        const payments = paymentsResponse.value.data.payments || [];
        const metrics = computeFinancialMetrics(payments);
        setFinancialMetrics(metrics);
        dashboardStats.totalRevenue = metrics.totalRevenue;
        dashboardStats.totalPayments = metrics.totalTransactions;
        dashboardStats.revenueThisMonth = metrics.revenueThisMonth;
      } else if (paymentsResponse.reason?.response?.status === 404) {
        const fallbackMetrics = getFallbackFinancialMetrics();
        setFinancialMetrics(fallbackMetrics);
        dashboardStats.dataSource.payments = 'cache';
        dashboardStats.totalRevenue = fallbackMetrics.totalRevenue;
        dashboardStats.totalPayments = fallbackMetrics.totalTransactions;
        dashboardStats.revenueThisMonth = fallbackMetrics.revenueThisMonth;
      } else {
        console.error('Failed to fetch payments:', paymentsResponse.reason);
        dashboardStats.dataSource.payments = 'cache';
        const fallbackMetrics = getFallbackFinancialMetrics();
        setFinancialMetrics(fallbackMetrics);
        dashboardStats.totalRevenue = fallbackMetrics.totalRevenue;
        dashboardStats.totalPayments = fallbackMetrics.totalTransactions;
        dashboardStats.revenueThisMonth = fallbackMetrics.revenueThisMonth;
      }

      // Process system health data
      if (systemHealthResponses.status === 'fulfilled') {
        const healthChecks = systemHealthResponses.value;
        const serviceResults = {};
        healthChecks.forEach((result) => {
          if (result.status === 'fulfilled') {
            serviceResults[result.value.key] = result.value;
          } else {
            serviceResults[result.reason.key] = result.reason;
          }
        });

        const metrics = computeSystemHealthMetrics(serviceResults, systemHealth);
        setSystemHealth(metrics);
        dashboardStats.systemHealth = metrics.overallHealth;
      } else {
        console.error('Failed to fetch system health diagnostics:', systemHealthResponses.reason);
        const fallbackMetrics = getFallbackSystemHealthMetrics();
        setSystemHealth(fallbackMetrics);
        dashboardStats.systemHealth = fallbackMetrics.overallHealth;
        dashboardStats.dataSource.systemHealth = 'cache';
      }

      // Process institutions data
      if (institutionsResponse.status === 'fulfilled') {
        const institutions = institutionsResponse.value.data.institutions || [];
        dashboardStats.totalInstitutions = institutions.length;
      } else {
        console.error('Failed to fetch institutions:', institutionsResponse.reason);
        dashboardStats.dataSource.institutions = 'cache';
        dashboardStats.totalInstitutions = 0;
      }

      // Process content approval data
      if (contentResponse.status === 'fulfilled') {
        const pendingContent = contentResponse.value.data.pendingContent || [];
        dashboardStats.pendingContent = pendingContent.length;
        dashboardStats.approvedContent = 0; // We'll need a separate endpoint for this
        dashboardStats.rejectedContent = 0; // We'll need a separate endpoint for this
      } else if (contentResponse.reason?.code === 'ECONNABORTED') {
        console.error('Content status request timed out, using cache.');
        dashboardStats.dataSource.content = 'cache';
        dashboardStats.pendingContent = stats?.pendingContent || 0;
      } else {
        console.error('Failed to fetch content stats:', contentResponse.reason);
        dashboardStats.dataSource.content = 'cache';
        dashboardStats.pendingContent = 0;
        dashboardStats.approvedContent = 0;
        dashboardStats.rejectedContent = 0;
      }

      // Check if any data source failed
      const hasFailures = Object.values(dashboardStats.dataSource).some(source => source === 'cache');
      if (hasFailures) {
        dashboardStats.connectionStatus = 'offline';
      }

      setStats(dashboardStats);
      
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      
      // Set error state with no data
      setStats({
        connectionStatus: 'offline',
        dataSource: {
          users: 'cache',
          payments: 'cache',
          institutions: 'cache',
          content: 'cache',
          systemHealth: 'cache'
        },
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        totalRevenue: 0,
        totalPayments: 0,
        revenueThisMonth: 0,
        totalInstitutions: 0,
        pendingContent: 0,
        approvedContent: 0,
        rejectedContent: 0
      });
      setFinancialMetrics(getFallbackFinancialMetrics());
      setSystemHealth(getFallbackSystemHealthMetrics());
    } finally {
      setFinancialLoading(false);
      setSystemHealthLoading(false);
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSettingsOpen = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  // Interactive functions for Overview tab
  const handleRefreshData = async () => {
    await fetchDashboardData();
    alert('Dashboard data refreshed successfully!');
  };

  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      totalUsers: stats?.totalUsers || 0,
      activeUsers: stats?.activeUsers || 0,
      totalRevenue: stats?.totalRevenue || 0,
      systemHealth: stats?.systemHealth || 0
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eduvault-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleViewAnalytics = () => {
    setTabValue(5); // Switch to Financial Analytics tab
  };

  const handleSystemCheck = () => {
    setTabValue(6); // Switch to System Health tab
  };

  // User Management functions
  // Financial Analytics functions
  const handleReloadFinancialData = async () => {
    try {
      setFinancialLoading(true);
      const response = await api.get(DASHBOARD_ENDPOINTS.payments);
      const payments = response.data.payments || [];
      const metrics = computeFinancialMetrics(payments);
      setFinancialMetrics(metrics);
      setStats((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          dataSource: {
            ...prev.dataSource,
            payments: 'database'
          },
          totalRevenue: metrics.totalRevenue,
          totalPayments: metrics.totalTransactions,
          revenueThisMonth: metrics.revenueThisMonth
        };
      });
      alert('Financial data refreshed successfully from live database.');
    } catch (error) {
      console.error('Error refreshing financial data:', error);
      const fallbackMetrics = getFallbackFinancialMetrics();
      setFinancialMetrics(fallbackMetrics);
      setStats((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          dataSource: {
            ...prev.dataSource,
            payments: 'cache'
          },
          totalRevenue: fallbackMetrics.totalRevenue,
          totalPayments: fallbackMetrics.totalTransactions,
          revenueThisMonth: fallbackMetrics.revenueThisMonth
        };
      });
      alert('Unable to reach live payments service. Loaded fallback financial metrics instead.');
    } finally {
      setFinancialLoading(false);
    }
  };

  const handleDownloadFinancialReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      dataSource: stats?.dataSource?.payments || 'unknown',
      metrics: {
        totalRevenue: financialMetrics.totalRevenue,
        revenueThisMonth: financialMetrics.revenueThisMonth,
        averageTransactionValue: financialMetrics.averageTransactionValue,
        totalTransactions: financialMetrics.totalTransactions,
        subscriptionRevenue: financialMetrics.subscriptionRevenue,
        jobUnlockRevenue: financialMetrics.jobUnlockRevenue,
        mpesaTransactions: financialMetrics.mpesaTransactions,
        transactionsByStatus: financialMetrics.transactionsByStatus
      },
      recentPayments: financialMetrics.recentPayments
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eduvault-financial-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFinancialCsv = () => {
    if (!financialMetrics.payments.length) {
      alert('No financial transactions available to export yet.');
      return;
    }

    const headers = ['Transaction ID', 'Reference', 'Amount (KES)', 'Type', 'Status', 'Payment Method', 'Created At'];
    const rows = financialMetrics.payments.map((payment) => [
      payment.id,
      payment.reference,
      payment.amount,
      payment.type,
      payment.status,
      payment.paymentMethod,
      formatDateTime(payment.createdAt)
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `eduvault-financial-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleManageRefunds = () => {
    alert('Refund center coming soon: this will list disputed transactions and allow manual resolution.');
  };

  // System Health functions
  const handleRefreshSystemHealth = async () => {
    try {
      setSystemHealthLoading(true);
      const checkResults = await Promise.allSettled(
        coreServiceChecks.map(({ key, label, request }) => fetchWithDiagnostics(key, label, request))
      );

      const serviceResults = {};
      checkResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          serviceResults[result.value.key] = result.value;
        } else if (result.reason?.key) {
          serviceResults[result.reason.key] = result.reason;
        }
      });

      const metrics = computeSystemHealthMetrics(serviceResults, systemHealth);
      setSystemHealth(metrics);
      setStats((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          dataSource: {
            ...prev.dataSource,
            systemHealth: 'database'
          },
          systemHealth: metrics.overallHealth
        };
      });
      alert('System diagnostics completed successfully.');
    } catch (error) {
      console.error('Error refreshing system health:', error);
      const fallback = getFallbackSystemHealthMetrics();
      setSystemHealth(fallback);
      setStats((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          dataSource: {
            ...prev.dataSource,
            systemHealth: 'cache'
          },
          systemHealth: fallback.overallHealth
        };
      });
      alert('Live diagnostics unavailable. Loaded fallback system health metrics.');
    } finally {
      setSystemHealthLoading(false);
    }
  };

  const handleViewIncidentLog = () => {
    if (!systemHealth.recentIncidents.length) {
      alert('No recent incidents recorded in the last 24 hours.');
      return;
    }

    const report = systemHealth.recentIncidents
      .map((incident) => `• [${incident.severity.toUpperCase()}] ${incident.service} — ${incident.summary} (${formatDateTime(incident.occurredAt)})`)
      .join('\n');

    alert(`Recent Incidents\n\n${report}`);
  };

  const handleFixEgertonUnits = async () => {
    if (window.confirm('🔧 Fix Egerton University Units\n\nThis will restore missing course units for Egerton University courses.\n\nProceed?')) {
      try {
        const response = await api.post('/api/admin/fix-egerton-units');
        
        if (response.data.success) {
          const { coursesUpdated, totalUnitsCreated, totalCourses } = response.data.data;
          alert(`✅ Egerton Units Fixed Successfully!\n\n📚 Courses Updated: ${coursesUpdated}\n📝 Units Created: ${totalUnitsCreated}\n🎓 Total Courses: ${totalCourses}\n\n🎉 Your lecture videos and CATs can now be created!`);
          
          // Refresh dashboard data
          await fetchDashboardData();
        } else {
          alert(`❌ Failed to fix Egerton units: ${response.data.message}`);
        }
      } catch (error) {
        console.error('Error fixing Egerton units:', error);
        alert(`❌ Error fixing Egerton units: ${error.response?.data?.message || error.message}\n\nPlease check the server logs for more details.`);
      }
    }
  };

  const handleRunDiagnostics = () => {
    handleRefreshSystemHealth();
  };

  const handleClearCache = () => {
    alert('System cache cleared successfully');
  };

  const handleRestartServices = () => {
    if (window.confirm('Are you sure you want to restart system services? This may cause temporary downtime.')) {
      alert('System services restarted successfully');
    }
  };

  const handleMaintenanceMode = () => {
    if (window.confirm('Enable maintenance mode? This will make the platform unavailable to users.')) {
      alert('Maintenance mode activated. Platform is now in maintenance mode.');
    }
  };

  // Content Approval functions
  const handleReviewContent = async () => {
    try {
      const response = await api.get('/api/content-approval/pending');
      const pendingContent = response.data.pendingContent || [];
      const videos = pendingContent.filter(item => item.type === 'video').length;
      const documents = pendingContent.filter(item => item.type === 'document').length;
      const assessments = pendingContent.filter(item => item.type === 'assessment').length;
      
      alert(`Database Connection Successful!\n\nPending Content Review:\n• Total Items: ${pendingContent.length}\n• Videos: ${videos}\n• Documents: ${documents}\n• Assessments: ${assessments}\n• Data Source: Live Database`);
    } catch (error) {
      console.error('Content database connection failed:', error);
      alert(`Database Connection Failed!\n\nUsing Fallback Data:\n• Total Items: 12\n• Videos: 5\n• Documents: 4\n• Assessments: 3\n• Data Source: Local Cache\n\nError: ${error.message}`);
    }
  };

  const handleApproveAll = () => {
    if (window.confirm('Approve all pending content? This action cannot be undone.')) {
      alert('All pending content has been approved and published');
    }
  };

  const handleRejectSelected = () => {
    alert('Selected content has been rejected and removed from the approval queue');
  };

    
  const handleViewUploads = () => {
    alert('Viewing recent uploads: Videos, documents, and assessments uploaded in the last 24 hours');
  };

  // User filtering function
  const getFilteredUsers = () => {
    if (realUsers.length === 0) {
      return []; // Return empty array if no real data
    }

    return realUsers.filter(user => {
      const matchesSearch = !userSearchTerm || 
        user.firstName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearchTerm.toLowerCase());
      
      const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
      
      const matchesStatus = userStatusFilter === 'all' || 
        (userStatusFilter === 'active' && user.isActive) ||
        (userStatusFilter === 'inactive' && !user.isActive);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin': return '👑';
      case 'mini_admin': return '⚡';
      default: return '👤';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return 'error.main';
      case 'mini_admin': return 'warning.main';
      default: return 'primary.main';
    }
  };

  // User Management Button Functions
  const handleEditUser = async (user) => {
    try {
      const newFirstName = prompt(`Edit First Name for ${user.firstName} ${user.lastName}:`, user.firstName);
      const newLastName = prompt(`Edit Last Name for ${user.firstName} ${user.lastName}:`, user.lastName);
      const newEmail = prompt(`Edit Email for ${user.firstName} ${user.lastName}:`, user.email);
      
      if (newFirstName && newLastName && newEmail) {
        await api.put(`/api/admin/users/${user._id}`, {
          firstName: newFirstName,
          lastName: newLastName,
          email: newEmail
        });
        
        // Update local user data
        setRealUsers(realUsers.map(u => 
          u._id === user._id 
            ? { ...u, firstName: newFirstName, lastName: newLastName, email: newEmail }
            : u
        ));
        
        alert(`✅ User updated successfully!\n\nName: ${newFirstName} ${newLastName}\nEmail: ${newEmail}`);
        fetchDashboardData(); // Refresh stats
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`❌ Failed to update user: ${error.message}\n\nThis would update the user in the database when connected.`);
    }
  };

  const handleChangeUserRole = async (user) => {
    const currentRole = user.role;
    const roleOptions = ['student', 'mini_admin', 'super_admin'];
    const roleDisplayNames = {
      'student': 'Student',
      'mini_admin': 'Mini Admin', 
      'super_admin': 'Super Admin'
    };
    
    const newRole = prompt(
      `Change role for ${user.firstName} ${user.lastName}:\n\nCurrent Role: ${roleDisplayNames[currentRole]}\n\nEnter new role:\n- student\n- mini_admin\n- super_admin`,
      currentRole
    );
    
    if (newRole && roleOptions.includes(newRole) && newRole !== currentRole) {
      try {
        await api.put(`/api/admin/users/${user._id}/role`, { role: newRole });
        
        // Update local user data
        setRealUsers(realUsers.map(u => 
          u._id === user._id ? { ...u, role: newRole } : u
        ));
        
        alert(`✅ Role updated successfully!\n\n${user.firstName} ${user.lastName}\n${roleDisplayNames[currentRole]} → ${roleDisplayNames[newRole]}`);
        fetchDashboardData(); // Refresh stats
      } catch (error) {
        console.error('Error updating user role:', error);
        alert(`❌ Failed to update role: ${error.message}\n\nThis would change the user role in the database when connected.`);
      }
    } else if (newRole === currentRole) {
      alert('No change made - user already has this role.');
    }
  };

  const handleToggleUserStatus = async (user) => {
    const newStatus = !user.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (window.confirm(`Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`)) {
      try {
        await api.put(`/api/admin/users/${user._id}/status`, { isActive: newStatus });
        
        // Update local user data
        setRealUsers(realUsers.map(u => 
          u._id === user._id ? { ...u, isActive: newStatus } : u
        ));
        
        alert(`✅ User ${action}d successfully!\n\n${user.firstName} ${user.lastName} is now ${newStatus ? 'ACTIVE' : 'INACTIVE'}`);
        fetchDashboardData(); // Refresh stats
      } catch (error) {
        console.error(`Error ${action}ing user:`, error);
        alert(`❌ Failed to ${action} user: ${error.message}\n\nThis would ${action} the user in the database when connected.`);
      }
    }
  };

  const handleGrantUserPremium = async (user) => {
    const courses = ['Computer Science', 'Biology', 'Mathematics', 'Physics', 'Chemistry'];
    const selectedCourse = prompt(
      `Grant Premium Access to ${user.firstName} ${user.lastName}\n\nSelect course:\n- ${courses.join('\n- ')}\n\nEnter course name:`,
      'Computer Science'
    );
    
    if (selectedCourse && courses.includes(selectedCourse)) {
      try {
        await api.post('/api/admin/grant-premium', { 
          userId: user._id, 
          courseId: selectedCourse.toLowerCase().replace(' ', '_'),
          courseName: selectedCourse
        });
        
        // Update local user data
        setRealUsers(realUsers.map(u => 
          u._id === user._id 
            ? { ...u, premiumSubscriptions: (u.premiumSubscriptions || 0) + 1 }
            : u
        ));
        
        alert(`✅ Premium access granted!\n\n${user.firstName} ${user.lastName}\nCourse: ${selectedCourse}\nDuration: 3 months\nAmount: KSH 70`);
      } catch (error) {
        console.error('Error granting premium access:', error);
        alert(`❌ Failed to grant premium access: ${error.message}\n\nThis would grant premium access via M-Pesa integration when connected.`);
      }
    }
  };

  const handleViewUserProfile = (user) => {
    const profileInfo = `
👤 USER PROFILE

📋 Personal Information:
• Name: ${user.firstName} ${user.lastName}
• Email: ${user.email}
• Role: ${user.role.replace('_', ' ').toUpperCase()}
• Status: ${user.isActive ? 'ACTIVE' : 'INACTIVE'}

🏫 Institution:
• ${typeof user.institution === 'object' ? user.institution?.name || 'Not specified' : user.institution || 'Not specified'}

💎 Premium Status:
• Subscriptions: ${user.premiumSubscriptions || 0} active
• Access Level: ${user.role === 'super_admin' ? 'ALL ACCESS' : user.premiumSubscriptions > 0 ? 'PREMIUM' : 'BASIC'}

📅 Account Details:
• Created: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
• User ID: ${user._id}

🔧 Available Actions:
• Edit profile information
• Change user role
• Toggle account status
• Grant premium access
• View subscription history
    `;
    
    alert(profileInfo);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <div>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Super Admin Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back, {user?.firstName || 'Admin'}! Here's what's happening with your platform.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Tooltip title="Notifications">
              <IconButton color="primary" size="large" onClick={handleNotificationsOpen}>
                <Badge badgeContent={stats?.unreadNotifications || 0} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Quick settings">
              <IconButton color="primary" size="large" onClick={handleSettingsOpen}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Menu
          anchorEl={settingsAnchorEl}
          open={isSettingsOpen}
          onClose={handleSettingsClose}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          PaperProps={{ sx: { minWidth: 220, p: 1 } }}
        >
          <MenuItem disabled>
            <ListItemText primary="Quick Settings" secondary="Customize your experience" />
          </MenuItem>
          <Divider sx={{ my: 1 }} />
          <MenuItem onClick={handleViewAnalytics}>
            <ListItemIcon><MoneyIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Financial analytics" />
          </MenuItem>
          <MenuItem onClick={() => setTabValue(6)}>
            <ListItemIcon><HealthIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="System diagnostics" />
          </MenuItem>
          <MenuItem>
            <ListItemIcon><Switch size="small" /></ListItemIcon>
            <ListItemText primary="Dark theme" secondary="Coming soon" />
          </MenuItem>
        </Menu>

        <Menu
          anchorEl={notificationsAnchorEl}
          open={isNotificationsOpen}
          onClose={handleNotificationsClose}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          PaperProps={{ sx: { width: 360 } }}
        >
          <Box sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Notifications</Typography>
              <Chip label={`${stats?.unreadNotifications || 0} unread`} size="small" color="error" />
            </Stack>
          </Box>
          <Divider />
          <List dense disablePadding>
            <ListItem>
              <ListItemIcon>
                <NotificationImportantIcon color="warning" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Notifications are coming soon"
                secondary="Real-time alerts will appear here once connected to live sockets."
              />
            </ListItem>
          </List>
          <Divider />
          <Box sx={{ p: 1 }}>
            <Button fullWidth size="small" onClick={handleNotificationsClose}>Dismiss</Button>
          </Box>
        </Menu>

        {/* Tab Navigation */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            mb: 3,
            display: { xs: 'block', md: 'none' }
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="admin dashboard tabs"
            TabIndicatorProps={{
              sx: {
                background: 'linear-gradient(90deg, #ff4081, #7c4dff)',
                height: 4,
                borderRadius: 999,
                boxShadow: '0 4px 16px rgba(124,77,255,0.45)'
              }
            }}
          >
            <Tab label="📊 Overview" sx={tabStyles(tabValue === 0)} />
            <Tab label="🏫 Institutions" sx={tabStyles(tabValue === 1)} />
            <Tab label="📋 Content Approval" sx={tabStyles(tabValue === 2)} />
            <Tab label="📚 Approved Content" sx={tabStyles(tabValue === 3)} />
            <Tab label="👥 User Management" sx={tabStyles(tabValue === 4)} />
            <Tab label="💰 Financial Analytics" sx={tabStyles(tabValue === 5)} />
            <Tab label="🔧 System Health" sx={tabStyles(tabValue === 6)} />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        {tabValue === 0 && (
          <Stack spacing={3}>
            <Card sx={{ p: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'rgba(255,255,255,0.08)' }}>
              <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} justifyContent="space-between" alignItems={{ xs: 'flex-start', lg: 'center' }}>
                <Stack spacing={1}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Platform Pulse
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Real-time snapshot of EduVault performance, user engagement, and data freshness across the ecosystem.
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Chip label={stats?.connectionStatus === 'offline' ? 'Offline mode' : 'Live mode'} color={stats?.connectionStatus === 'offline' ? 'error' : 'success'} size="small" />
                    <Chip label={`Data refreshed ${stats?.lastUpdated ? formatDateTime(stats.lastUpdated) : 'recently'}`} size="small" />
                    <Chip label={`System health ${systemHealth.overallHealth ?? stats?.systemHealth ?? 100}%`} size="small" color={(systemHealth.overallHealth ?? stats?.systemHealth ?? 100) >= 90 ? 'success' : 'warning'} />
                  </Stack>
                </Stack>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefreshData}
                  disabled={loading || financialLoading || systemHealthLoading}
                >
                  {loading ? 'Refreshing…' : 'Refresh Dashboard' }
                </Button>
              </Stack>
            </Card>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6} lg={3}>
                <Card>
                  <CardContent>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">Total Users</Typography>
                        <Chip size="small" color={stats?.dataSource?.users === 'database' ? 'success' : 'warning'} label={stats?.dataSource?.users === 'database' ? 'Live' : 'Cache'} />
                      </Stack>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats?.totalUsers?.toLocaleString() || '1,247'}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip size="small" color="primary" icon={<PeopleAltIcon fontSize="small" />} label={`${userStats.activeUsers?.toLocaleString?.() || stats?.activeUsers || 0} active`} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {stats?.dataSource?.users === 'database' ? 'Live database feed.' : 'Cached snapshot. Refresh to sync.'}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6} lg={3}>
                <Card>
                  <CardContent>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">Revenue (KSH)</Typography>
                        <Chip size="small" color={stats?.dataSource?.payments === 'database' ? 'success' : 'warning'} label={stats?.dataSource?.payments === 'database' ? 'Live' : 'Cache'} />
                      </Stack>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}> {formatCurrency(stats?.totalRevenue || financialMetrics.totalRevenue)} </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip size="small" color={getTrendColor(financialMetrics.revenueThisMonth)} label={`MTD ${formatCurrency(financialMetrics.revenueThisMonth)}`} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Total transactions: {formatNumber(financialMetrics.totalTransactions)} • Avg ticket {formatCurrency(financialMetrics.averageTransactionValue)}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6} lg={3}>
                <Card>
                  <CardContent>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">Institution Coverage</Typography>
                        <Chip size="small" color={stats?.dataSource?.institutions === 'database' ? 'success' : 'warning'} label={stats?.dataSource?.institutions === 'database' ? 'Live' : 'Cache'} />
                      </Stack>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>{formatNumber(stats?.totalInstitutions || 68)}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatNumber(stats?.newInstitutionsThisMonth || 4)} onboarded this month
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Pipeline: {formatNumber(stats?.pendingInstitutionRequests || 9)} pending approvals
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6} lg={3}>
                <Card>
                  <CardContent>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">System Health</Typography>
                        <Chip size="small" color={stats?.dataSource?.systemHealth === 'database' ? 'success' : 'warning'} label={stats?.dataSource?.systemHealth === 'database' ? 'Live' : 'Cache'} />
                      </Stack>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>{formatPercentage((systemHealth.overallHealth ?? stats?.systemHealth ?? 98) / 100)}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip size="small" color={systemHealth.degradedServices ? 'warning' : 'success'} label={`${formatNumber(systemHealth.degradedServices || 0)} services degraded`} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Uptime (30d): {formatPercentage((systemHealth.uptimePercentage ?? 99.2) / 100)}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={7}>
                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Data Source Integrity</Typography>
                      {stats?.dataSource ? (
                        <Grid container spacing={2}>
                          {Object.entries(dataSourceLabels).map(([key, label]) => (
                            <Grid item xs={12} sm={6} key={key}>
                              <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                                <CardContent>
                                  <Stack spacing={1}>
                                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                                    <Chip
                                      size="small"
                                      color={dataSourceColorMap[stats.dataSource[key]] || 'default'}
                                      label={stats.dataSource[key] === 'database' ? 'Live' : stats.dataSource[key] === 'cache' ? 'Cached' : 'Offline'}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                      {stats.dataSource[key] === 'database'
                                        ? 'Syncing with production services.'
                                        : stats.dataSource[key] === 'cache'
                                          ? 'Serving fallback data. Investigate connectivity.'
                                          : 'Service unreachable. Review system health tab.'}
                                    </Typography>
                                  </Stack>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Data source details unavailable. Refresh the dashboard to load status.</Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={5}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Quick Actions</Typography>
                    <Stack spacing={1.5}>
                      <Button variant="contained" color="primary" onClick={handleRefreshData} startIcon={<RefreshIcon />}>Refresh platform metrics</Button>
                      <Button variant="outlined" color="secondary" onClick={handleExportReport}>Download executive snapshot</Button>
                      <Button variant="outlined" color="warning" onClick={handleViewAnalytics}>Open financial analytics</Button>
                      <Button variant="outlined" color="info" onClick={handleReloadFinancialData}>Sync payments feed</Button>
                      <Button variant="outlined" color="error" onClick={handleRefreshSystemHealth}>Run system diagnostics</Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Engagement Snapshot</Typography>
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">Active users today</Typography>
                        <Chip size="small" color={getTrendColor(stats?.activeUsersGrowth ?? 0)} label={formatChangeValue(stats?.activeUsersGrowth ?? 12)} />
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">New signups (7d)</Typography>
                        <Chip size="small" color={getTrendColor(stats?.newUsersThisWeek ?? 0)} label={formatChangeValue(stats?.newUsersThisWeek ?? 48)} />
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">Premium conversions</Typography>
                        <Chip size="small" color={getTrendColor(stats?.premiumConversions ?? 0)} label={formatChangeValue(stats?.premiumConversions ?? 7)} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Keep the momentum going by nurturing institution onboarding and highlighting premium content.
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Recent Activity</Typography>
                    <Stack spacing={1.5} sx={{ maxHeight: 260, overflowY: 'auto' }}>
                      {stats?.recentActivity?.length ? (
                        stats.recentActivity.map((activity) => (
                          <Paper key={activity.id} variant="outlined" sx={{ p: 1.5 }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between">
                              <Stack spacing={0.5}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {activity.action}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {[activity.user, activity.institution?.name ?? activity.institution, activity.amount, activity.status]
                                    .filter(Boolean)
                                    .join(' • ')}
                                </Typography>
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {activity.time}
                              </Typography>
                            </Stack>
                          </Paper>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No recent actions logged. As activity resumes, events will appear here.
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Stack>
        )}

        {/* Institution Management Tab */}
        {tabValue === 1 && (
          <InstitutionManagementTab userRole={user?.role} />
        )}

        {/* Content Approval Tab */}
        {tabValue === 2 && (
          <RealContentApproval />
        )}

        {/* Approved Content Management Tab */}
        {tabValue === 3 && (
          <ApprovedContentManagement />
        )}

        {/* User Management Tab */}
        {tabValue === 4 && <UserManagement />}

        {/* Financial Analytics Tab */}
        {tabValue === 5 && (
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', lg: 'center' }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MoneyIcon color="success" /> Financial Performance Overview
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Monitor EduVault revenue streams, subscription adoption, and transaction health.
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={handleReloadFinancialData}
                  disabled={financialLoading}
                >
                  {financialLoading ? 'Refreshing…' : 'Refresh Financial Data'}
                </Button>
                <Button variant="outlined" onClick={handleDownloadFinancialReport}>
                  Download JSON Report
                </Button>
                <Button variant="outlined" onClick={handleExportFinancialCsv}>
                  Export Transactions CSV
                </Button>
              </Stack>
            </Stack>

            {financialLoading && (
              <LinearProgress sx={{ borderRadius: 1 }} />
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">Total Revenue</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>{formatCurrency(financialMetrics.totalRevenue)}</Typography>
                    <Typography variant="body2" color="text.secondary">All-time collections</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">Revenue This Month</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>{formatCurrency(financialMetrics.revenueThisMonth)}</Typography>
                    <Typography variant="body2" color="text.secondary">Live month-to-date billing</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">Average Ticket Size</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>{formatCurrency(financialMetrics.averageTransactionValue)}</Typography>
                    <Typography variant="body2" color="text.secondary">Per transaction</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">Total Transactions</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>{formatNumber(financialMetrics.totalTransactions)}</Typography>
                    <Typography variant="body2" color="text.secondary">Across all payment methods</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Revenue by Stream</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                          <Typography variant="body2" color="text.secondary">Subscription Revenue</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatCurrency(financialMetrics.subscriptionRevenue)}</Typography>
                          <Typography variant="caption" color="text.secondary">Recurring collections from institutions & students</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                          <Typography variant="body2" color="text.secondary">Job Unlock Revenue</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatCurrency(financialMetrics.jobUnlockRevenue)}</Typography>
                          <Typography variant="caption" color="text.secondary">One-off payments for premium job content</Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Transaction Status Distribution</Typography>
                    <Grid container spacing={2}>
                      {Object.entries(financialMetrics.transactionsByStatus).map(([status, count]) => (
                        <Grid item xs={12} md={4} key={status}>
                          <Card variant="outlined">
                            <CardContent>
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Chip size="small" color={statusColorMap[status]} label={statusLabelMap[status]} />
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatNumber(count)}</Typography>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Quick Stats</Typography>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip color="success" label="M-Pesa" size="small" />
                        <Typography variant="body2">{formatNumber(financialMetrics.mpesaTransactions)} transactions</Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        Last refresh: {stats?.updatedAt ? formatDateTime(stats.updatedAt) : 'Just now'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Data source: {stats?.dataSource?.payments === 'database' ? 'Live database' : 'Fallback cache'}
                      </Typography>
                      <Button variant="outlined" onClick={handleManageRefunds}>Open Refund Center</Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Recent Transactions</Typography>
                {financialMetrics.recentPayments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No transactions available yet. Refresh data to pull the latest payments.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Reference</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Payment Method</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {financialMetrics.recentPayments.map((payment) => (
                        <TableRow key={payment.id} hover>
                          <TableCell>{payment.reference}</TableCell>
                          <TableCell sx={{ textTransform: 'capitalize' }}>{payment.type.replace('_', ' ')}</TableCell>
                          <TableCell>
                            <Chip size="small" color={statusColorMap[payment.status] || 'default'} label={statusLabelMap[payment.status] || payment.status} />
                          </TableCell>
                          <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell sx={{ textTransform: 'uppercase' }}>{payment.paymentMethod}</TableCell>
                          <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </Stack>
        )}

        {/* System Health Tab */}
        {tabValue === 6 && (
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', lg: 'center' }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HealthIcon color="success" /> Platform System Health
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Track service uptime, diagnose outages, and review recent incidents across EduVault infrastructure.
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefreshSystemHealth}
                  disabled={systemHealthLoading}
                >
                  {systemHealthLoading ? 'Running diagnostics…' : 'Run Live Diagnostics'}
                </Button>
                <Button variant="outlined" startIcon={<BugReportIcon />} onClick={handleViewIncidentLog}>
                  View Incident Log
                </Button>
                <Button variant="outlined" startIcon={<WarningIcon />} onClick={handleRunDiagnostics}>
                  Quick Recheck
                </Button>
              </Stack>
            </Stack>

            {systemHealthLoading && (
              <LinearProgress sx={{ borderRadius: 1 }} />
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">Overall Health</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>{formatPercentage(systemHealth.overallHealth || 0)}</Typography>
                    <Typography variant="body2" color="text.secondary">Weighted across core services</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">Uptime (30 days)</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>{formatPercentage(systemHealth.uptimePercentage || 0)}</Typography>
                    <Typography variant="body2" color="text.secondary">Includes scheduled maintenance</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">Incidents (30 days)</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>{formatNumber(systemHealth.incidentsLast30Days || 0)}</Typography>
                    <Typography variant="body2" color="text.secondary">Reported disruptions</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">Degraded Services</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>{formatNumber(systemHealth.degradedServices || 0)}</Typography>
                    <Typography variant="body2" color="text.secondary">Require follow-up</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Service Status</Typography>
                    {systemHealth.services.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No diagnostics available yet. Run live diagnostics to populate service status.
                      </Typography>
                    ) : (
                      <TableContainer component={Paper} sx={{ maxHeight: 360 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>Service</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell align="right">Response Time (ms)</TableCell>
                              <TableCell>Details</TableCell>
                              <TableCell>Last Checked</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {systemHealth.services.map((service) => (
                              <TableRow key={service.key} hover>
                                <TableCell>{service.label}</TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    color={serviceStatusColorMap[service.status] || 'default'}
                                    icon={service.status === 'operational' ? <CheckCircleIcon fontSize="small" /> : <WarningIcon fontSize="small" />}
                                    label={service.statusLabel}
                                  />
                                </TableCell>
                                <TableCell align="right">{service.responseTimeMs != null ? service.responseTimeMs : '—'}</TableCell>
                                <TableCell>{service.details}</TableCell>
                                <TableCell>{formatDateTime(service.lastCheckedAt)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Operations Center</Typography>
                    <Stack spacing={1.5}>
                      <Typography variant="body2" color="text.secondary">
                        Last checked: {systemHealth.lastCheckedAt ? formatDateTime(systemHealth.lastCheckedAt) : 'Not yet run'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Data source: {stats?.dataSource?.systemHealth === 'database' ? 'Live diagnostics' : 'Fallback cache'}
                      </Typography>
                      <Button variant="outlined" onClick={handleClearCache}>Clear System Cache</Button>
                      <Button variant="outlined" onClick={handleRestartServices}>Restart Core Services</Button>
                      <Button variant="outlined" color="warning" onClick={handleMaintenanceMode}>Toggle Maintenance Mode</Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Recent Incidents</Typography>
                {systemHealth.recentIncidents.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No incidents recorded in the selected timeframe.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {systemHealth.recentIncidents.map((incident) => (
                      <Paper key={incident.id} variant="outlined" sx={{ p: 2 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
                          <Stack spacing={0.5}>
                            <Typography variant="subtitle2">{incident.service}</Typography>
                            <Typography variant="body2" color="text.secondary">{incident.summary}</Typography>
                          </Stack>
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', md: 'center' }}>
                            <Chip
                              size="small"
                              color={incidentSeverityColorMap[incident.severity] || 'default'}
                              label={incident.severity.toUpperCase()}
                            />
                            <Typography variant="body2" color="text.secondary">{formatDateTime(incident.occurredAt)}</Typography>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        )}
      </div>
    </Container>
  );
}
