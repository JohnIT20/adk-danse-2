import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, BookOpen, Star, Users, Shirt, UserCheck, Menu, X, Music2, LogOut, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/planning', icon: Calendar, label: 'Planning' },
  { to: '/cours', icon: BookOpen, label: 'Cours réguliers' },
  { to: '/sessions-pro', icon: Star, label: 'Sessions Pro' },
  { to: '/inscriptions', icon: UserCheck, label: 'Inscriptions' },
  { to: '/eleves', icon: Users, label: 'Élèves' },
  { to: '/professeurs', icon: Users, label: 'Professeurs' },
  { to: '/materiel', icon: Shirt, label: 'Tenues & Spectacles' },
  { to: '/comptes', icon: ShieldAlert, label: 'Gestion des accès' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-purple-900 text-white flex flex-col
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-5 border-b border-purple-700">
          <div className="w-9 h-9 bg-purple-400 rounded-lg flex items-center justify-center">
            <Music2 size={20} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">Anne DK Danse</div>
            <div className="text-purple-300 text-xs">Gestion Planning</div>
          </div>
          <button
            className="ml-auto lg:hidden text-purple-300 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'text-purple-200 hover:bg-purple-800 hover:text-white'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-purple-700 space-y-2">
          {currentUser && (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-purple-200 font-medium">{currentUser.displayName}</div>
                <div className="text-xs text-purple-400 capitalize">{currentUser.role}</div>
              </div>
              <button onClick={handleLogout} className="p-1.5 text-purple-400 hover:text-white hover:bg-purple-800 rounded-lg" title="Déconnexion">
                <LogOut size={15} />
              </button>
            </div>
          )}
          <div className="text-xs text-purple-500">© 2026 Anne DK Danse</div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-800"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <h1 className="font-semibold text-gray-800 text-base">
            {nav.find(n => location.pathname.startsWith(n.to))?.label ?? 'Anne DK Danse'}
          </h1>
          <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
            {currentUser && (
              <span className="hidden sm:inline text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full capitalize">
                {currentUser.role} — {currentUser.displayName}
              </span>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
