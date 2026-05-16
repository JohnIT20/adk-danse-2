import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Plus, Trash2, X, CreditCard, AlertCircle, BookOpen, Clock, RefreshCw, Undo2 } from 'lucide-react';
import type { Registration, RegistrationStatus, PaymentStatus } from '../types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

const STATUS_LABELS: Record<RegistrationStatus, string> = {
  pending: 'En attente',
  validated: 'Validé',
  rejected: 'Refusé',
  waitlist: 'Liste d\'attente',
};
const STATUS_COLORS: Record<RegistrationStatus, string> = {
  pending: 'bg-orange-100 text-orange-700',
  validated: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  waitlist: 'bg-blue-100 text-blue-700',
};
const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: 'Non payé',
  paid: 'Payé',
  cancelled: 'Annulé',
  refunded: 'Remboursé',
};
const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  pending: 'bg-orange-50 text-orange-600',
  paid: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  refunded: 'bg-blue-50 text-blue-600',
};

type MainTab = 'pro' | 'courses';

export default function Registrations() {
  const { proSessions, registrations, students, addRegistration, updateRegistration, deleteRegistration, addStudent, courseEnrollments, updateCourseEnrollment, courses, teachers, initializeDb } = useApp();
  const [mainTab, setMainTab] = useState<MainTab>('courses');
  const [refreshing, setRefreshing] = useState(false);

  // Re-fetch every time the admin opens this page so they don't miss
  // requests submitted by parents since their session started.
  useEffect(() => {
    initializeDb();
  }, [initializeDb]);

  // Real-time subscriptions: any insert/update/delete on the two tables
  // we care about triggers an immediate full refetch.
  useEffect(() => {
    const channel = supabase
      .channel('admin-registrations-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'course_enrollments' }, () => initializeDb())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => initializeDb())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [initializeDb]);

  async function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    try { await initializeDb(); } finally { setRefreshing(false); }
  }
  const [filterSession, setFilterSession] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [regForm, setRegForm] = useState({
    sessionId: proSessions[0]?.id ?? '',
    firstName: '', lastName: '', birthDate: '',
    parentFirstName: '', parentLastName: '', parentEmail: '', parentPhone: '',
    notes: '',
  });

  async function addReg() {
    // Find an existing student matching firstName + lastName + parentEmail
    // (case-insensitive, trimmed) to avoid creating duplicates.
    const fn = regForm.firstName.trim().toLowerCase();
    const ln = regForm.lastName.trim().toLowerCase();
    const pe = regForm.parentEmail.trim().toLowerCase();
    const existing = students.find(s =>
      s.firstName.trim().toLowerCase() === fn &&
      s.lastName.trim().toLowerCase() === ln &&
      (s.parentEmail || '').trim().toLowerCase() === pe
    );
    let studentId = existing?.id;
    if (!studentId) {
      studentId = generateId();
      await addStudent({
        id: studentId,
        firstName: regForm.firstName.trim(),
        lastName: regForm.lastName.trim(),
        birthDate: regForm.birthDate,
        parentFirstName: regForm.parentFirstName,
        parentLastName: regForm.parentLastName,
        parentEmail: regForm.parentEmail.trim(),
        parentPhone: regForm.parentPhone,
      });
    } else if (pe) {
      // Student already exists: make sure they're linked to the parent profile
      // (covers cases where the student was created before the parent signed up).
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, studentIds')
        .ilike('email', pe)
        .maybeSingle();
      if (profile) {
        const currentIds: string[] = profile.studentIds ?? [];
        if (!currentIds.includes(studentId)) {
          await supabase
            .from('profiles')
            .update({ studentIds: [...currentIds, studentId] })
            .eq('id', profile.id);
        }
      }
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    addRegistration({
      id: generateId(),
      sessionId: regForm.sessionId,
      studentId,
      registrationDate: today,
      status: 'pending',
      paymentStatus: 'pending',
      notes: regForm.notes,
    });
    setShowModal(false);
  }

  function markPaid(r: Registration) {
    updateRegistration({ ...r, paymentStatus: 'paid', paymentDate: format(new Date(), 'yyyy-MM-dd') });
  }

  function setStatus(r: Registration, status: RegistrationStatus) {
    updateRegistration({ ...r, status });
  }

  const filteredRegs = registrations.filter(r => {
    if (filterSession !== 'all' && r.sessionId !== filterSession) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  const pendingCount = registrations.filter(r => r.status === 'pending').length;
  const pendingPaymentCount = registrations.filter(r => r.paymentStatus === 'pending' && r.status === 'validated').length;

  // Course enrollments
  const pendingCourseEnrollments = courseEnrollments.filter(e => e.status === 'pending');
  const validatedAwaitingPayment = courseEnrollments.filter(e => e.status === 'validated' && e.paymentStatus === 'pending');

  function validateCourseEnrollment(id: string, decision: 'validated' | 'rejected') {
    const enrollment = courseEnrollments.find(e => e.id === id);
    if (!enrollment) return;
    updateCourseEnrollment({
      ...enrollment,
      status: decision,
      validatedAt: decision === 'validated' ? format(new Date(), 'yyyy-MM-dd') : undefined,
      rejectedAt: decision === 'rejected' ? format(new Date(), 'yyyy-MM-dd') : undefined,
    });
  }

  function markCourseEnrollmentPaid(id: string) {
    const enrollment = courseEnrollments.find(e => e.id === id);
    if (!enrollment) return;
    updateCourseEnrollment({ ...enrollment, status: 'active', paymentStatus: 'paid' });
  }

  // Reversal helpers so admin can correct an over-eager validation / payment.
  function revertCourseEnrollmentToPending(id: string) {
    const enrollment = courseEnrollments.find(e => e.id === id);
    if (!enrollment) return;
    updateCourseEnrollment({ ...enrollment, status: 'pending', validatedAt: undefined, rejectedAt: undefined, paymentStatus: 'pending' });
  }
  function markCourseEnrollmentUnpaid(id: string) {
    const enrollment = courseEnrollments.find(e => e.id === id);
    if (!enrollment) return;
    updateCourseEnrollment({ ...enrollment, status: 'validated', paymentStatus: 'pending' });
  }
  function revertRegistrationToPending(r: Registration) {
    updateRegistration({ ...r, status: 'pending', paymentStatus: 'pending', paymentDate: undefined });
  }
  function markRegistrationUnpaid(r: Registration) {
    updateRegistration({ ...r, paymentStatus: 'pending', paymentDate: undefined });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Main tab switcher */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setMainTab('courses')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${mainTab === 'courses' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <BookOpen size={14} /> Inscriptions cours
            {pendingCourseEnrollments.length > 0 && (
              <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none" title="Demandes en attente de validation">{pendingCourseEnrollments.length}</span>
            )}
            {validatedAwaitingPayment.length > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none" title="Paiements en attente">{validatedAwaitingPayment.length}</span>
            )}
          </button>
          <button
            onClick={() => setMainTab('pro')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${mainTab === 'pro' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Sessions pro
            {pendingCount > 0 && (
              <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none" title="Demandes en attente de validation">{pendingCount}</span>
            )}
            {pendingPaymentCount > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none" title="Paiements en attente">{pendingPaymentCount}</span>
            )}
          </button>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
          title="Recharger depuis la base de donnees"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      {/* ===== COURSE ENROLLMENTS ===== */}
      {mainTab === 'courses' && (
        <div className="space-y-4">
          {pendingCourseEnrollments.length > 0 && (
            <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
              <AlertCircle size={18} className="text-orange-500 flex-shrink-0" />
              <span><strong>{pendingCourseEnrollments.length} demande(s)</strong> en attente de validation.</span>
            </div>
          )}
          {validatedAwaitingPayment.length > 0 && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <CreditCard size={18} className="text-blue-500 flex-shrink-0" />
              <span><strong>{validatedAwaitingPayment.length} paiement(s)</strong> en attente pour des inscriptions validées.</span>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Élève</th>
                    <th className="px-4 py-3 text-left">Cours demandé</th>
                    <th className="px-4 py-3 text-left">Date demande</th>
                    <th className="px-4 py-3 text-left">Statut</th>
                    <th className="px-4 py-3 text-left">Paiement</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {courseEnrollments.filter(e => e.status !== 'cancelled').length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">Aucune demande d'inscription cours.</td></tr>
                  )}
                  {courseEnrollments
                    .filter(e => e.status !== 'cancelled')
                    .sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt))
                    .map(enrollment => {
                      const student = students.find(s => s.id === enrollment.studentId);
                      const course = courses.find(c => c.id === enrollment.courseId);
                      const teacher = teachers.find(t => t.id === course?.teacherId);
                      const statusLabel: Record<string, string> = {
                        pending: 'En attente', validated: 'Validé', active: 'Actif', rejected: 'Refusé', cancelled: 'Annulé',
                      };
                      const statusColor: Record<string, string> = {
                        pending: 'bg-orange-100 text-orange-700', validated: 'bg-green-100 text-green-700',
                        active: 'bg-purple-100 text-purple-700', rejected: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-500',
                      };
                      return (
                        <tr key={enrollment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-sm text-gray-800">{student?.firstName} {student?.lastName}</div>
                            <div className="text-xs text-gray-400">{student?.parentEmail}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-700 max-w-[200px] truncate">{course?.name}</div>
                            <div className="text-xs text-gray-400">{course?.dayOfWeek} · {course?.startTime}–{course?.endTime}</div>
                            {teacher && <div className="text-xs text-gray-400">Prof : {teacher.firstName} {teacher.lastName}</div>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {format(parseISO(enrollment.enrolledAt), 'd MMM yyyy', { locale: fr })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[enrollment.status]}`}>
                              {statusLabel[enrollment.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {enrollment.status === 'active' ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">Payé</span>
                            ) : enrollment.status === 'validated' ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600 flex items-center gap-1 w-fit">
                                <Clock size={10} /> En attente
                              </span>
                            ) : <span className="text-xs text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {enrollment.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => validateCourseEnrollment(enrollment.id, 'validated')}
                                    className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg"
                                    title="Valider"
                                  >
                                    <CheckCircle size={15} />
                                  </button>
                                  <button
                                    onClick={() => validateCourseEnrollment(enrollment.id, 'rejected')}
                                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                                    title="Refuser"
                                  >
                                    <XCircle size={15} />
                                  </button>
                                </>
                              )}
                              {enrollment.status === 'validated' && enrollment.paymentStatus === 'pending' && (
                                <>
                                  <button
                                    onClick={() => markCourseEnrollmentPaid(enrollment.id)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                                  >
                                    <CreditCard size={12} /> Marquer payé
                                  </button>
                                  <button
                                    onClick={() => revertCourseEnrollmentToPending(enrollment.id)}
                                    className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg"
                                    title="Annuler la validation (retour en attente)"
                                  >
                                    <Undo2 size={15} />
                                  </button>
                                </>
                              )}
                              {enrollment.status === 'active' && (
                                <button
                                  onClick={() => markCourseEnrollmentUnpaid(enrollment.id)}
                                  className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg"
                                  title="Marquer non payé (retour en attente de paiement)"
                                >
                                  <Undo2 size={15} />
                                </button>
                              )}
                              {enrollment.status === 'rejected' && (
                                <button
                                  onClick={() => revertCourseEnrollmentToPending(enrollment.id)}
                                  className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                                  title="Restaurer la demande"
                                >
                                  <Undo2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== PRO SESSIONS (existing) ===== */}
      {mainTab === 'pro' && (
      <div className="space-y-4">
      {/* Alerts */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
          <AlertCircle size={18} className="text-orange-500 flex-shrink-0" />
          <span><strong>{pendingCount} inscription(s)</strong> en attente de validation.</span>
        </div>
      )}
      {pendingPaymentCount > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <CreditCard size={18} className="text-blue-500 flex-shrink-0" />
          <span><strong>{pendingPaymentCount} paiement(s)</strong> en attente pour des inscriptions validées.</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <div>
          <label className="text-xs text-gray-500 mr-2">Session :</label>
          <select
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={filterSession}
            onChange={e => setFilterSession(e.target.value)}
          >
            <option value="all">Toutes</option>
            {proSessions.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mr-2">Statut :</label>
          <select
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">Tous</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="ml-auto">
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
            <Plus size={16} /> Nouvelle inscription
          </button>
        </div>
      </div>

      {/* Registrations table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Élève</th>
                <th className="px-4 py-3 text-left">Session</th>
                <th className="px-4 py-3 text-left">Date inscription</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-left">Paiement</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRegs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">Aucune inscription trouvée.</td></tr>
              )}
              {filteredRegs.map(r => {
                const student = students.find(s => s.id === r.studentId);
                const session = proSessions.find(s => s.id === r.sessionId);
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-gray-800">{student?.firstName} {student?.lastName}</div>
                      <div className="text-xs text-gray-400">{student?.parentEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700 max-w-[180px] truncate">{session?.title}</div>
                      <div className="text-xs text-gray-400">{session?.date ? format(parseISO(session.date), 'd MMM yyyy', { locale: fr }) : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {format(parseISO(r.registrationDate), 'd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${PAYMENT_COLORS[r.paymentStatus]}`}>
                        {PAYMENT_LABELS[r.paymentStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setStatus(r, 'validated')}
                              className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg"
                              title="Valider"
                            >
                              <CheckCircle size={15} />
                            </button>
                            <button
                              onClick={() => setStatus(r, 'rejected')}
                              className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                              title="Refuser"
                            >
                              <XCircle size={15} />
                            </button>
                          </>
                        )}
                        {r.status === 'validated' && r.paymentStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => markPaid(r)}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                            >
                              <CreditCard size={12} /> Marquer payé
                            </button>
                            <button
                              onClick={() => revertRegistrationToPending(r)}
                              className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg"
                              title="Annuler la validation (retour en attente)"
                            >
                              <Undo2 size={15} />
                            </button>
                          </>
                        )}
                        {r.status === 'validated' && r.paymentStatus === 'paid' && (
                          <button
                            onClick={() => markRegistrationUnpaid(r)}
                            className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg"
                            title="Marquer non payé (retour en attente de paiement)"
                          >
                            <Undo2 size={15} />
                          </button>
                        )}
                        {r.status === 'rejected' && (
                          <button
                            onClick={() => revertRegistrationToPending(r)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="Restaurer la demande"
                          >
                            <Undo2 size={15} />
                          </button>
                        )}
                        <button onClick={() => deleteRegistration(r.id)} className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New registration modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Nouvelle inscription</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session pro *</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={regForm.sessionId} onChange={e => setRegForm(f => ({ ...f, sessionId: e.target.value }))}>
                  {proSessions.filter(s => s.status === 'open').map(s => (
                    <option key={s.id} value={s.id}>{s.title} ({format(parseISO(s.date), 'd MMM yyyy', { locale: fr })})</option>
                  ))}
                </select>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Informations élève</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      value={regForm.firstName} onChange={e => setRegForm(f => ({ ...f, firstName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      value={regForm.lastName} onChange={e => setRegForm(f => ({ ...f, lastName: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                    <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      value={regForm.birthDate} onChange={e => setRegForm(f => ({ ...f, birthDate: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact parent / tuteur</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom parent</label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      value={regForm.parentFirstName} onChange={e => setRegForm(f => ({ ...f, parentFirstName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom parent</label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      value={regForm.parentLastName} onChange={e => setRegForm(f => ({ ...f, parentLastName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email parent *</label>
                    <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      value={regForm.parentEmail} onChange={e => setRegForm(f => ({ ...f, parentEmail: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone parent</label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      value={regForm.parentPhone} onChange={e => setRegForm(f => ({ ...f, parentPhone: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                      value={regForm.notes} onChange={e => setRegForm(f => ({ ...f, notes: e.target.value }))} placeholder="Allergies, besoins particuliers..." />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
              <button onClick={addReg} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700" disabled={!regForm.firstName || !regForm.lastName || !regForm.parentEmail}>
                Enregistrer l'inscription
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      )}
    </div>
  );
}
