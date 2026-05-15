import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Planning = lazy(() => import('./pages/Planning'));
const Courses = lazy(() => import('./pages/Courses'));
const ProSessions = lazy(() => import('./pages/ProSessions'));
const Registrations = lazy(() => import('./pages/Registrations'));
const Students = lazy(() => import('./pages/Students'));
const Teachers = lazy(() => import('./pages/Teachers'));
const Materials = lazy(() => import('./pages/Materials'));
const ParentPortal = lazy(() => import('./pages/portal/ParentPortal'));
const ChildView = lazy(() => import('./pages/portal/ChildView'));
const TeacherLayout = lazy(() => import('./pages/teacher/TeacherLayout'));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const TeacherCourses = lazy(() => import('./pages/teacher/TeacherCourses'));
const TeacherStudents = lazy(() => import('./pages/teacher/TeacherStudents'));
const TeacherRepresentations = lazy(() => import('./pages/teacher/TeacherRepresentations'));
const TeacherRequests = lazy(() => import('./pages/teacher/TeacherRequests'));
const TeacherPlanning = lazy(() => import('./pages/teacher/TeacherPlanning'));

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
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center text-purple-600 font-medium">Chargement de l'application...</div>}>
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
    </Suspense>
  );
}

export default function App() {
  const initializeDb = useApp(state => state.initializeDb);

  useEffect(() => {
    initializeDb();
  }, [initializeDb]);

  return (
    <>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}
