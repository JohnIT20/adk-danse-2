import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shirt, Star, Plus, Pencil, Trash2, X, Calendar, MapPin, Euro, AlertCircle } from 'lucide-react';
import type { Spectacle, SpectacleCostume, AttireCategory } from '../types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

const CATEGORY_COLORS: Record<AttireCategory, string> = {
  'Tenue': 'bg-purple-100 text-purple-700',
  'Chaussures': 'bg-blue-100 text-blue-700',
  'Accessoire': 'bg-green-100 text-green-700',
  'Costume de spectacle': 'bg-amber-100 text-amber-700',
};

const emptySpectacle: Omit<Spectacle, 'id'> = {
  title: '', date: '', venue: '', description: '', costumes: [],
};

const emptyCostume: Omit<SpectacleCostume, 'id'> = {
  groupName: '', courseId: '', description: '', color: '', price: undefined, deadline: '', notes: '',
};

export default function Materials() {
  const { courses, spectacles, teachers, addSpectacle, updateSpectacle, deleteSpectacle } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Spectacle | null>(null);
  const [form, setForm] = useState<Omit<Spectacle, 'id'>>(emptySpectacle);
  const [costumeInput, setCostumeInput] = useState<Omit<SpectacleCostume, 'id'>>(emptyCostume);
  const [showCostumeForm, setShowCostumeForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'tenues' | 'spectacles'>('tenues');

  function openNew() {
    setEditing(null);
    setForm({ ...emptySpectacle });
    setCostumeInput(emptyCostume);
    setShowCostumeForm(false);
    setShowModal(true);
  }

  function openEdit(s: Spectacle) {
    setEditing(s);
    setForm({ ...s });
    setShowCostumeForm(false);
    setShowModal(true);
  }

  function save() {
    if (editing) updateSpectacle({ ...form, id: editing.id });
    else addSpectacle({ ...form, id: generateId() });
    setShowModal(false);
  }

  function addCostume() {
    if (!costumeInput.groupName.trim() || !costumeInput.description.trim()) return;
    setForm(f => ({ ...f, costumes: [...f.costumes, { ...costumeInput, id: generateId() }] }));
    setCostumeInput(emptyCostume);
    setShowCostumeForm(false);
  }

  function removeCostume(id: string) {
    setForm(f => ({ ...f, costumes: f.costumes.filter(c => c.id !== id) }));
  }

  const activeCourses = courses.filter(c => c.active);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('tenues')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'tenues' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'}`}
        >
          <Shirt size={15} /> Tenues par cours
        </button>
        <button
          onClick={() => setActiveTab('spectacles')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'spectacles' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'}`}
        >
          <Star size={15} /> Spectacles & Costumes
        </button>
      </div>

      {/* ====== TENUES TAB ====== */}
      {activeTab === 'tenues' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 flex items-start gap-3">
            <AlertCircle size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p>Cette section liste les tenues et équipements que <strong>les élèves doivent apporter</strong> pour chaque cours. Pour modifier ces informations, utilisez le bouton <em>Modifier</em> dans la page <strong>Cours réguliers</strong>.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {activeCourses.map(c => {
              const teacher = teachers.find(t => t.id === c.teacherId);
              return (
                <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                    <div className="w-1.5 self-stretch rounded-full" style={{ backgroundColor: teacher?.color ?? '#7C3AED' }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 text-sm">{c.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {c.dayOfWeek} {c.startTime}–{c.endTime} · {c.ageGroup}
                        {teacher && <> · <span style={{ color: teacher.color }}>{teacher.firstName}</span></>}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    {c.attire.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Aucune tenue définie pour ce cours.</p>
                    ) : (
                      <div className="space-y-2">
                        {c.attire.map(a => (
                          <div key={a.id} className="flex items-start gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${CATEGORY_COLORS[a.category]}`}>
                              {a.category}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-gray-800">{a.name}</span>
                              {!a.mandatory && <span className="ml-1 text-xs text-gray-400">(optionnel)</span>}
                              {a.description && <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>}
                              {(a.color || a.brand) && (
                                <p className="text-xs text-gray-400">
                                  {a.color && <span>Couleur : <strong>{a.color}</strong></span>}
                                  {a.color && a.brand && ' · '}
                                  {a.brand && <span>Marque conseillée : <strong>{a.brand}</strong></span>}
                                </p>
                              )}
                              {a.notes && <p className="text-xs text-gray-400 italic mt-0.5">{a.notes}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====== SPECTACLES TAB ====== */}
      {activeTab === 'spectacles' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
              <Plus size={16} /> Nouveau spectacle
            </button>
          </div>

          {spectacles.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
              Aucun spectacle programmé.
            </div>
          )}

          {spectacles.map(s => (
            <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                      <Star size={18} className="text-amber-500" /> {s.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-purple-400" />
                        {format(parseISO(s.date), 'EEEE d MMMM yyyy', { locale: fr })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-purple-400" /> {s.venue}
                      </span>
                    </div>
                    {s.description && <p className="text-sm text-gray-500 mt-1">{s.description}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><Pencil size={15} /></button>
                    <button onClick={() => deleteSpectacle(s.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>

              {/* Costumes */}
              <div className="p-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <Shirt size={14} /> Costumes par groupe
                </h4>
                {s.costumes.length === 0 ? (
                  <p className="text-xs text-gray-400">Aucun costume défini.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {s.costumes.map(c => {
                      const course = courses.find(x => x.id === c.courseId);
                      return (
                        <div key={c.id} className="border border-amber-100 bg-amber-50/40 rounded-xl p-4">
                          <div className="font-semibold text-gray-800 text-sm mb-1">{c.groupName}</div>
                          {course && <div className="text-xs text-gray-400 mb-2">Cours : {course.name}</div>}
                          <p className="text-sm text-gray-600">{c.description}</p>
                          {c.color && <p className="text-xs text-gray-500 mt-1">Couleur : <strong>{c.color}</strong></p>}
                          <div className="flex flex-wrap gap-3 mt-2">
                            {c.price !== undefined && c.price > 0 && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                <Euro size={10} /> {c.price}€
                              </span>
                            )}
                            {c.deadline && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                Délai : {format(parseISO(c.deadline), 'd MMM yyyy', { locale: fr })}
                              </span>
                            )}
                          </div>
                          {c.notes && <p className="text-xs text-gray-400 italic mt-2">{c.notes}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Spectacle modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">{editing ? 'Modifier le spectacle' : 'Nouveau spectacle'}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-5">

              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Informations du spectacle</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Gala de fin d'année 2026" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lieu / Salle</label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Ex: Centre Culturel..." />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                      value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                </div>
              </section>

              {/* Costumes */}
              <section className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Costumes par groupe</p>
                  <button onClick={() => setShowCostumeForm(v => !v)} className="text-xs text-purple-600 flex items-center gap-1">
                    <Plus size={12} /> Ajouter un groupe
                  </button>
                </div>

                {form.costumes.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {form.costumes.map(c => (
                      <div key={c.id} className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-800">{c.groupName}</span>
                          <span className="text-gray-500 ml-2 text-xs">{c.description}</span>
                          {c.color && <span className="text-gray-400 ml-1 text-xs">· {c.color}</span>}
                          {c.price !== undefined && c.price > 0 && <span className="text-green-600 ml-2 text-xs">{c.price}€</span>}
                        </div>
                        <button onClick={() => removeCostume(c.id)} className="text-red-400 hover:text-red-600 ml-2"><X size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}

                {showCostumeForm && (
                  <div className="border border-amber-200 rounded-xl p-4 space-y-3 bg-amber-50/30">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nom du groupe *</label>
                        <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                          placeholder="Ex: Groupe Jazz ados" value={costumeInput.groupName}
                          onChange={e => setCostumeInput(c => ({ ...c, groupName: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Cours associé</label>
                        <select className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                          value={costumeInput.courseId ?? ''} onChange={e => setCostumeInput(c => ({ ...c, courseId: e.target.value }))}>
                          <option value="">— Aucun —</option>
                          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Description du costume *</label>
                        <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                          placeholder="Ex: Tutu blanc, justaucorps argenté, chaussons roses..." value={costumeInput.description}
                          onChange={e => setCostumeInput(c => ({ ...c, description: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Couleur(s)</label>
                        <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                          placeholder="Ex: Blanc / Argent" value={costumeInput.color ?? ''}
                          onChange={e => setCostumeInput(c => ({ ...c, color: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Prix costume (€)</label>
                        <input type="number" min={0} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                          placeholder="0" value={costumeInput.price ?? ''}
                          onChange={e => setCostumeInput(c => ({ ...c, price: e.target.value ? +e.target.value : undefined }))} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Date limite commande</label>
                        <input type="date" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                          value={costumeInput.deadline ?? ''} onChange={e => setCostumeInput(c => ({ ...c, deadline: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                        <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                          placeholder="Commande groupée, retrait à l'école..." value={costumeInput.notes ?? ''}
                          onChange={e => setCostumeInput(c => ({ ...c, notes: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setShowCostumeForm(false)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-500">Annuler</button>
                      <button onClick={addCostume} className="px-3 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600">Ajouter ce groupe</button>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Annuler</button>
              <button onClick={save} disabled={!form.title || !form.date} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
