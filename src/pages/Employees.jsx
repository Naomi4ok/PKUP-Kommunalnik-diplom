import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Grid,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  CircularProgress,
  Avatar,
  IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state for adding/editing employees
  const [formData, setFormData] = useState({
    fullName: '',
    position: '',
    department: '',
    contactDetails: '',
    workSchedule: '',
    status: 'Active',
    photo: null
  });
  
  // UI state management
  const [openForm, setOpenForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [photoPreview, setPhotoPreview] = useState(null);

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Fetch all employees from the database
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employees');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setEmployees(data);
      setLoading(false);
    } catch (err) {
      setError(`Failed to fetch employees: ${err.message}`);
      setLoading(false);
      showSnackbar(`Failed to fetch employees: ${err.message}`, 'error');
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle photo file upload
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        photo: file
      }));
      
      // Create a preview URL for the selected photo
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit form to add or update employee
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create FormData object to handle file upload
    const formDataToSend = new FormData();
    formDataToSend.append('fullName', formData.fullName);
    formDataToSend.append('position', formData.position || '');
    formDataToSend.append('department', formData.department || '');
    formDataToSend.append('contactDetails', formData.contactDetails || '');
    formDataToSend.append('workSchedule', formData.workSchedule || '');
    formDataToSend.append('status', formData.status || 'Active');
    
    if (formData.photo instanceof File) {
      formDataToSend.append('photo', formData.photo);
    }

    try {
      let response;
      
      if (isEditing) {
        // Update existing employee
        response = await fetch(`/api/employees/${editingId}`, {
          method: 'PUT',
          body: formDataToSend
        });
      } else {
        // Add new employee
        response = await fetch('/api/employees', {
          method: 'POST',
          body: formDataToSend
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Reset form, close dialog, and refresh employee list
      resetForm();
      setOpenForm(false);
      fetchEmployees();
      showSnackbar(`Employee ${isEditing ? 'updated' : 'added'} successfully!`, 'success');
    } catch (err) {
      showSnackbar(`Failed to ${isEditing ? 'update' : 'add'} employee: ${err.message}`, 'error');
    }
  };

  // Delete an employee
  const handleDelete = async () => {
    if (!employeeToDelete) return;
    
    try {
      const response = await fetch(`/api/employees/${employeeToDelete}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Close confirm dialog and refresh employee list
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
      fetchEmployees();
      showSnackbar('Employee deleted successfully!', 'success');
    } catch (err) {
      showSnackbar(`Failed to delete employee: ${err.message}`, 'error');
    }
  };

  // Edit an employee
  const handleEdit = (employee) => {
    setIsEditing(true);
    setEditingId(employee.Employee_ID);
    
    setFormData({
      fullName: employee.Full_Name || '',
      position: employee.Position || '',
      department: employee.Department || '',
      contactDetails: employee.Contact_Details || '',
      workSchedule: employee.Work_Schedule || '',
      status: employee.Status || 'Active',
      photo: null // We don't set the photo here as we can't retrieve the binary data this way
    });
    
    // Set photo preview if photo exists
    if (employee.Photo) {
      setPhotoPreview(`data:image/jpeg;base64,${employee.Photo}`);
    } else {
      setPhotoPreview(null);
    }
    
    setOpenForm(true);
  };

  // Reset form and editing state
  const resetForm = () => {
    setFormData({
      fullName: '',
      position: '',
      department: '',
      contactDetails: '',
      workSchedule: '',
      status: 'Active',
      photo: null
    });
    setPhotoPreview(null);
    setIsEditing(false);
    setEditingId(null);
  };

  // Open form dialog for adding new employee
  const handleAddNew = () => {
    resetForm();
    setOpenForm(true);
  };

  // Close form dialog
  const handleCloseForm = () => {
    setOpenForm(false);
    resetForm();
  };

  // Open delete confirmation dialog
  const handleDeleteConfirm = (id) => {
    setEmployeeToDelete(id);
    setDeleteConfirmOpen(true);
  };

  // Close delete confirmation dialog
  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setEmployeeToDelete(null);
  };

  // Show snackbar message
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // DataGrid columns definition
  const columns = [
    {
      field: 'Photo',
      headerName: 'Photo',
      width: 80,
      renderCell: (params) => (
        <Avatar
          src={params.value ? `data:image/jpeg;base64,${params.value}` : null}
          alt={params.row.Full_Name}
        >
          {!params.value && params.row.Full_Name ? params.row.Full_Name.charAt(0) : 'E'}
        </Avatar>
      ),
    },
    { field: 'Full_Name', headerName: 'Full Name', width: 180 },
    { field: 'Position', headerName: 'Position', width: 150 },
    { field: 'Department', headerName: 'Department', width: 150 },
    { field: 'Contact_Details', headerName: 'Contact Details', width: 180 },
    { field: 'Work_Schedule', headerName: 'Work Schedule', width: 150 },
    {
      field: 'Status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Box
          sx={{
            backgroundColor: 
              params.value === 'Active' ? '#d4edda' :
              params.value === 'On Leave' ? '#fff3cd' :
              params.value === 'Terminated' ? '#f8d7da' : '#e2e3e5',
            color: 
              params.value === 'Active' ? '#155724' :
              params.value === 'On Leave' ? '#856404' :
              params.value === 'Terminated' ? '#721c24' : '#383d41',
            py: 0.5,
            px: 1.5,
            borderRadius: 1,
            display: 'inline-block',
            fontSize: '0.875rem',
          }}
        >
          {params.value || 'Unknown'}
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            size="small" 
            color="primary"
            onClick={() => handleEdit(params.row)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteConfirm(params.row.Employee_ID)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Format date to display in the UI
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Employees Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
          >
            Add Employee
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={employees}
              columns={columns}
              getRowId={(row) => row.Employee_ID}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
              }}
              pageSizeOptions={[5, 10, 25]}
              disableRowSelectionOnClick
              autoHeight
              sx={{
                '& .MuiDataGrid-cell': {
                  py: 1,
                },
              }}
            />
          </Box>
        )}
      </Paper>

      {/* Employee Form Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="fullName"
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="position"
                  label="Position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="department"
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="contactDetails"
                  label="Contact Details"
                  name="contactDetails"
                  value={formData.contactDetails}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="workSchedule"
                  label="Work Schedule"
                  name="workSchedule"
                  value={formData.workSchedule}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  select
                  id="status"
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="On Leave">On Leave</MenuItem>
                  <MenuItem value="Terminated">Terminated</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    htmlFor="photo-upload"
                  >
                    Upload Photo
                    <input
                      id="photo-upload"
                      name="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      style={{ display: 'none' }}
                    />
                  </Button>
                  {photoPreview && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={photoPreview}
                        alt="Preview"
                        sx={{ width: 60, height: 60 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => {
                          setPhotoPreview(null);
                          setFormData(prev => ({ ...prev, photo: null }));
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm} startIcon={<CancelIcon />} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            startIcon={<SaveIcon />} 
            variant="contained"
            color="primary"
          >
            {isEditing ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this employee? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Employees;