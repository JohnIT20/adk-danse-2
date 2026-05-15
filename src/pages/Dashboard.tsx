import { useApp } from '../context/AppContext';
import { format, parseISO, isBefore, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Star, UserCheck, AlertCircle, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { courses, proSessions, registrations, teachers, students } = useApp();
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const upcomingSessions = proSessions
    .filter(s => s.date >= todayStr && s.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const pendingRegistrations = registrations.filter(r => r.status === 'pending');
  const openSessions = proSessions.filter(s => s.status === 'open');

  const todayDayName = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][today.getDay()];
  const todayCourses = courses.filter(c => c.active && c.dayOfWeek === todayDayName).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const stats = [
    { label: 'Cours actifs', value: courses.filter(c => c.active).length, icon: Calendar, color: 'bg-purple-100 text-purple-700' },
    { label: 'Sessions pro', value: openSessions.length, icon: Star, color: 'bg-amber-100 text-amber-700' },
    { label: 'Inscriptions en attente', value: pendingRegistrations.length, icon: UserCheck, color: 'bg-blue-100 text-blue-700', alert: pendingRegistrations.length > 0 },
    { label: 'Élèves inscrits', value: students.length, icon: Users, color: 'bg-green-100 text-green-700' },
  ];

  const sessionsNeedingAttention = proSessions.filter(s => {
    if (s.status !== 'open') return false;
    const closeDate = parseISO(s.registrationCloseDate);
    return isBefore(closeDate, addDays(today, 7));
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color, alert }) => (
          <div key={label} className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-2 sm:mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-1">
              {value}
              {alert && <AlertCircle size={14} className="text-orange-500" />}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 mt-0.5 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Today's courses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-purple-600" />
            Cours aujourd'hui
            <span className="text-sm font-normal text-gray-500 capitalize">
              {format(today, 'EEEE d MMMM', { locale: fr })}
            </span>
          </h2>
          {todayCourses.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucun cours aujourd'hui.</p>
          ) : (
            <div className="space-y-3">
              {todayCourses.map(c => {
                const teacher = teachers.find(t => t.id === c.teacherId);
                return (
                  <div key={c.id} className="flex items-start gap-3">
                    <div
                      className="w-1 rounded-full self-stretch"
                      style={{ backgroundColor: teacher?.color ?? '#7C3AED' }}
                    />
                    <div>
                      <div className="font-medium text-sm text-gray-800">{c.name}</div>
                      <div className="text-xs text-gray-500">
                        {c.startTime}–{c.endTime} · {c.room} · {teacher?.firstName} {teacher?.lastName}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming pro sessions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Star size={18} className="text-amber-500" />
            Prochaines sessions pro
          </h2>
          {upcomingSessions.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucune session à venir.</p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map(s => {
                const regCount = registrations.filter(r => r.sessionId === s.id).length;
                return (
                  <div key={s.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="font-medium text-sm text-gray-800 truncate">{s.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {format(parseISO(s.date), 'd MMMM yyyy', { locale: fr })} · {s.startTime}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.status === 'open' ? 'bg-green-100 text-green-700' :
                        s.status === 'closed' ? 'bg-gray-100 text-gray-600' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {s.status === 'open' ? 'Ouvert' : s.status === 'closed' ? 'Fermé' : s.status}
                      </span>
                      <span className="text-xs text-gray-500">{regCount}/{s.capacity} places</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Link to="/sessions-pro" className="mt-3 text-xs text-purple-600 hover:underline block">
            Voir toutes les sessions →
          </Link>
        </div>

        {/* Pending registrations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <UserCheck size={18} className="text-blue-600" />
            Inscriptions en attente
          </h2>
          {pendingRegistrations.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucune inscription en attente.</p>
          ) : (
            <div className="space-y-2">
              {pendingRegistrations.slice(0, 5).map(r => {
                const session = proSessions.find(s => s.id === r.sessionId);
                const student = students.find(s => s.id === r.studentId);
                return (
                  <div key={r.id} className="flex items-center justify-between text-sm p-2 bg-orange-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">{student?.firstName} {student?.lastName}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[140px]">{session?.title}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full whitespace-nowrap">
                      En attente
                    </span>
                  </div>
                );
              })}
              {pendingRegistrations.length > 5 && (
                <div className="text-xs text-gray-400">+{pendingRegistrations.length - 5} autres</div>
              )}
            </div>
          )}
          <Link to="/inscriptions" className="mt-3 text-xs text-purple-600 hover:underline block">
            Gérer les inscriptions →
          </Link>
        </div>
      </div>

      {/* Sessions closing soon */}
      {sessionsNeedingAttention.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={18} className="text-orange-600" />
            <h3 className="font-semibold text-orange-800 text-sm">Inscriptions se fermant bientôt</h3>
          </div>
          <div className="space-y-1">
            {sessionsNeedingAttention.map(s => (
              <div key={s.id} className="text-sm text-orange-700">
                <span className="font-medium">{s.title}</span> — fermeture le{' '}
                {format(parseISO(s.registrationCloseDate), 'd MMMM yyyy', { locale: fr })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
