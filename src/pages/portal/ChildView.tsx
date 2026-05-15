import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  format, startOfWeek, addDays, parseISO, isSameDay, differenceInYears,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, ArrowLeft, Star, Shirt, Calendar,
  CheckCircle, Euro, Plus, X, AlertCircle, CreditCard, Clock,
} from 'lucide-react';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

type ViewMode = 'calendar' | 'courses' | 'sessions' | 'attire';

export default function ChildView() {
  const { studentId } = useParams<{ studentId: string }>();
  const { currentUser } = useAuth();
  const {
    students, courses, courseEnrollments, registrations, proSessions, teachers,
    addCourseEnrollment, updateCourseEnrollment, deleteCourseEnrollment, addRegistration,
  } = useApp();
  const navigate = useNavigate();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [view, setView] = useState<ViewMode>('calendar');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [selectedProSession, setSelectedProSession] = useState<string | null>(null);

  const student = students.find(s => s.id === studentId);

  // Guard: only the parent who owns this student can view
  if (!currentUser || !studentId || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Membre introuvable.
      </div>
    );
  }
  if (currentUser.role === 'parent' && !currentUser.studentIds.includes(studentId)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Accès non autorisé.
      </div>
    );
  }

  const age = student.birthDate ? differenceInYears(new Date(), parseISO(student.birthDate)) : null;

  // All my enrollments (active, pending, validated)
  const myEnrollments = courseEnrollments.filter(e =>
    e.studentId === studentId && (e.status === 'active' || e.status === 'pending' || e.status === 'validated')
  );
  const myCourses = myEnrollments.map(e => courses.find(c => c.id === e.courseId)).filter(Boolean) as typeof courses;

  // My pro registrations
  const myProRegs = registrations.filter(r => r.studentId === studentId);
  const myProSessions = myProRegs.map(r => proSessions.find(s => s.id === r.sessionId)).filter(Boolean) as typeof proSessions;

  // Available courses not yet enrolled (exclude all active statuses)
  const allMyEnrollmentCourseIds = courseEnrollments
    .filter(e => e.studentId === studentId && e.status !== 'cancelled' && e.status !== 'rejected')
    .map(e => e.courseId);
  const availableCourses = courses.filter(c =>
    c.active && !allMyEnrollmentCourseIds.includes(c.id)
  );

  // Available pro sessions not yet registered
  const today = format(new Date(), 'yyyy-MM-dd');
  const openProSessions = proSessions.filter(s =>
    s.status === 'open' &&
    s.date >= today &&
    s.registrationOpenDate <= today &&
    s.registrationCloseDate >= today &&
    !myProRegs.find(r => r.sessionId === s.id)
  );

  // Week calendar
  const weekDays = DAYS.map((_, i) => addDays(weekStart, i));

  function prevWeek() { setWeekStart(d => addDays(d, -7)); }
  function nextWeek() { setWeekStart(d => addDays(d, 7)); }
  function goToday() { setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 })); }

  const MIN_HOUR = 8;
  const TOTAL_MIN = 14 * 60;

  function posStyle(start: string, end: string) {
    const s = timeToMin(start) - MIN_HOUR * 60;
    const e = timeToMin(end) - MIN_HOUR * 60;
    return { top: `${(s / TOTAL_MIN) * 100}%`, height: `${((e - s) / TOTAL_MIN) * 100}%` };
  }

  function enrollInCourse(courseId: string) {
    addCourseEnrollment({
      id: generateId(),
      courseId,
      studentId: studentId!,
      enrolledAt: format(new Date(), 'yyyy-MM-dd'),
      status: 'pending',
      paymentStatus: 'pending',
    });
    setShowEnrollModal(false);
  }

  function unenroll(courseId: string) {
    const enrollment = myEnrollments.find(e => e.courseId === courseId);
    if (enrollment) deleteCourseEnrollment(enrollment.id);
  }

  function markCoursePaid(enrollmentId: string) {
    const enrollment = courseEnrollments.find(e => e.id === enrollmentId);
    if (!enrollment) return;
    updateCourseEnrollment({ ...enrollment, status: 'active', paymentStatus: 'paid' });
  }

  function registerForProSession(sessionId: string) {
    addRegistration({
      id: generateId(),
      sessionId,
      studentId: studentId!,
      registrationDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'pending',
      paymentStatus: 'pending',
    });
    setShowProModal(false);
  }

  const STATUS_LABELS: Record<string, string> = {
    pending: 'En attente', validated: 'Validé', rejected: 'Refusé', waitlist: 'Liste attente',
  };
  const PAY_LABELS: Record<string, string> = {
    pending: 'Paiement en attente', paid: 'Payé', cancelled: 'Annulé', refunded: 'Remboursé',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm sticky top-0 z-10">
        <button
          onClick={() => navigate('/portail')}
          className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm">
          {student.firstName[0]}{student.lastName[0]}
        </div>
        <div>
          <div className="font-bold text-gray-800">{student.firstName} {student.lastName}</div>
          {age !== null && <div className="text-xs text-gray-400">{age} ans</div>}
        </div>
      </header>

      {/* Nav tabs */}
      <div className="bg-white border-b border-gray-100 px-4 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {([
            ['calendar', 'Planning', <Calendar size={14} />],
            ['courses', `Cours (${myEnrollments.length})`, <CheckCircle size={14} />],
            ['sessions', `Sessions pro (${myProRegs.length})`, <Star size={14} />],
            ['attire', 'Tenues', <Shirt size={14} />],
          ] as [ViewMode, string, React.ReactNode][]).map(([v, label, icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                view === v
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5">

        {/* ===== CALENDAR VIEW ===== */}
        {view === 'calendar' && (
          <div className="space-y-4">
            {/* Week nav */}
            <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-2 shadow-sm">
              <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronLeft size={18} /></button>
              <span className="font-semibold text-gray-700 text-sm flex-1 text-center">
                {format(weekStart, 'd MMM', { locale: fr })} – {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: fr })}
              </span>
              <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronRight size={18} /></button>
              <button onClick={goToday} className="px-2.5 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 whitespace-nowrap">Aujourd'hui</button>
            </div>

            {/* Calendar grid */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="overflow-x-auto rounded-xl">
                <div style={{ minWidth: '460px' }}>
              {/* Day headers */}
              <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: '44px repeat(7, 1fr)' }}>
                <div />
                {weekDays.map((day, i) => {
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div key={i} className={`p-2 text-center border-l border-gray-100 ${isToday ? 'bg-purple-50' : ''}`}>
                      <div className="text-xs text-gray-400">{DAYS[i].slice(0, 3)}</div>
                      <div className={`text-sm font-bold mt-0.5 ${isToday ? 'text-purple-700' : 'text-gray-700'}`}>{format(day, 'd')}</div>
                    </div>
                  );
                })}
              </div>

              {/* Time grid */}
              <div className="overflow-y-auto" style={{ height: 'clamp(260px, 55vh, 500px)' }}>
                <div className="grid h-full relative" style={{ gridTemplateColumns: '44px repeat(7, 1fr)', height: '840px' }}>
                  {/* Hours */}
                  <div className="relative">
                    {Array.from({ length: 14 }, (_, i) => i + MIN_HOUR).map(h => (
                      <div key={h} className="absolute right-1 text-xs text-gray-400 -translate-y-2 text-right"
                        style={{ top: `${((h - MIN_HOUR) / 14) * 100}%` }}>
                        {h}h
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {weekDays.map((day, di) => {
                    const dayName = DAYS[di];
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isToday = isSameDay(day, new Date());

                    // Regular enrolled courses for this day
                    const dayCourses = myCourses.filter(c => c.dayOfWeek === dayName);

                    // Pro sessions on this date
                    const dayProSessions = myProSessions.filter(s => s.date === dateStr);

                    return (
                      <div key={di} className={`relative border-l border-gray-100 ${isToday ? 'bg-purple-50/20' : ''}`}
                        style={{ height: '840px' }}>
                        {/* Hour lines */}
                        {Array.from({ length: 14 }, (_, i) => i + MIN_HOUR).map(h => (
                          <div key={h} className="absolute left-0 right-0 border-t border-gray-100"
                            style={{ top: `${((h - MIN_HOUR) / 14) * 100}%` }} />
                        ))}

                        {/* Enrolled courses */}
                        {dayCourses.map(c => {
                          const teacher = teachers.find(t => t.id === c.teacherId);
                          const ps = posStyle(c.startTime, c.endTime);
                          return (
                            <div key={c.id} className="absolute left-0.5 right-0.5 rounded-lg p-1.5 text-white overflow-hidden z-10"
                              style={{ ...ps, backgroundColor: teacher?.color ?? '#7C3AED' }}>
                              <div className="text-xs font-semibold leading-tight truncate">{c.name}</div>
                              <div className="text-xs opacity-80">{c.startTime}–{c.endTime}</div>
                            </div>
                          );
                        })}

                        {/* Pro sessions */}
                        {dayProSessions.map(s => {
                          const reg = myProRegs.find(r => r.sessionId === s.id);
                          const ps = posStyle(s.startTime, s.endTime);
                          return (
                            <div key={s.id} className="absolute left-0.5 right-0.5 rounded-lg p-1.5 overflow-hidden z-10 border border-amber-300"
                              style={{ ...ps, backgroundColor: '#FEF3C7', color: '#92400E' }}>
                              <div className="text-xs font-semibold leading-tight truncate">⭐ {s.title}</div>
                              <div className="text-xs opacity-80">{s.startTime}–{s.endTime}</div>
                              {reg && <div className="text-xs mt-0.5 opacity-70">{STATUS_LABELS[reg.status]}</div>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== COURSES VIEW ===== */}
        {view === 'courses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{myEnrollments.filter(e => e.status === 'active').length} cours actifs · {myEnrollments.filter(e => e.status === 'pending').length} en attente · {myEnrollments.filter(e => e.status === 'validated').length} à payer</p>
              <button
                onClick={() => setShowEnrollModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 text-sm font-medium"
              >
                <Plus size={15} /> S'inscrire à un cours
              </button>
            </div>

            {myCourses.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                Aucun cours inscrit pour le moment.
              </div>
            )}

            <div className="space-y-3">
              {myEnrollments.map(enrollment => {
                const c = courses.find(x => x.id === enrollment.courseId);
                if (!c) return null;
                const teacher = teachers.find(t => t.id === c.teacherId);
                const isValidated = enrollment.status === 'validated';
                const isPending = enrollment.status === 'pending';
                const isActive = enrollment.status === 'active';
                return (
                  <div key={enrollment.id} className={`bg-white rounded-2xl border p-4 shadow-sm flex flex-col gap-3 ${isValidated ? 'border-green-200' : 'border-gray-100'}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: teacher?.color ?? '#7C3AED' }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800">{c.name}</div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {c.dayOfWeek} · {c.startTime}–{c.endTime} · {c.room}
                        </div>
                        {teacher && (
                          <div className="text-xs text-gray-400 mt-0.5">Professeur : {teacher.firstName} {teacher.lastName}</div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{c.style}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.level}</span>
                          {c.price > 0 && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <Euro size={10} />{c.price}{c.priceLabel}
                            </span>
                          )}
                          {isPending && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Clock size={10} /> En attente validation</span>
                          )}
                          {isActive && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Inscrit</span>
                          )}
                        </div>
                      </div>
                      {(isPending || isActive) && (
                        <button
                          onClick={() => unenroll(c.id)}
                          className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          title="Annuler la demande"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                    {isValidated && enrollment.paymentStatus === 'pending' && (
                      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                        <div className="text-sm text-green-800 flex items-center gap-2">
                          <CreditCard size={15} className="text-green-600 flex-shrink-0" />
                          <span>Inscription validée — paiement requis pour confirmer la place.</span>
                        </div>
                        <button
                          onClick={() => markCoursePaid(enrollment.id)}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 whitespace-nowrap font-medium"
                        >
                          Confirmer le paiement
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== PRO SESSIONS VIEW ===== */}
        {view === 'sessions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{myProRegs.length} inscription(s)</p>
              {openProSessions.length > 0 && (
                <button
                  onClick={() => setShowProModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 text-sm font-medium"
                >
                  <Plus size={15} /> S'inscrire à une session
                </button>
              )}
            </div>

            {myProRegs.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                Aucune inscription à une session pro.
              </div>
            )}

            <div className="space-y-3">
              {myProRegs.map(reg => {
                const session = proSessions.find(s => s.id === reg.sessionId);
                if (!session) return null;
                return (
                  <div key={reg.id} className="bg-white rounded-2xl border border-amber-100 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                          <Star size={15} className="text-amber-500" /> {session.title}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {format(parseISO(session.date), 'EEEE d MMMM yyyy', { locale: fr })} · {session.startTime}–{session.endTime}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">Coach : {session.coachName} · {session.price}€</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            reg.status === 'validated' ? 'bg-green-100 text-green-700' :
                            reg.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            reg.status === 'waitlist' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {STATUS_LABELS[reg.status]}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            reg.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-600'
                          }`}>
                            {PAY_LABELS[reg.paymentStatus]}
                          </span>
                        </div>
                      </div>
                    </div>
                    {reg.status === 'validated' && reg.paymentStatus === 'pending' && (
                      <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-700 flex items-center gap-2">
                        <AlertCircle size={13} /> Paiement en attente — contactez l'école pour régler votre inscription.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Open sessions not yet registered */}
            {openProSessions.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 text-sm mb-2">Sessions disponibles</h3>
                <div className="space-y-2">
                  {openProSessions.map(s => (
                    <div key={s.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-gray-800 text-sm">{s.title}</div>
                        <div className="text-xs text-gray-500">
                          {format(parseISO(s.date), 'd MMMM yyyy', { locale: fr })} · {s.price}€
                        </div>
                        <div className="text-xs text-gray-400">
                          Clôture : {format(parseISO(s.registrationCloseDate), 'd MMMM', { locale: fr })}
                        </div>
                      </div>
                      <button
                        onClick={() => { setSelectedProSession(s.id); setShowProModal(true); }}
                        className="px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 whitespace-nowrap"
                      >
                        S'inscrire
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== ATTIRE VIEW ===== */}
        {view === 'attire' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Tenues et équipements requis pour les cours de {student.firstName}.</p>
            {myCourses.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                Aucun cours inscrit.
              </div>
            )}
            {myCourses.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="font-semibold text-gray-800">{c.name}</div>
                  <div className="text-xs text-gray-400">{c.dayOfWeek} · {c.startTime}–{c.endTime}</div>
                </div>
                <div className="p-5">
                  {c.attire.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Aucune tenue spécifique requise.</p>
                  ) : (
                    <div className="space-y-3">
                      {c.attire.map(a => (
                        <div key={a.id} className="flex items-start gap-3">
                          <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${a.mandatory ? 'bg-red-400' : 'bg-gray-300'}`} />
                          <div>
                            <div className="font-medium text-sm text-gray-800">
                              {a.name}
                              <span className="ml-1.5 text-xs font-normal text-gray-400">
                                ({a.mandatory ? 'obligatoire' : 'optionnel'})
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">{a.description}</div>
                            {(a.color || a.brand) && (
                              <div className="text-xs text-gray-400 mt-0.5">
                                {a.color && <span>Couleur : <strong>{a.color}</strong></span>}
                                {a.color && a.brand && ' · '}
                                {a.brand && <span>Marque : <strong>{a.brand}</strong></span>}
                              </div>
                            )}
                            {a.notes && <div className="text-xs text-gray-400 italic mt-0.5">{a.notes}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== ENROLL IN COURSE MODAL ===== */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Cours disponibles</h2>
              <button onClick={() => setShowEnrollModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {availableCourses.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">{student.firstName} est déjà inscrit(e) à tous les cours disponibles.</p>
              )}
              {availableCourses.map(c => {
                const teacher = teachers.find(t => t.id === c.teacherId);
                return (
                  <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: teacher?.color ?? '#7C3AED' }} />
                      <div>
                        <div className="font-medium text-sm text-gray-800">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.dayOfWeek} · {c.startTime}–{c.endTime} · {c.ageGroup}</div>
                        {c.price > 0 && <div className="text-xs text-green-600">{c.price}€{c.priceLabel}</div>}
                      </div>
                    </div>
                    <button
                      onClick={() => enrollInCourse(c.id)}
                      className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 whitespace-nowrap ml-2"
                    >
                      Demander
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">L'inscription sera confirmée par l'école après validation.</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== PRO SESSION MODAL ===== */}
      {showProModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Sessions pro ouvertes</h2>
              <button onClick={() => { setShowProModal(false); setSelectedProSession(null); }}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {openProSessions.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">Aucune session disponible actuellement.</p>
              )}
              {openProSessions.map(s => {
                const regCount = registrations.filter(r => r.sessionId === s.id).length;
                const isFull = regCount >= s.capacity;
                const isSelected = selectedProSession === s.id;
                return (
                  <div key={s.id} className={`border rounded-xl p-4 cursor-pointer transition-colors ${isSelected ? 'border-amber-400 bg-amber-50' : 'border-gray-100 hover:border-amber-200'}`}
                    onClick={() => setSelectedProSession(s.id)}>
                    <div className="font-semibold text-gray-800">{s.title}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {format(parseISO(s.date), 'EEEE d MMMM yyyy', { locale: fr })} · {s.startTime}–{s.endTime}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{s.coachName} · {s.style} · {s.ageGroup}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm font-semibold text-green-600">{s.price}€</span>
                      <span className="text-xs text-gray-400">{regCount}/{s.capacity} inscrits</span>
                      {isFull && <span className="text-xs text-red-500 font-medium">Complet</span>}
                      <span className="text-xs text-gray-400 ml-auto">Clôture : {format(parseISO(s.registrationCloseDate), 'd MMM', { locale: fr })}</span>
                    </div>
                    {s.description && <p className="text-xs text-gray-500 mt-2">{s.description}</p>}
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-gray-100 space-y-2">
              <p className="text-xs text-gray-400 text-center">L'inscription sera validée après paiement auprès de l'école.</p>
              <button
                disabled={!selectedProSession}
                onClick={() => selectedProSession && registerForProSession(selectedProSession)}
                className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Confirmer l'inscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
