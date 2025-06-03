import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import './App.css';

// Components
import SidebarComponent from './components/SidebarComponents/SidebarComponent';
import PlaceholderPage from './components/PlaceholderPage';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard/Dashboard';
import Employees from './pages/Employee/Employees';
import EmployeeForm from './pages/Employee/EmployeeForm';
import Equipment from './pages/Equipment/Equipment';
import EquipmentForm from './pages/Equipment/EquipmentForm';
import Transport from './pages/Transport/Transport';
import TransportForm from './pages/Transport/TransportForm';
import Tools from './pages/Tools/Tools';
import ToolsForm from './pages/Tools/ToolsForm';
import Spares from './pages/Spares/Spares';
import SparesForm from './pages/Spares/SparesForm';
import Materials from './pages/Materials/Materials';
import MaterialsForm from './pages/Materials/MaterialsForm';
import Schedule from './pages/Schedule/Schedule';
import Auth from './pages/Auth/Auth';
import UserManagement from './components/UserManagement/UserManagement';
import Expenses from './pages/Expenses/Expenses';
import ExpenseForm from './pages/Expenses/ExpenseForm';
import ExpenseDocx from './pages/Expenses/ExpenseDocx';
import StorageLocations from './pages/StorageLocations/StorageLocations';
import EmployeeDocx from './pages/Employee/EmployeeDocx';
import ScheduleDocx from './pages/Schedule/ScheduleDocx';
import EquipmentDocx from './pages/Equipment/EquipmentDocx';
import TransportDocx from './pages/Transport/TransportDocx';
import ToolsDocx from './pages/Tools/ToolsDocx';
import SparesDocx from './pages/Spares/SparesDocx';
import MaterialsDocx from './pages/Materials/MaterialsDocx';

// Context
import { AuthProvider } from './context/AuthContext';

const { Content } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const siteLayoutRef = useRef(null);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) { // Collapse sidebar automatically on mobile
        setCollapsed(true);
      }
    };

    window.addEventListener('resize', checkMobile);
    checkMobile(); // Initial check

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Add/remove class for layout transition animation
  useEffect(() => {
    const siteLayout = siteLayoutRef.current;
    if (!siteLayout) return;

    // Add class to trigger transition
    siteLayout.classList.add('layout-transitioning');

    // Use setTimeout to remove the class after the transition duration
    const timer = setTimeout(() => {
      siteLayout.classList.remove('layout-transitioning');
    }, 200); // Match transition duration in App.css (0.2s)

    return () => clearTimeout(timer); // Cleanup timer on unmount or change

  }, [collapsed]); // Re-run when collapsed state changes

  // Mobile backdrop click handler
  const handleBackdropClick = () => {
    if (isMobile && !collapsed) {
      setCollapsed(true);
    }
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          
          <Route path="/*" element={
            <Layout style={{ minHeight: '100vh' }}>
              <SidebarComponent
                collapsed={collapsed}
                setCollapsed={setCollapsed}
              />

              {/* Mobile backdrop */}
              {isMobile && !collapsed && (
                <div
                  className="mobile-sidebar-backdrop visible"
                  onClick={handleBackdropClick}
                />
              )}

              <Layout
                className={`site-layout ${collapsed ? 'sidebar-collapsed' : ''}`}
                ref={siteLayoutRef}
                style={{ marginLeft: collapsed ? (isMobile ? 0 : 80) : (isMobile ? 0 : 200) }}
              >
                <Content className="content-area">
                  <Routes>
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/employees" element={
                      <ProtectedRoute>
                        <Employees />
                      </ProtectedRoute>
                    } />
                    <Route path="/employees/add" element={
                      <ProtectedRoute>
                        <EmployeeForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/employees/edit/:id" element={
                      <ProtectedRoute>
                        <EmployeeForm />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/equipment" element={
                      <ProtectedRoute>
                        <Equipment />
                      </ProtectedRoute>
                    } />
                    <Route path="/equipment/add" element={
                      <ProtectedRoute>
                        <EquipmentForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/equipment/edit/:id" element={
                      <ProtectedRoute>
                        <EquipmentForm />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/transport" element={
                      <ProtectedRoute>
                        <Transport />
                      </ProtectedRoute>
                    } />
                    <Route path="/transport/add" element={
                      <ProtectedRoute>
                        <TransportForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/transport/edit/:id" element={
                      <ProtectedRoute>
                        <TransportForm />
                      </ProtectedRoute>
                    } />

                      <Route path="/transport/report" element={
                      <ProtectedRoute>
                        <TransportDocx />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/tools" element={
                      <ProtectedRoute>
                        <Tools />
                      </ProtectedRoute>
                    } />
                    <Route path="/tools/add" element={
                      <ProtectedRoute>
                        <ToolsForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/tools/edit/:id" element={
                      <ProtectedRoute>
                        <ToolsForm />
                      </ProtectedRoute>
                    } />

                    <Route path="/tools/report" element={
                    <ProtectedRoute>
                      <ToolsDocx />
                    </ProtectedRoute>
                  } />

                    <Route path="/spares" element={
                      <ProtectedRoute>
                        <Spares />
                      </ProtectedRoute>
                    } />
                    <Route path="/spares/add" element={
                      <ProtectedRoute>
                        <SparesForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/spares/edit/:id" element={
                      <ProtectedRoute>
                        <SparesForm />
                      </ProtectedRoute>
                    } />

                    <Route path="/spares/report" element={
                    <ProtectedRoute>
                      <SparesDocx />
                    </ProtectedRoute>
                  } />

                    <Route path="/materials" element={
                      <ProtectedRoute>
                        <Materials />
                      </ProtectedRoute>
                    } />
                    <Route path="/materials/add" element={
                      <ProtectedRoute>
                        <MaterialsForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/materials/edit/:id" element={
                      <ProtectedRoute>
                        <MaterialsForm />
                      </ProtectedRoute>
                    } />

                    <Route path="/materials/report" element={
                    <ProtectedRoute>
                      <MaterialsDocx />
                    </ProtectedRoute>
                  } />
                    
                    <Route path="/storage-locations" element={
                      <ProtectedRoute>
                        <StorageLocations />
                      </ProtectedRoute>
                    } />

                    <Route path="/schedule" element={
                      <ProtectedRoute>
                        <Schedule />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/users" element={
                      <ProtectedRoute>
                        <UserManagement />
                      </ProtectedRoute>
                    } />

                    <Route path="/expenses" element={
                      <ProtectedRoute>
                        <Expenses />
                      </ProtectedRoute>
                    } />
                    <Route path="/expenses/new" element={
                      <ProtectedRoute>
                        <ExpenseForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/expenses/edit/:id" element={
                      <ProtectedRoute>
                        <ExpenseForm />
                      </ProtectedRoute>
                    } />
<Route path="/expenses/report" element={<ExpenseDocx />} />
<Route path="/employees/report" element={<EmployeeDocx />} />
<Route path="/schedule/report" element={<ScheduleDocx />} />
<Route path="/equipment/report" element={<EquipmentDocx />} />
                    
                    {/* Redirect any unknown paths to the dashboard */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Content>
              </Layout>
            </Layout>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;