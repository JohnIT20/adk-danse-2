import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { format, parseISO, differenceInYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronRight, Calendar, Star, Music2, LogOut } from 'lucide-react';

export default function ParentPortal() {
  const { currentUser, logout } = useAuth();
  const { students, courseEnrollments, courses, registrations, proSessions } = useApp();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const myStudents = students.filter(s => currentUser.studentIds.includes(s.id));

  function getStudentCourseCount(studentId: string) {
    return courseEnrollments.filter(e => e.studentId === studentId && e.status === 'active').length;
  }

  function getStudentProCount(studentId: string) {
    return registrations.filter(r => r.studentId === studentId && r.status !== 'rejected').length;
  }

  function getNextCourse(studentId: string): string | null {
    const enrolled = courseEnrollments
      .filter(e => e.studentId === studentId && e.status === 'active')
      .map(e => courses.find(c => c.id === e.courseId))
      .filter(Boolean);
    if (enrolled.length === 0) return null;
    const dayOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const today = new Date().getDay(); // 0=Sun
    const adjustedToday = today === 0 ? 6 : today - 1; // Mon=0

    const sorted = [...enrolled].sort((a, b) => {
      const da = dayOrder.indexOf(a!.dayOfWeek);
      const db = dayOrder.indexOf(b!.dayOfWeek);
      const ra = (da - adjustedToday + 7) % 7;
      const rb = (db - adjustedToday + 7) % 7;
      return ra - rb;
    });
    const next = sorted[0]!;
    return `${next.dayOfWeek} ${next.startTime} — ${next.name}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 shadow-sm">
        <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center">
          <Music2 size={18} className="text-white" />
        </div>
        <div>
          <div className="font-bold text-gray-800 text-sm">Anne DK Danse</div>
          <div className="text-xs text-gray-400">Espace famille</div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:block">Bonjour, <strong>{currentUser.displayName}</strong></span>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            <LogOut size={15} /> Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ma famille</h1>
          <p className="text-gray-500 text-sm mt-0.5">Sélectionnez un membre pour voir son planning et ses cours.</p>
        </div>

        {myStudents.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
            Aucun membre lié à ce compte. Contactez l'école.
          </div>
        ) : (
          <div className="space-y-3">
            {myStudents.map(s => {
              const age = s.birthDate ? differenceInYears(new Date(), parseISO(s.birthDate)) : null;
              const courseCount = getStudentCourseCount(s.id);
              const proCount = getStudentProCount(s.id);
              const nextCourse = getNextCourse(s.id);

              return (
                <button
                  key={s.id}
                  onClick={() => navigate(`/portail/membre/${s.id}`)}
                  className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md hover:border-purple-200 transition-all text-left group"
                >
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
                    {s.firstName[0]}{s.lastName[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-lg">{s.firstName} {s.lastName}</div>
                    {age !== null && (
                      <div className="text-sm text-gray-400">{age} ans</div>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                        <Calendar size={11} /> {courseCount} cours / semaine
                      </span>
                      {proCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                          <Star size={11} /> {proCount} session(s) pro
                        </span>
                      )}
                    </div>
                    {nextCourse && (
                      <div className="text-xs text-gray-400 mt-1.5 truncate">
                        Prochain : {nextCourse}
                      </div>
                    )}
                  </div>

                  <ChevronRight size={20} className="text-gray-300 group-hover:text-purple-500 transition-colors flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* Open pro sessions */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Star size={18} className="text-amber-500" /> Sessions avec coach pro
          </h2>
          <div className="space-y-2">
            {proSessions.filter(s => s.status === 'open').map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-amber-100 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{s.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {format(parseISO(s.date), 'EEEE d MMMM yyyy', { locale: fr })} · {s.startTime}–{s.endTime}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">Coach : {s.coachName} · {s.price}€</div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                    Inscriptions ouvertes
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Clôture le {format(parseISO(s.registrationCloseDate), 'd MMMM', { locale: fr })} · Pour s'inscrire, ouvrez la fiche du membre.
                </div>
              </div>
            ))}
            {proSessions.filter(s => s.status === 'open').length === 0 && (
              <p className="text-sm text-gray-400">Aucune session pro ouverte aux inscriptions pour le moment.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
