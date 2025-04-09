import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Container,
  ThemeProvider,
  createTheme,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

import Employees from './pages/Employees';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

const drawerWidth = 240;

function App() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ overflow: 'auto' }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          PKUP Kommunalnik
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/">
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/employees">
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Employees" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <AppBar
            position="fixed"
            sx={{
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              ml: { sm: `${drawerWidth}px` },
            }}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap component="div">
                PKUP Kommunalnik
              </Typography>
            </Toolbar>
          </AppBar>
          <Box
            component="nav"
            sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            aria-label="navigation drawer"
          >
            {/* Mobile drawer */}
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              sx={{
                display: { xs: 'block', sm: 'none' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
              }}
            >
              {drawer}
            </Drawer>
            {/* Desktop drawer */}
            <Drawer
              variant="permanent"
              sx={{
                display: { xs: 'none', sm: 'block' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
              }}
              open
            >
              {drawer}
            </Drawer>
          </Box>
          <Box
            component="main"
            sx={{ 
              flexGrow: 1, 
              p: 3, 
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              mt: '64px', // height of AppBar
              minHeight: 'calc(100vh - 64px)'
            }}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/employees" element={<Employees />} />
              {/* Add routes for other tables */}
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

// Home component using Material UI
const Home = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1">
        Welcome to PKUP Kommunalnik Management System
      </Typography>
      <Typography variant="body1" paragraph>
        Select a module from the navigation menu to get started managing your data.
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Employees
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage employee information, positions, departments, and more.
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                component={RouterLink} 
                to="/employees"
                endIcon={<ChevronRightIcon />}
              >
                Go to Employees
              </Button>
            </CardActions>
          </Card>
        </Grid>
        {/* Add more module cards here */}
      </Grid>
    </Container>
  );
};

export default App;