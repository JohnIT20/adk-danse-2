import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Planning from './pages/Planning';
import Courses from './pages/Courses';
import ProSessions from './pages/ProSessions';
import Registrations from './pages/Registrations';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Materials from './pages/Materials';
import ParentPortal from './pages/portal/ParentPortal';
import ChildView from './pages/portal/ChildView';
import TeacherLayout from './pages/teacher/TeacherLayout';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherCourses from './pages/teacher/TeacherCourses';
import TeacherStudents from './pages/teacher/TeacherStudents';
import TeacherRepresentations from './pages/teacher/TeacherRepresentations';
import TeacherRequests from './pages/teacher/TeacherRequests';
import TeacherPlanning from './pages/teacher/TeacherPlanning';

// Route guard: redirect to /login if not authenticated
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const location = useLocation();
  if (!currentUser) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

// Route guard: redirect based on role
function RootRedirect() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'parent') return <Navigate to="/portail" replace />;
  if (currentUser.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/dashboard" replace />;
}

// Guard: only admin can access admin routes
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'parent') return <Navigate to="/portail" replace />;
  if (currentUser.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <>{children}</>;
}

// Guard: only teachers
function TeacherRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'parent') return <Navigate to="/portail" replace />;
  if (currentUser.role === 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// Guard: only parents
function ParentRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'parent') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Root redirect based on role */}
      <Route path="/" element={<RequireAuth><RootRedirect /></RequireAuth>} />

      {/* Parent portal (no admin sidebar) */}
      <Route path="/portail" element={<ParentRoute><ParentPortal /></ParentRoute>} />
      <Route path="/portail/membre/:studentId" element={<ParentRoute><ChildView /></ParentRoute>} />

      {/* Admin / Teacher routes (with sidebar layout) */}
      <Route path="/dashboard" element={<AdminRoute><Layout><Dashboard /></Layout></AdminRoute>} />
      <Route path="/planning" element={<AdminRoute><Layout><Planning /></Layout></AdminRoute>} />
      <Route path="/cours" element={<AdminRoute><Layout><Courses /></Layout></AdminRoute>} />
      <Route path="/sessions-pro" element={<AdminRoute><Layout><ProSessions /></Layout></AdminRoute>} />
      <Route path="/inscriptions" element={<AdminRoute><Layout><Registrations /></Layout></AdminRoute>} />
      <Route path="/eleves" element={<AdminRoute><Layout><Students /></Layout></AdminRoute>} />
      <Route path="/professeurs" element={<AdminRoute><Layout><Teachers /></Layout></AdminRoute>} />
      <Route path="/materiel" element={<AdminRoute><Layout><Materials /></Layout></AdminRoute>} />

      {/* Teacher routes */}
      <Route path="/teacher" element={<TeacherRoute><TeacherLayout><TeacherDashboard /></TeacherLayout></TeacherRoute>} />
      <Route path="/teacher/planning" element={<TeacherRoute><TeacherLayout><TeacherPlanning /></TeacherLayout></TeacherRoute>} />
      <Route path="/teacher/cours" element={<TeacherRoute><TeacherLayout><TeacherCourses /></TeacherLayout></TeacherRoute>} />
      <Route path="/teacher/eleves" element={<TeacherRoute><TeacherLayout><TeacherStudents /></TeacherLayout></TeacherRoute>} />
      <Route path="/teacher/representations" element={<TeacherRoute><TeacherLayout><TeacherRepresentations /></TeacherLayout></TeacherRoute>} />
      <Route path="/teacher/demandes" element={<TeacherRoute><TeacherLayout><TeacherRequests /></TeacherLayout></TeacherRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
