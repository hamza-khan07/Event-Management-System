import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './Context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CompaniesPage from './pages/companiesPage';
import OrganizersPage from './pages/OrganizersPage';
import ParticipantsPage from './pages/ParticipantsPage';
import OrganizerDashboardPage from './pages/OrganizerDashboardPage';
import OrganizerCompanyPage from './pages/OrganizerCompanyPage';
import MyEventsPage from './pages/MyEventsPage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage'; // ← yeh missing tha!

function App() {
  const { isAuthenticated, loading, user } = useAuth();

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
      {/* Root → Agar logged in to dashboard (role based), warna login */}
      <Route
        path="/"
        element={
          isAuthenticated
            ? (user?.role === 'ORGANIZER' ? <Navigate to="/organizer/dashboard" replace /> : <Navigate to="/dashboard" replace />)
            : <Navigate to="/login" replace />
        }
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

      {/* PRODUCT_MANAGER Routes */}
      <Route
        path="/companies"
        element={
          <ProtectedRoute allowedRoles={['PRODUCT_MANAGER']}>
            <CompaniesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizers"
        element={
          <ProtectedRoute allowedRoles={['PRODUCT_MANAGER']}>
            <OrganizersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/participants"
        element={
          <ProtectedRoute allowedRoles={['PRODUCT_MANAGER']}>
            <ParticipantsPage />
          </ProtectedRoute>
        }
      />

      {/* ORGANIZER Routes */}
      <Route
        path="/organizer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ORGANIZER']}>
            <OrganizerDashboardPage />
          </ProtectedRoute>
        }
      />
      {/* Organizer ki company profile */}
      <Route
        path="/organizer/company"
        element={
          <ProtectedRoute allowedRoles={['ORGANIZER']}>
            <OrganizerCompanyPage />
          </ProtectedRoute>
        }
      />

      {/* My Events list page */}
      <Route
        path="/organizer/events"
        element={
          <ProtectedRoute allowedRoles={['ORGANIZER']}>
            <MyEventsPage />
          </ProtectedRoute>
        }
      />

      {/* Create Event form page */}
      <Route
        path="/organizer/events/create"
        element={
          <ProtectedRoute allowedRoles={['ORGANIZER']}>
            <CreateEventPage />
          </ProtectedRoute>
        }
      />

      {/* Edit Event form page — :id → dynamic event ID */}
      <Route
        path="/organizer/events/edit/:id"
        element={
          <ProtectedRoute allowedRoles={['ORGANIZER']}>
            <EditEventPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
