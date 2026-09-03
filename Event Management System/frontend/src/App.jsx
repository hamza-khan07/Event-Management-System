// frontend/src/App.jsx
// RESPONSIBILITY: Root router. Public landing at "/", protected dashboards behind auth.

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './Context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
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
import EditEventPage from './pages/EditEventPage';
import AllEventsPage from './pages/AllEventsPage'; // /events — public dedicated page
import EventDetailPage from './pages/EventDetailPage'; // /events/:id — single event detail

function App() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', fontSize: '18px', color: '#6b7280',
        fontFamily: 'system-ui, sans-serif'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public landing page -- always accessible at "/" */}
      <Route path="/" element={<LandingPage />} />

      {/* Public: All Events page */}
      <Route path="/events" element={<AllEventsPage />} />

      {/* Public: Single Event Detail page — :id se event dhundhta hai */}

      <Route path="/events/:id" element={<EventDetailPage />} />

      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected: Generic dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Protected: PRODUCT_MANAGER Routes */}
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

      {/* Protected: ORGANIZER Routes */}
      <Route
        path="/organizer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ORGANIZER']}>
            <OrganizerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/company"
        element={
          <ProtectedRoute allowedRoles={['ORGANIZER']}>
            <OrganizerCompanyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/events"
        element={
          <ProtectedRoute allowedRoles={['ORGANIZER']}>
            <MyEventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/events/create"
        element={
          <ProtectedRoute allowedRoles={['ORGANIZER']}>
            <CreateEventPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/events/edit/:id"
        element={
          <ProtectedRoute allowedRoles={['ORGANIZER']}>
            <EditEventPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
