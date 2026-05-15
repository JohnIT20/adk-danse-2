import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BookOpen, Users, Bell, Calendar, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  const { currentUser } = useAuth();
  const { courses, courseEnrollments, students, changeRequests, representations, teachers } = useApp();

  const tid = currentUser?.teacherId ?? '';
  const myCourses = courses.filter(c => c.teacherId === tid && c.active);

  const myStudentIds = new Set(
    courseEnrollments
      .filter(e => myCourses.find(c => c.id === e.courseId) && e.status === 'active')
      .map(e => e.studentId)
  );
  const myStudents = students.filter(s => myStudentIds.has(s.id));

  const pendingRequests = changeRequests.filter(
    r => r.status === 'pending' && r.conflictingTeacherId === tid
  );

  const upcomingRep = representations
    .filter(r => r.teacherId === tid && r.date >= format(new Date(), 'yyyy-MM-dd') && r.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const todayDayName = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][new Date().getDay()];
  const todayCourses = myCourses.filter(c => c.dayOfWeek === todayDayName).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Mes cours actifs', value: myCourses.length, icon: BookOpen, color: 'bg-indigo-100 text-indigo-700' },
          { label: 'Mes élèves', value: myStudents.length, icon: Users, color: 'bg-purple-100 text-purple-700' },
          { label: 'Représentations', value: upcomingRep.length, icon: Calendar, color: 'bg-amber-100 text-amber-700' },
          { label: 'Demandes en attente', value: pendingRequests.length, icon: Bell, color: pendingRequests.length > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600', alert: pendingRequests.length > 0 },
        ].map(({ label, value, icon: Icon, color, alert }) => (
          <div key={label} className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-2 sm:mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-800">{value}</div>
            <div className="text-xs sm:text-sm text-gray-500 mt-0.5 flex items-center gap-1 leading-tight">
              {label}
              {alert && <AlertTriangle size={11} className="text-red-500 shrink-0" />}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's courses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen size={17} className="text-indigo-500" />
            Mes cours aujourd'hui
            <span className="text-xs text-gray-400 font-normal capitalize">
              {format(new Date(), 'EEEE d MMMM', { locale: fr })}
            </span>
          </h2>
          {todayCourses.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun cours aujourd'hui.</p>
          ) : (
            <div className="space-y-3">
              {todayCourses.map(c => {
                const count = courseEnrollments.filter(e => e.courseId === c.id && e.status === 'active').length;
                return (
                  <div key={c.id} className="flex items-start gap-3">
                    <div className="w-1 rounded-full self-stretch bg-indigo-500" />
                    <div>
                      <div className="font-medium text-sm text-gray-800">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.startTime}–{c.endTime} · {c.room} · {count} élève(s)</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Link to="/teacher/cours" className="mt-3 text-xs text-indigo-600 hover:underline block">Voir tous mes cours →</Link>
        </div>

        {/* Pending requests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Bell size={17} className="text-red-500" />
            Demandes de changement de créneau
          </h2>
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune demande en attente.</p>
          ) : (
            <div className="space-y-2">
              {pendingRequests.map(r => {
                const requestingTeacher = teachers.find(t => t.id === r.requestingTeacherId);
                return (
                  <div key={r.id} className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                    <div className="font-medium text-orange-800">
                      {requestingTeacher?.firstName} {requestingTeacher?.lastName} demande votre créneau
                    </div>
                    <div className="text-xs text-orange-600 mt-0.5">
                      {r.proposedDay} {r.proposedStartTime}–{r.proposedEndTime} · {r.proposedRoom}
                    </div>
                    {r.requestNote && <div className="text-xs text-gray-500 mt-1 italic">"{r.requestNote}"</div>}
                  </div>
                );
              })}
            </div>
          )}
          <Link to="/teacher/demandes" className="mt-3 text-xs text-indigo-600 hover:underline block">Gérer les demandes →</Link>
        </div>
      </div>

      {/* Upcoming representations */}
      {upcomingRep.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar size={17} className="text-amber-500" />
            Prochaines représentations
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {upcomingRep.map(r => (
              <div key={r.id} className="border border-amber-100 bg-amber-50/40 rounded-xl p-4">
                <div className="font-semibold text-gray-800 text-sm">{r.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {format(parseISO(r.date), 'EEEE d MMMM yyyy', { locale: fr })}
                </div>
                <div className="text-xs text-gray-400">{r.startTime}–{r.endTime} · {r.room}</div>
                <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full ${r.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {r.status === 'confirmed' ? 'Confirmé' : 'Brouillon'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
