import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Bell, CheckCircle, XCircle, Clock, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ScheduleChangeRequest } from '../../types';

type Tab = 'pending' | 'history';

export default function TeacherRequests() {
  const { currentUser } = useAuth();
  const { changeRequests, updateChangeRequest, courses, teachers } = useApp();

  const tid = currentUser?.teacherId ?? '';

  // Requests where this teacher is the conflicting one (must respond)
  const incomingRequests = changeRequests.filter(r => r.conflictingTeacherId === tid);

  // Requests this teacher made (outgoing)
  const outgoingRequests = changeRequests.filter(r => r.requestingTeacherId === tid);

  const pending = incomingRequests.filter(r => r.status === 'pending');
  const history = [
    ...incomingRequests.filter(r => r.status !== 'pending'),
    ...outgoingRequests,
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const [tab, setTab] = useState<Tab>('pending');
  const [responseNote, setResponseNote] = useState<Record<string, string>>({});

  function respond(r: ScheduleChangeRequest, decision: 'approved' | 'rejected') {
    updateChangeRequest({
      ...r,
      status: decision,
      respondedAt: new Date().toISOString(),
      responseNote: responseNote[r.id] ?? '',
    });
  }

  function getCourseName(id: string) {
    return courses.find(c => c.id === id)?.name ?? id;
  }

  function getTeacherName(id: string) {
    const t = teachers.find(t => t.id === id);
    return t ? `${t.firstName} ${t.lastName}`.trim() : id;
  }

  function statusBadge(status: ScheduleChangeRequest['status']) {
    if (status === 'pending') return <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full"><Clock size={10} /> En attente</span>;
    if (status === 'approved') return <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"><CheckCircle size={10} /> Approuvée</span>;
    return <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full"><XCircle size={10} /> Refusée</span>;
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([['pending', `Reçues${pending.length > 0 ? ` (${pending.length})` : ''}`], ['history', 'Historique']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'pending' && (
        <>
          {pending.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm border border-gray-100">
              <Bell size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aucune demande en attente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map(r => (
                <div key={r.id} className="bg-white rounded-xl shadow-sm border border-orange-200 p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="font-semibold text-gray-800">
                        {getTeacherName(r.requestingTeacherId)} souhaite votre créneau
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Demande reçue le {format(parseISO(r.createdAt), 'd MMMM yyyy', { locale: fr })}
                      </div>
                    </div>
                    {statusBadge(r.status)}
                  </div>

                  <div className="bg-orange-50 rounded-lg p-3 mb-3 space-y-1 text-sm">
                    <div className="text-orange-800 font-medium">Créneau demandé :</div>
                    <div className="text-orange-700">{r.proposedDay} · {r.proposedStartTime}–{r.proposedEndTime} · {r.proposedRoom}</div>
                    <div className="text-xs text-orange-600">Cours concerné : {getCourseName(r.courseId)}</div>
                    {r.requestNote && (
                      <div className="text-xs text-gray-600 italic border-t border-orange-200 pt-2 mt-2">
                        <Info size={11} className="inline mr-1" />"{r.requestNote}"
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs text-gray-500">
                    <strong>Votre cours en conflit :</strong> {getCourseName(r.conflictingCourseId)}
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs text-gray-500 mb-1">Note de réponse (optionnelle)</label>
                    <textarea
                      rows={2}
                      value={responseNote[r.id] ?? ''}
                      onChange={e => setResponseNote(prev => ({ ...prev, [r.id]: e.target.value }))}
                      placeholder="Expliquez votre décision..."
                      className="w-full border border-gray-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => respond(r, 'approved')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                      <CheckCircle size={15} /> Approuver
                    </button>
                    <button
                      onClick={() => respond(r, 'rejected')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                    >
                      <XCircle size={15} /> Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        <>
          {history.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm border border-gray-100">
              <p className="text-sm">Aucun historique disponible.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(r => {
                const isOutgoing = r.requestingTeacherId === tid;
                return (
                  <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">
                          {isOutgoing
                            ? `Demande envoyée à ${getTeacherName(r.conflictingTeacherId)}`
                            : `Demande de ${getTeacherName(r.requestingTeacherId)}`}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {r.proposedDay} · {r.proposedStartTime}–{r.proposedEndTime} · {r.proposedRoom}
                        </div>
                        <div className="text-xs text-gray-400">
                          Cours : {getCourseName(r.courseId)}
                        </div>
                        {r.responseNote && (
                          <div className="text-xs text-gray-500 italic mt-1">"{r.responseNote}"</div>
                        )}
                        {r.respondedAt && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            Réponse le {format(parseISO(r.respondedAt), 'd MMMM yyyy', { locale: fr })}
                          </div>
                        )}
                      </div>
                      {statusBadge(r.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
