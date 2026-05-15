import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { findDateConflict } from '../../utils/conflicts';
import type { RepresentationSession } from '../../types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Plus, X, AlertTriangle, CheckCircle, Pencil, Trash2 } from 'lucide-react';

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

const EMPTY_FORM = {
  title: '',
  date: '',
  startTime: '',
  endTime: '',
  room: '',
  description: '',
  courseIds: [] as string[],
  status: 'draft' as RepresentationSession['status'],
};

export default function TeacherRepresentations() {
  const { currentUser } = useAuth();
  const { courses, rooms, representations, addRepresentation, updateRepresentation, deleteRepresentation } = useApp();

  const tid = currentUser?.teacherId ?? '';
  const myCourses = courses.filter(c => c.teacherId === tid && c.active);
  const myReps = representations
    .filter(r => r.teacherId === tid)
    .sort((a, b) => b.date.localeCompare(a.date));

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [conflict, setConflict] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function openNew() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setConflict(null);
    setSaved(false);
    setShowForm(true);
  }

  function openEdit(r: RepresentationSession) {
    setEditingId(r.id);
    setForm({
      title: r.title,
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      room: r.room,
      description: r.description ?? '',
      courseIds: [...r.courseIds],
      status: r.status,
    });
    setConflict(null);
    setSaved(false);
    setShowForm(true);
  }

  function checkConflict() {
    if (!form.room || !form.date || !form.startTime || !form.endTime) return false;
    const c = findDateConflict(
      form.room, form.date, form.startTime, form.endTime,
      courses, representations,
      editingId ?? undefined,
    );
    if (c) {
      setConflict(`Conflit : "${c.name}" (${c.type === 'course' ? 'cours régulier' : 'représentation'}) est déjà programmé dans cette salle à ce créneau.`);
      return true;
    }
    setConflict(null);
    return false;
  }

  function handleSubmit() {
    if (checkConflict()) return;
    if (!form.title || !form.date || !form.startTime || !form.endTime || !form.room) return;

    if (editingId) {
      const existing = representations.find(r => r.id === editingId)!;
      updateRepresentation({ ...existing, ...form, teacherId: tid });
    } else {
      addRepresentation({
        id: genId(),
        teacherId: tid,
        title: form.title,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room,
        description: form.description || undefined,
        courseIds: form.courseIds,
        status: form.status,
      });
    }
    setSaved(true);
    setTimeout(() => {
      setShowForm(false);
      setSaved(false);
    }, 800);
  }

  function toggleCourse(id: string) {
    setForm(f => ({
      ...f,
      courseIds: f.courseIds.includes(id)
        ? f.courseIds.filter(x => x !== id)
        : [...f.courseIds, id],
    }));
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const upcoming = myReps.filter(r => r.date >= today && r.status !== 'cancelled');
  const past = myReps.filter(r => r.date < today || r.status === 'cancelled');

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} /> Nouvelle représentation
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg sm:my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">
                {editingId ? 'Modifier la représentation' : 'Nouvelle représentation'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Ex: Gala de fin d'année, Showcase..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => { setForm(f => ({ ...f, date: e.target.value })); setConflict(null); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as RepresentationSession['status'] }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="confirmed">Confirmée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Heure début *</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={e => { setForm(f => ({ ...f, startTime: e.target.value })); setConflict(null); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Heure fin *</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={e => { setForm(f => ({ ...f, endTime: e.target.value })); setConflict(null); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Salle *</label>
                <select
                  value={form.room}
                  onChange={e => { setForm(f => ({ ...f, room: e.target.value })); setConflict(null); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="">— Choisir une salle —</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.venue} · {r.name} ({r.city})</option>
                  ))}
                </select>
              </div>

              {/* Conflict alert */}
              {conflict && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  {conflict}
                </div>
              )}

              {/* Courses selection */}
              {myCourses.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Groupes / cours concernés</label>
                  <div className="space-y-1 max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {myCourses.map(c => (
                      <label key={c.id} className="flex items-center gap-2 cursor-pointer text-sm p-1 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={form.courseIds.includes(c.id)}
                          onChange={() => toggleCourse(c.id)}
                          className="rounded"
                        />
                        <span className="text-gray-700">{c.name}</span>
                        <span className="text-gray-400 text-xs">· {c.dayOfWeek} {c.startTime}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Informations complémentaires..."
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  {saved ? <><CheckCircle size={15} /> Enregistré !</> : 'Enregistrer'}
                </button>
                <button
                  onClick={checkConflict}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Vérifier disponibilité
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">À venir</h2>
          <div className="space-y-3">
            {upcoming.map(r => <RepCard key={r.id} r={r} courses={courses} rooms={rooms} onEdit={openEdit} onDelete={deleteRepresentation} />)}
          </div>
        </div>
      )}

      {upcoming.length === 0 && past.length === 0 && (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm border border-gray-100">
          <Calendar size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Aucune représentation planifiée.</p>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Passées / annulées</h2>
          <div className="space-y-3">
            {past.map(r => <RepCard key={r.id} r={r} courses={courses} rooms={rooms} onEdit={openEdit} onDelete={deleteRepresentation} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function RepCard({ r, courses, rooms, onEdit, onDelete }: {
  r: RepresentationSession;
  courses: import('../../types').Course[];
  rooms: import('../../types').Room[];
  onEdit: (r: RepresentationSession) => void;
  onDelete: (id: string) => void;
}) {
  const room = rooms.find(x => x.id === r.room);
  const linkedCourses = courses.filter(c => r.courseIds.includes(c.id));

  function statusColor(s: RepresentationSession['status']) {
    if (s === 'confirmed') return 'bg-green-100 text-green-700';
    if (s === 'cancelled') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-500';
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800">{r.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(r.status)}`}>
              {r.status === 'confirmed' ? 'Confirmée' : r.status === 'cancelled' ? 'Annulée' : 'Brouillon'}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {format(parseISO(r.date), 'EEEE d MMMM yyyy', { locale: fr })} · {r.startTime}–{r.endTime}
          </div>
          <div className="text-xs text-gray-400">
            {room ? `${room.venue} · ${room.name} (${room.city})` : r.room}
          </div>
          {linkedCourses.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {linkedCourses.map(c => (
                <span key={c.id} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{c.name}</span>
              ))}
            </div>
          )}
          {r.description && (
            <p className="text-xs text-gray-500 mt-1 italic">{r.description}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onEdit(r)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
            <Pencil size={14} />
          </button>
          <button
            onClick={() => { if (window.confirm('Supprimer cette représentation ?')) onDelete(r.id); }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
