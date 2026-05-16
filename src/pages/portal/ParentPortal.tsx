import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { format, parseISO, differenceInYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronRight, Calendar, Star, Music2, LogOut, UserPlus, X, Users } from 'lucide-react';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

export default function ParentPortal() {
  const { currentUser, logout, linkStudentToParent } = useAuth();
  const { students, courseEnrollments, courses, registrations, proSessions, addStudent, addRegistration } = useApp();
  const navigate = useNavigate();

  const [showAddChild, setShowAddChild] = useState(false);
  const [childForm, setChildForm] = useState({ firstName: '', lastName: '', birthDate: '' });
  const [saving, setSaving] = useState(false);

  // Pro session registration modal
  const [registerSession, setRegisterSession] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  if (!currentUser) return null;

  const myStudents = students.filter(s => currentUser.studentIds.includes(s.id));

  function openRegisterModal(sessionId: string) {
    // Pre-select the only child if there's just one eligible
    const session = proSessions.find(s => s.id === sessionId);
    if (!session) return;
    const eligible = myStudents.filter(s =>
      !registrations.find(r => r.sessionId === sessionId && r.studentId === s.id && r.status !== 'rejected')
    );
    setSelectedChildId(eligible.length === 1 ? eligible[0].id : '');
    setRegisterSession(sessionId);
  }

  function handleRegisterSession() {
    if (!registerSession || !selectedChildId) return;
    addRegistration({
      id: generateId(),
      sessionId: registerSession,
      studentId: selectedChildId,
      registrationDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'pending',
      paymentStatus: 'pending',
    });
    setRegisterSession(null);
    setSelectedChildId('');
  }

  async function handleAddChild() {
    if (saving) return;
    const firstName = childForm.firstName.trim();
    const lastName = childForm.lastName.trim();
    if (!firstName || !lastName) return;
    setSaving(true);

    // Guard against duplicates: if a child with the same first+last name
    // is already linked to this parent, just reopen the existing record.
    const existing = students.find(s =>
      s.firstName.trim().toLowerCase() === firstName.toLowerCase() &&
      s.lastName.trim().toLowerCase() === lastName.toLowerCase() &&
      (s.parentEmail || '').trim().toLowerCase() === currentUser!.email.toLowerCase()
    );
    if (existing) {
      if (!currentUser!.studentIds.includes(existing.id)) {
        await linkStudentToParent(existing.id);
      }
      setChildForm({ firstName: '', lastName: '', birthDate: '' });
      setShowAddChild(false);
      setSaving(false);
      return;
    }

    const newId = generateId();
    await addStudent({
      id: newId,
      firstName,
      lastName,
      birthDate: childForm.birthDate,
      parentEmail: currentUser!.email,
      parentPhone: '',
    });
    await linkStudentToParent(newId);
    setChildForm({ firstName: '', lastName: '', birthDate: '' });
    setShowAddChild(false);
    setSaving(false);
  }

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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Ma famille</h1>
            <p className="text-gray-500 text-sm mt-0.5">Sélectionnez un membre pour voir son planning et ses cours.</p>
          </div>
          <button
            onClick={() => setShowAddChild(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 text-sm font-medium whitespace-nowrap"
          >
            <UserPlus size={15} /> Ajouter un enfant
          </button>
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
          <div className="space-y-3">
            {proSessions.filter(s => s.status === 'open').map(s => {
              const regCount = registrations.filter(r => r.sessionId === s.id && r.status !== 'rejected').length;
              const spotsLeft = s.capacity - regCount;
              const isFull = spotsLeft <= 0;
              // Children not yet registered for this session
              const eligibleChildren = myStudents.filter(child =>
                !registrations.find(r => r.sessionId === s.id && r.studentId === child.id && r.status !== 'rejected')
              );
              const hasEligible = eligibleChildren.length > 0;

              return (
                <div key={s.id} className="bg-white rounded-xl border border-amber-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 text-sm">{s.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {format(parseISO(s.date), 'EEEE d MMMM yyyy', { locale: fr })} · {s.startTime}–{s.endTime}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">Coach : {s.coachName} · {s.price}€</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isFull ? 'bg-red-100 text-red-600' : spotsLeft <= 3 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                          <Users size={10} className="inline mr-1" />
                          {isFull ? 'Complet' : `${spotsLeft} place${spotsLeft > 1 ? 's' : ''} restante${spotsLeft > 1 ? 's' : ''}`}
                        </span>
                        <span className="text-xs text-gray-400">
                          Clôture le {format(parseISO(s.registrationCloseDate), 'd MMMM', { locale: fr })}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                        Ouvert
                      </span>
                      {!isFull && hasEligible && myStudents.length > 0 && (
                        <button
                          onClick={() => openRegisterModal(s.id)}
                          className="px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 font-medium whitespace-nowrap"
                        >
                          S'inscrire
                        </button>
                      )}
                      {!hasEligible && myStudents.length > 0 && (
                        <span className="text-xs text-gray-400 italic">Déjà inscrit(s)</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {proSessions.filter(s => s.status === 'open').length === 0 && (
              <p className="text-sm text-gray-400">Aucune session pro ouverte aux inscriptions pour le moment.</p>
            )}
          </div>
        </div>
      </main>

      {/* Pro session registration modal */}
      {registerSession && (() => {
        const session = proSessions.find(s => s.id === registerSession)!;
        const regCount = registrations.filter(r => r.sessionId === registerSession && r.status !== 'rejected').length;
        const spotsLeft = session.capacity - regCount;
        const eligibleChildren = myStudents.filter(child =>
          !registrations.find(r => r.sessionId === registerSession && r.studentId === child.id && r.status !== 'rejected')
        );
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-800">Demande d'inscription</h2>
                <button onClick={() => setRegisterSession(null)}><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-amber-50 rounded-xl p-4">
                  <div className="font-semibold text-gray-800">{session.title}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {format(parseISO(session.date), 'EEEE d MMMM yyyy', { locale: fr })} · {session.startTime}–{session.endTime}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Coach : {session.coachName} · {session.price}€</div>
                  <div className="text-xs font-medium text-amber-700 mt-2">
                    {spotsLeft} place{spotsLeft > 1 ? 's' : ''} restante{spotsLeft > 1 ? 's' : ''}
                  </div>
                </div>

                {eligibleChildren.length > 1 ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pour quel enfant ?</label>
                    <div className="space-y-2">
                      {eligibleChildren.map(child => (
                        <button
                          key={child.id}
                          onClick={() => setSelectedChildId(child.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                            selectedChildId === child.id
                              ? 'border-amber-400 bg-amber-50'
                              : 'border-gray-200 hover:border-amber-200'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {child.firstName[0]}{child.lastName[0]}
                          </div>
                          <div className="font-medium text-gray-800 text-sm">{child.firstName} {child.lastName}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    La demande sera faite pour <strong>{eligibleChildren[0]?.firstName} {eligibleChildren[0]?.lastName}</strong>.
                  </p>
                )}

                <p className="text-xs text-gray-400">
                  La demande devra être validée par l'école. Une fois validée, le paiement vous sera demandé.
                </p>
              </div>
              <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
                <button onClick={() => setRegisterSession(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
                <button
                  onClick={handleRegisterSession}
                  disabled={!selectedChildId}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Envoyer la demande
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showAddChild && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Ajouter un enfant</h2>
              <button onClick={() => setShowAddChild(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={childForm.firstName}
                    onChange={e => setChildForm(f => ({ ...f, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={childForm.lastName}
                    onChange={e => setChildForm(f => ({ ...f, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={childForm.birthDate}
                  onChange={e => setChildForm(f => ({ ...f, birthDate: e.target.value }))}
                />
              </div>
              <p className="text-xs text-gray-400">Une fois ajouté, vous pourrez lui demander des inscriptions aux cours depuis sa fiche.</p>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowAddChild(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
              <button
                onClick={handleAddChild}
                disabled={saving || !childForm.firstName.trim() || !childForm.lastName.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'Enregistrement...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
