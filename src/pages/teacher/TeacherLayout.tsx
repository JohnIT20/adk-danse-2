import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, BookOpen, Users, Calendar, CalendarCheck, Bell, Menu, X, Music2, LogOut,
} from 'lucide-react';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useAuth();
  const { changeRequests } = useApp();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const pendingRequests = changeRequests.filter(
    r => r.status === 'pending' && r.conflictingTeacherId === currentUser?.teacherId
  ).length;

  const nav = [
    { to: '/teacher', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/teacher/planning', icon: Calendar, label: 'Mon planning' },
    { to: '/teacher/cours', icon: BookOpen, label: 'Mes cours' },
    { to: '/teacher/eleves', icon: Users, label: 'Mes élèves' },
    { to: '/teacher/representations', icon: CalendarCheck, label: 'Représentations' },
    { to: '/teacher/demandes', icon: Bell, label: 'Demandes', badge: pendingRequests },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-indigo-900 text-white flex flex-col transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 p-5 border-b border-indigo-700">
          <div className="w-9 h-9 bg-indigo-400 rounded-lg flex items-center justify-center">
            <Music2 size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm">Anne DK Danse</div>
            <div className="text-indigo-300 text-xs truncate">Espace professeur</div>
          </div>
          <button className="lg:hidden text-indigo-300" onClick={() => setOpen(false)}><X size={16} /></button>
        </div>

        <div className="px-4 py-3 border-b border-indigo-700">
          <div className="text-sm font-semibold text-white">{currentUser?.displayName}</div>
          <div className="text-xs text-indigo-300">Professeur</div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/teacher'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'}`
              }
              onClick={() => setOpen(false)}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {badge != null && badge > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{badge}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-700 flex items-center justify-between">
          <div className="text-xs text-indigo-400">© 2026 Anne DK Danse</div>
          <button onClick={() => { logout(); navigate('/login'); }} className="p-1.5 text-indigo-400 hover:text-white hover:bg-indigo-800 rounded-lg" title="Déconnexion">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button className="lg:hidden text-gray-500" onClick={() => setOpen(true)}><Menu size={22} /></button>
          <span className="font-semibold text-gray-800 text-base">
            {nav.find(n => (n.to === '/teacher' ? location.pathname === '/teacher' : location.pathname.startsWith(n.to)))?.label ?? 'Espace professeur'}
          </span>
          {pendingRequests > 0 && (
            <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
              <Bell size={12} /> {pendingRequests} demande(s) en attente
            </span>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
