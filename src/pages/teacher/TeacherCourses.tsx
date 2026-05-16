import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { findScheduleConflict } from '../../utils/conflicts';
import type { Course, DanceStyle, Level, AgeGroup, DayOfWeek, AttireItem, AttireCategory, ScheduleChangeRequest } from '../../types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Pencil, ChevronDown, ChevronUp, AlertTriangle, X, Shirt, Plus, AlertCircle, CheckCircle } from 'lucide-react';

const STYLES: DanceStyle[] = ['Éveil à la danse', 'Danse classique', 'Jazz', 'Contemporain', 'Hip-hop', 'Break', 'Ragga', 'Girly', 'Pomdance', 'Line Dance', 'Pole Dance'];
const LEVELS: Level[] = ['Éveil', 'Débutant', 'Intermédiaire', 'Avancé', 'Tous niveaux'];
const AGE_GROUPS: AgeGroup[] = ['3-5 ans', '6-8 ans', '9-11 ans', '12-14 ans', '15-17 ans', 'Adultes', 'Tous âges'];
const DAYS: DayOfWeek[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const ATTIRE_CATS: AttireCategory[] = ['Tenue', 'Chaussures', 'Accessoire', 'Costume de spectacle'];
const PRICE_LABELS = ['/ mois', '/ trimestre', '/ semestre', '/ année', '/ séance'];
const CATEGORY_COLORS: Record<AttireCategory, string> = {
  'Tenue': 'bg-purple-100 text-purple-700',
  'Chaussures': 'bg-blue-100 text-blue-700',
  'Accessoire': 'bg-green-100 text-green-700',
  'Costume de spectacle': 'bg-amber-100 text-amber-700',
};

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

export default function TeacherCourses() {
  const { currentUser } = useAuth();
  const { courses, courseEnrollments, students, rooms, representations, addChangeRequest, updateCourse, courseExceptions, addCourseException, deleteCourseException } = useApp();

  const tid = currentUser?.teacherId ?? '';
  const myCourses = courses.filter(c => c.teacherId === tid);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form, setForm] = useState<Partial<Course>>({});
  const [conflict, setConflict] = useState<{ name: string; teacherId: string; courseId: string } | null>(null);
  const [requestNote, setRequestNote] = useState('');
  const [saved, setSaved] = useState(false);

  // Attire editor inside the form
  const [showAttireForm, setShowAttireForm] = useState(false);
  const [attireInput, setAttireInput] = useState<Omit<AttireItem, 'id'>>({
    name: '', description: '', category: 'Tenue', mandatory: true, color: '', brand: '', notes: '',
  });

  // Exception form
  const [exceptionCourse, setExceptionCourse] = useState<Course | null>(null);
  const [exForm, setExForm] = useState({ originalDate: format(new Date(), 'yyyy-MM-dd'), isCancelled: true, newDate: '', newStartTime: '', newEndTime: '', reason: '' });

  function openEdit(c: Course) {
    setEditingCourse(c);
    setForm({ ...c });
    setConflict(null);
    setSaved(false);
    setShowAttireForm(false);
  }

  function trySubmit() {
    if (!editingCourse || !form.dayOfWeek || !form.startTime || !form.endTime || !form.room) return;

    // Check for schedule conflicts
    const hit = findScheduleConflict(
      form.room!, form.dayOfWeek!, form.startTime!, form.endTime!,
      courses, representations, editingCourse.id
    );

    if (hit) {
      const hitTeacher = { teacherId: hit.teacherId, courseId: hit.id, name: hit.name };
      if (hit.teacherId === tid) {
        // Own conflict – just block
        setConflict({ ...hitTeacher, teacherId: '' });
      } else {
        setConflict(hitTeacher);
      }
      return;
    }

    // No conflict → apply
    updateCourse({ ...editingCourse, ...form } as Course);
    setSaved(true);
    toast.success('Modifications enregistrées !');
    setConflict(null);
    setTimeout(() => { setEditingCourse(null); setSaved(false); }, 800);
  }

  function sendChangeRequest() {
    if (!editingCourse || !conflict?.teacherId) return;
    const req: ScheduleChangeRequest = {
      id: genId(),
      requestingTeacherId: tid,
      courseId: editingCourse.id,
      proposedDay: form.dayOfWeek as DayOfWeek,
      proposedStartTime: form.startTime!,
      proposedEndTime: form.endTime!,
      proposedRoom: form.room!,
      conflictingCourseId: conflict.courseId,
      conflictingTeacherId: conflict.teacherId,
      status: 'pending',
      createdAt: format(new Date(), 'yyyy-MM-dd'),
      requestNote,
    };
    addChangeRequest(req);
    setConflict(null);
    toast.success('Demande de remplacement envoyée !');
    setRequestNote('');
    setEditingCourse(null);
  }

  function addAttireItem() {
    if (!attireInput.name.trim()) return;
    setForm(f => ({ ...f, attire: [...(f.attire ?? []), { ...attireInput, id: genId() }] }));
    setAttireInput({ name: '', description: '', category: 'Tenue', mandatory: true, color: '', brand: '', notes: '' });
    setShowAttireForm(false);
  }

  function removeAttireItem(id: string) {
    setForm(f => ({ ...f, attire: (f.attire ?? []).filter(a => a.id !== id) }));
  }

  function saveException() {
    if (!exceptionCourse) return;
    addCourseException({ id: genId(), courseId: exceptionCourse.id, ...exForm });
    setExceptionCourse(null);
  }

  const roomLabel = (roomId: string) => {
    const r = rooms.find(x => x.id === roomId);
    return r ? `${r.name} — ${r.venue}, ${r.city}` : roomId;
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{myCourses.length} cours qui me sont assignés</p>

      <div className="space-y-3">
        {myCourses.map(c => {
          const enrolled = courseEnrollments.filter(e => e.courseId === c.id && e.status === 'active');
          const exceptions = courseExceptions.filter(e => e.courseId === c.id);
          const isExpanded = expandedId === c.id;

          return (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{c.name}</span>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{c.style}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.level}</span>
                  </div>
                  <div className="text-sm text-gray-500">{c.dayOfWeek} · {c.startTime}–{c.endTime} · {roomLabel(c.room)}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{enrolled.length}/{c.capacity} élèves · {c.attire.length} article(s) tenue</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-1.5 text-indigo-400 hover:bg-indigo-50 rounded-lg" title="Modifier">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => { setExceptionCourse(c); setExForm({ originalDate: format(new Date(), 'yyyy-MM-dd'), isCancelled: true, newDate: '', newStartTime: '', newEndTime: '', reason: '' }); }} className="p-1.5 text-orange-400 hover:bg-orange-50 rounded-lg" title="Exception">
                    <AlertTriangle size={15} />
                  </button>
                  <button onClick={() => setExpandedId(isExpanded ? null : c.id)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 p-4 space-y-4">
                  {/* Students */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Élèves inscrits ({enrolled.length})</h3>
                    {enrolled.length === 0 ? <p className="text-xs text-gray-400">Aucun élève inscrit.</p> : (
                      <div className="grid gap-1">
                        {enrolled.map(e => {
                          const s = students.find(x => x.id === e.studentId);
                          return s ? (
                            <div key={e.id} className="text-sm text-gray-600 flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium flex items-center justify-center">{s.firstName[0]}</div>
                              {s.firstName} {s.lastName}
                              {e.status === 'pending' && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">en attente</span>}
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  {/* Attire */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><Shirt size={13} /> Tenues requises</h3>
                    {c.attire.length === 0 ? <p className="text-xs text-gray-400">Aucune tenue définie.</p> : (
                      <div className="space-y-1">
                        {c.attire.map(a => (
                          <div key={a.id} className="text-xs text-gray-600 flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[a.category]}`}>{a.category}</span>
                            <span className="font-medium">{a.name}</span>
                            {!a.mandatory && <span className="text-gray-400">(opt.)</span>}
                            {a.color && <span className="text-gray-400">· {a.color}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Exceptions */}
                  {exceptions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Exceptions</h3>
                      <div className="space-y-1">
                        {exceptions.map(ex => (
                          <div key={ex.id} className="text-xs flex items-center gap-2 bg-orange-50 rounded-lg p-2">
                            <span className="font-medium">{ex.originalDate}</span>
                            {ex.isCancelled ? <span className="text-red-600">Annulé</span> : <span className="text-blue-600">→ {ex.newDate} {ex.newStartTime}</span>}
                            {ex.reason && <span className="text-gray-400">({ex.reason})</span>}
                            <button onClick={() => deleteCourseException(ex.id)} className="ml-auto text-red-400"><X size={11} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ===== EDIT MODAL ===== */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Modifier — {editingCourse.name}</h2>
              <button onClick={() => setEditingCourse(null)}><X size={20} className="text-gray-400" /></button>
            </div>

            {saved && (
              <div className="mx-5 mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2 text-green-700 text-sm">
                <CheckCircle size={16} /> Modifications enregistrées !
              </div>
            )}

            <div className="p-5 space-y-5">
              {/* General */}
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Informations générales</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du cours</label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={form.style} onChange={e => setForm(f => ({ ...f, style: e.target.value as DanceStyle }))}>
                      {STYLES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as Level }))}>
                      {LEVELS.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Groupe d'âge</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={form.ageGroup} onChange={e => setForm(f => ({ ...f, ageGroup: e.target.value as AgeGroup }))}>
                      {AGE_GROUPS.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacité</label>
                    <input type="number" min={1} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={form.capacity ?? ''} onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} />
                  </div>
                </div>
              </section>

              {/* Schedule — conflict detection applies here */}
              <section className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Horaire & Salle</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jour</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: e.target.value as DayOfWeek }))}>
                      {DAYS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salle</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={form.room ?? ''} onChange={e => setForm(f => ({ ...f, room: e.target.value }))}>
                      <option value="">— Choisir une salle —</option>
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.name} — {r.venue}, {r.city}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure début</label>
                    <input type="time" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={form.startTime ?? ''} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure fin</label>
                    <input type="time" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={form.endTime ?? ''} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix (€)</label>
                    <input type="number" min={0} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={form.price ?? 0} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Période tarif</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={form.priceLabel ?? '/ mois'} onChange={e => setForm(f => ({ ...f, priceLabel: e.target.value }))}>
                      {PRICE_LABELS.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                {/* Conflict alert */}
                {conflict && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-2 text-red-800">
                      <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-sm">Conflit de planning détecté !</div>
                        <div className="text-xs mt-1">
                          Le cours <strong>"{conflict.name}"</strong> occupe déjà ce créneau dans cette salle.
                          {conflict.teacherId ? " Il appartient à un autre professeur." : " C'est l'un de vos propres cours."}
                        </div>
                      </div>
                    </div>
                    {conflict.teacherId ? (
                      <div className="space-y-2">
                        <p className="text-xs text-red-700">Pour utiliser ce créneau, vous devez envoyer une demande d'accord à l'autre professeur.</p>
                        <textarea
                          rows={2}
                          className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                          placeholder="Message pour l'autre professeur (optionnel)..."
                          value={requestNote}
                          onChange={e => setRequestNote(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => setConflict(null)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">Annuler</button>
                          <button onClick={sendChangeRequest} className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">
                            Envoyer la demande
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setConflict(null)} className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm text-red-700">
                        Choisir un autre créneau
                      </button>
                    )}
                  </div>
                )}
              </section>

              {/* Attire */}
              <section className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5"><Shirt size={13} /> Tenues requises</p>
                  <button onClick={() => setShowAttireForm(v => !v)} className="text-xs text-indigo-600 flex items-center gap-1"><Plus size={12} /> Ajouter</button>
                </div>
                {(form.attire ?? []).length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {(form.attire ?? []).map(a => (
                      <div key={a.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[a.category]}`}>{a.category}</span>
                        <span className="font-medium">{a.name}</span>
                        {a.color && <span className="text-gray-400 text-xs">· {a.color}</span>}
                        <button onClick={() => removeAttireItem(a.id)} className="ml-auto text-red-400"><X size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}
                {showAttireForm && (
                  <div className="border border-indigo-200 rounded-xl p-3 space-y-2 bg-indigo-50/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Catégorie</label>
                        <select className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                          value={attireInput.category} onChange={e => setAttireInput(a => ({ ...a, category: e.target.value as AttireCategory }))}>
                          {ATTIRE_CATS.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-2 pt-4">
                        <input type="checkbox" checked={attireInput.mandatory} onChange={e => setAttireInput(a => ({ ...a, mandatory: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
                        <label className="text-xs text-gray-600">Obligatoire</label>
                      </div>
                      <div className="col-span-2">
                        <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs" placeholder="Nom de l'article *" value={attireInput.name} onChange={e => setAttireInput(a => ({ ...a, name: e.target.value }))} />
                      </div>
                      <div className="col-span-2">
                        <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs" placeholder="Description précise..." value={attireInput.description} onChange={e => setAttireInput(a => ({ ...a, description: e.target.value }))} />
                      </div>
                      <div>
                        <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs" placeholder="Couleur" value={attireInput.color ?? ''} onChange={e => setAttireInput(a => ({ ...a, color: e.target.value }))} />
                      </div>
                      <div>
                        <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs" placeholder="Marque conseillée" value={attireInput.brand ?? ''} onChange={e => setAttireInput(a => ({ ...a, brand: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setShowAttireForm(false)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg">Annuler</button>
                      <button onClick={addAttireItem} className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg">Ajouter</button>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setEditingCourse(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Annuler</button>
              <button onClick={trySubmit} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exception modal */}
      {exceptionCourse && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800 text-base">Exception — {exceptionCourse.name}</h2>
              <button onClick={() => setExceptionCourse(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date du cours concerné</label>
                <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={exForm.originalDate} onChange={e => setExForm(f => ({ ...f, originalDate: e.target.value }))} />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={exForm.isCancelled} onChange={() => setExForm(f => ({ ...f, isCancelled: true }))} /> Annulation
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={!exForm.isCancelled} onChange={() => setExForm(f => ({ ...f, isCancelled: false }))} /> Déplacement
                </label>
              </div>
              {!exForm.isCancelled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nouvelle date</label>
                    <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      value={exForm.newDate} onChange={e => setExForm(f => ({ ...f, newDate: e.target.value }))} />
                  </div>
                  <div>
                    <input type="time" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      value={exForm.newStartTime} onChange={e => setExForm(f => ({ ...f, newStartTime: e.target.value }))} />
                  </div>
                  <div>
                    <input type="time" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      value={exForm.newEndTime} onChange={e => setExForm(f => ({ ...f, newEndTime: e.target.value }))} />
                  </div>
                </div>
              )}
              <div>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Raison..."
                  value={exForm.reason} onChange={e => setExForm(f => ({ ...f, reason: e.target.value }))} />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setExceptionCourse(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Annuler</button>
              <button onClick={saveException} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
