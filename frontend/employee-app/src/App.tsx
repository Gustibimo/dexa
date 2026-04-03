import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/useAuth';
import LoginPage from './auth/LoginPage';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import ProfilePage from './profile/ProfilePage';
import LiveAttendancePage from './attendance/LiveAttendancePage';
import AttendanceSummaryPage from './attendance/AttendanceSummaryPage';

function AppRoutes() {
  const { isAuthenticated, isLoading, employee, login, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/attendance" replace />
          ) : (
            <LoginPage onLogin={login} />
          )
        }
      />
      <Route
        element={
          isAuthenticated ? (
            <Layout employeeName={employee?.name || ''} onLogout={logout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/attendance" element={<LiveAttendancePage />} />
        <Route path="/summary" element={<AttendanceSummaryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/attendance" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  );
}
