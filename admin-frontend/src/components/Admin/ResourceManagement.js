import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Button
} from '@mui/material';
import { Delete, Edit, Visibility } from '@mui/icons-material';
import api from '../../utils/api';

/**
 * Generic resource manager listing items of one type (video, notes, cat, pastExam)
 * Props:
 *  - resourceType: "video" | "notes" | "cats" | "pastExams"
 *  - title: display title
 */
const ResourceManagement = ({ resourceType = 'video', title = 'Resources' }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const map = {
        video: 'lecture_video',
        notes: 'notes',
        cats: 'cat',
        pastExams: 'past_paper'
      };
      const qType = map[resourceType] || resourceType;
      const resp = await api.get('/api/resources', { params: { type: qType } });
      const data = resp.data?.resources || [];
      setRows(data.map((r, idx) => ({ id: r._id || idx, ...r })));
      setPage(0);
    } catch (e) {
      console.error(`Fetch ${resourceType} error`, e);
      setError('Failed to load resources.');
    } finally {
      setLoading(false);
    }
  }, [resourceType]);

  useEffect(() => { loadData(); }, [loadData]);

  const columns = useMemo(() => [
    {
      field: 'title',
      header: 'Title',
      minWidth: 220,
      render: (row) => row.title || 'Untitled'
    },
    {
      field: 'unitCode',
      header: 'Unit',
      minWidth: 110,
      render: (row) => row.unitCode || '-'
    },
    {
      field: 'year',
      header: 'Yr',
      minWidth: 70,
      align: 'center',
      render: (row) => row.year ?? '-'
    },
    {
      field: 'semester',
      header: 'Sem',
      minWidth: 70,
      align: 'center',
      render: (row) => row.semester ?? '-'
    },
    {
      field: 'uploadDate',
      header: 'Uploaded',
      minWidth: 150,
      render: (row) => row.uploadDate ? new Date(row.uploadDate).toLocaleDateString() : '-'
    },
    {
      field: 'isPremium',
      header: 'Premium',
      minWidth: 110,
      align: 'center',
      render: (row) => row.isPremium ? <Chip size="small" color="warning" label="Yes" /> : <Chip size="small" label="No" />
    },
    {
      field: 'actions',
      header: 'Actions',
      minWidth: 140,
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Preview">
            <IconButton size="small">
              <Visibility fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" color="primary">
              <Edit fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error">
              <Delete fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], []);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>{title}</Typography>
        <Button onClick={loadData} variant="outlined">Refresh</Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Paper>
          <TableContainer sx={{ maxHeight: 520 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell
                      key={col.field}
                      align={col.align || 'left'}
                      sx={{ minWidth: col.minWidth }}
                    >
                      {col.header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row) => (
                  <TableRow key={row.id} hover>
                    {columns.map((col) => (
                      <TableCell key={col.field} align={col.align || 'left'}>
                        {col.render ? col.render(row) : row[col.field] ?? '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {paginatedRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center">
                      No resources found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            rowsPerPageOptions={[10, 25, 50]}
            count={rows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
    </Box>
  );
};

export default ResourceManagement;
