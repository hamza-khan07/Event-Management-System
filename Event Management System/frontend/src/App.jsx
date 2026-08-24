import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './Context/AuthContext';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { isAuthenticated, loading } = useAuth();

  // Jab tak session check ho rahi hai, blank screen dikhao
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#6b7280',
        fontFamily: 'system-ui, sans-serif'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* Root → Agar logged in to dashboard, warna login */}
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
      />

      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Route — login zaroori */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Dashboard - Ye sirf Product Manager dekh sakta hai */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['PRODUCT_MANAGER']}>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />


      {/* Create Event Page - Ye Manager ya Organizer dekh sakte hain */}

      <Route
        path="/events/create"
        element={
          <ProtectedRoute allowedRoles={['PRODUCT_MANAGER', 'ORGANIZER']}>
            <CreateEventPage />
          </ProtectedRoute>
        }
      />

      {/* 404 — Koi bhi unknown URL login pe redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
