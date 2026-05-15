import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Pencil, Trash2, Star, Users, Calendar, Clock, Euro, X } from 'lucide-react';
import type { ProSession, DanceStyle, Level, AgeGroup } from '../types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const STYLES: DanceStyle[] = ['Éveil à la danse', 'Danse classique', 'Jazz', 'Contemporain', 'Hip-hop', 'Break', 'Ragga', 'Girly', 'Pomdance', 'Line Dance', 'Pole Dance'];
const LEVELS: Level[] = ['Éveil', 'Débutant', 'Intermédiaire', 'Avancé', 'Tous niveaux'];
const AGE_GROUPS: AgeGroup[] = ['3-5 ans', '6-8 ans', '9-11 ans', '12-14 ans', '15-17 ans', 'Adultes', 'Tous âges'];

const emptySession: Omit<ProSession, 'id'> = {
  title: '',
  coachName: '',
  coachBio: '',
  style: 'Contemporain',
  level: 'Tous niveaux',
  ageGroup: 'Tous âges',
  date: '',
  startTime: '10:00',
  endTime: '13:00',
  room: 'Grande Salle',
  capacity: 20,
  price: 40,
  registrationOpenDate: '',
  registrationCloseDate: '',
  description: '',
  status: 'draft',
};

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

const STATUS_LABELS: Record<ProSession['status'], string> = {
  draft: 'Brouillon',
  open: 'Inscriptions ouvertes',
  closed: 'Inscriptions fermées',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

const STATUS_COLORS: Record<ProSession['status'], string> = {
  draft: 'bg-gray-100 text-gray-600',
  open: 'bg-green-100 text-green-700',
  closed: 'bg-orange-100 text-orange-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function ProSessions() {
  const { proSessions, registrations, addProSession, updateProSession, deleteProSession } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ProSession | null>(null);
  const [form, setForm] = useState<Omit<ProSession, 'id'>>(emptySession);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  function openNew() {
    setEditing(null);
    setForm({ ...emptySession });
    setShowModal(true);
  }

  function openEdit(s: ProSession) {
    setEditing(s);
    setForm({ ...s });
    setShowModal(true);
  }

  function save() {
    if (editing) {
      updateProSession({ ...form, id: editing.id });
    } else {
      addProSession({ ...form, id: generateId() });
    }
    setShowModal(false);
  }

const filtered = filterStatus === 'all' ? proSessions : proSessions.filter(s => s.status === filterStatus);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {['all', 'draft', 'open', 'closed', 'completed', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === s ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
              }`}
            >
              {s === 'all' ? 'Toutes' : STATUS_LABELS[s as ProSession['status']]}
            </button>
          ))}
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
          <Plus size={16} /> Nouvelle session pro
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map(s => {
          const regCount = registrations.filter(r => r.sessionId === s.id).length;
          const paidCount = registrations.filter(r => r.sessionId === s.id && r.paymentStatus === 'paid').length;
          const fill = Math.round((regCount / s.capacity) * 100);

          return (
            <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Star size={16} className="text-amber-500 flex-shrink-0" />
                      <h3 className="font-semibold text-gray-800">{s.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500">Coach : <span className="font-medium text-gray-700">{s.coachName}</span></p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteProSession(s.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-purple-400" />
                    {format(parseISO(s.date), 'd MMMM yyyy', { locale: fr })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-purple-400" />
                    {s.startTime} – {s.endTime}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={12} className="text-purple-400" />
                    {regCount}/{s.capacity} inscrits
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Euro size={12} className="text-purple-400" />
                    {s.price}€/personne
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{s.style}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s.level}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{s.ageGroup}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status]}`}>
                    {STATUS_LABELS[s.status]}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Remplissage</span>
                    <span>{fill}% · {paidCount} payés</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${fill >= 90 ? 'bg-red-400' : fill >= 60 ? 'bg-amber-400' : 'bg-green-400'}`}
                      style={{ width: `${Math.min(fill, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Registration dates */}
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5">
                  <span className="font-medium text-gray-700">Inscriptions : </span>
                  du {format(parseISO(s.registrationOpenDate), 'd MMM yyyy', { locale: fr })}
                  {' '}au {format(parseISO(s.registrationCloseDate), 'd MMM yyyy', { locale: fr })}
                  <span className="ml-2 text-gray-400">(min. 1 mois avant)</span>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {editing ? 'Modifier la session' : 'Nouvelle session pro'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre de la session *</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Masterclass Contemporary - Marie Chen" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coach invité *</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={form.coachName} onChange={e => setForm(f => ({ ...f, coachName: e.target.value }))} placeholder="Nom du coach" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ProSession['status'] }))}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio du coach</label>
                  <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                    value={form.coachBio ?? ''} onChange={e => setForm(f => ({ ...f, coachBio: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={form.style} onChange={e => setForm(f => ({ ...f, style: e.target.value as DanceStyle }))}>
                    {STYLES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as Level }))}>
                    {LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Groupe d'âge</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={form.ageGroup} onChange={e => setForm(f => ({ ...f, ageGroup: e.target.value as AgeGroup }))}>
                    {AGE_GROUPS.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salle</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de la session</label>
                  <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure début</label>
                  <input type="time" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure fin</label>
                  <input type="time" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacité max</label>
                  <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} min={1} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix (€)</label>
                  <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} min={0} />
                </div>
                <div className="col-span-2 border-t border-gray-100 pt-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Fenêtre d'inscription (min. 1 mois avant la session)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ouverture des inscriptions</label>
                      <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        value={form.registrationOpenDate} onChange={e => setForm(f => ({ ...f, registrationOpenDate: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fermeture des inscriptions</label>
                      <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        value={form.registrationCloseDate} onChange={e => setForm(f => ({ ...f, registrationCloseDate: e.target.value }))} />
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                    value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>

            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
              <button onClick={save} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
