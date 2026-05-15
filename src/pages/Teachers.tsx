import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Plus, Pencil, Trash2, X, Mail, Phone, BookOpen, Users,
  UserCheck, AlertTriangle, ChevronRight, ArrowLeftRight,
  ShieldCheck, Search,
} from 'lucide-react';
import type { Teacher, DanceStyle, Course } from '../types';

const STYLES: DanceStyle[] = [
  'Éveil à la danse', 'Danse classique', 'Jazz', 'Contemporain', 'Hip-hop',
  'Break', 'Ragga', 'Girly', 'Pomdance', 'Line Dance', 'Pole Dance',
];

const COLORS = ['#7C3AED', '#059669', '#D97706', '#DC2626', '#2563EB', '#DB2777', '#0891B2', '#65A30D'];

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

const EMPTY_TEACHER: Omit<Teacher, 'id'> = {
  firstName: '', lastName: '', email: '', phone: '', specialties: [], bio: '', color: COLORS[0],
};

type ManageTab = 'courses' | 'info';

// ── Compact teacher card shown in the grid ──────────────────────────────────
function TeacherCard({
  teacher, courses, onManage, onEdit, onDelete,
}: {
  teacher: Teacher;
  courses: Course[];
  onManage: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const myCourses = courses.filter(c => c.active && c.teacherId === teacher.id);
  const withSub   = myCourses.filter(c => c.substituteTeacherId).length;
  const noSub     = myCourses.length - withSub;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      <div className="h-1.5" style={{ backgroundColor: teacher.color }} />
      <div className="p-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <div className="font-bold text-gray-800 text-base truncate">
              {teacher.firstName} {teacher.lastName}
            </div>
            {teacher.bio && (
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{teacher.bio}</p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={onEdit}
              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
              title="Modifier les infos"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              title="Supprimer"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-1 mb-3 text-xs text-gray-500">
          {teacher.email && (
            <div className="flex items-center gap-1.5 truncate">
              <Mail size={11} className="text-gray-400 shrink-0" />
              <span className="truncate">{teacher.email}</span>
            </div>
          )}
          {teacher.phone && (
            <div className="flex items-center gap-1.5">
              <Phone size={11} className="text-gray-400 shrink-0" />
              {teacher.phone}
            </div>
          )}
        </div>

        {/* Specialties */}
        {teacher.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {teacher.specialties.map(s => (
              <span
                key={s}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${teacher.color}18`, color: teacher.color }}
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Course stats */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <BookOpen size={11} /> {myCourses.length} cours
          </span>
          {withSub > 0 && (
            <span className="flex items-center gap-1 text-green-600">
              <ShieldCheck size={11} /> {withSub} couvert{withSub > 1 ? 's' : ''}
            </span>
          )}
          {noSub > 0 && myCourses.length > 0 && (
            <span className="flex items-center gap-1 text-orange-500">
              <AlertTriangle size={11} /> {noSub} sans remplaçant
            </span>
          )}
        </div>

        {/* Manage button */}
        <button
          onClick={onManage}
          className="mt-auto w-full flex items-center justify-center gap-2 py-2 border border-purple-200 text-purple-700 hover:bg-purple-50 rounded-lg text-sm font-medium transition-colors"
        >
          <Users size={14} /> Gérer les cours
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Management modal ────────────────────────────────────────────────────────
function ManageModal({
  teacher,
  teachers,
  courses,
  rooms,
  onClose,
  onEdit,
  onUpdateCourse,
}: {
  teacher: Teacher;
  teachers: Teacher[];
  courses: Course[];
  rooms: { id: string; name: string; venue: string; city: string }[];
  onClose: () => void;
  onEdit: () => void;
  onUpdateCourse: (c: Course) => void;
}) {
  const [tab, setTab]           = useState<ManageTab>('courses');
  const [assignId, setAssignId] = useState('');
  const [search, setSearch]     = useState('');
  const [emergencyId, setEmergencyId] = useState('');

  const myCourses   = courses.filter(c => c.active && c.teacherId === teacher.id);
  const otherCourses = courses.filter(c => c.active && c.teacherId !== teacher.id);

  const filteredMy = myCourses.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.dayOfWeek.toLowerCase().includes(search.toLowerCase())
  );

  function roomLabel(rid: string) {
    const r = rooms.find(x => x.id === rid);
    return r ? `${r.venue} · ${r.name}` : rid;
  }

  function compatibleSubs(course: Course) {
    return teachers.filter(t => t.id !== teacher.id && t.specialties.includes(course.style));
  }

  function allOtherTeachers(excludeId: string) {
    return teachers.filter(t => t.id !== excludeId);
  }

  function setSubstitute(course: Course, subId: string) {
    onUpdateCourse({ ...course, substituteTeacherId: subId || undefined });
  }

  function reassignCourse(course: Course, newTeacherId: string) {
    if (!newTeacherId || newTeacherId === course.teacherId) return;
    onUpdateCourse({ ...course, teacherId: newTeacherId, substituteTeacherId: undefined });
  }

  function applyEmergency() {
    if (!emergencyId) return;
    myCourses.forEach(c => {
      onUpdateCourse({ ...c, substituteTeacherId: emergencyId });
    });
    setEmergencyId('');
  }

  function clearAllSubs() {
    myCourses.forEach(c => {
      onUpdateCourse({ ...c, substituteTeacherId: undefined });
    });
  }

  function doAssign() {
    const c = courses.find(x => x.id === assignId);
    if (!c) return;
    onUpdateCourse({ ...c, teacherId: teacher.id, substituteTeacherId: undefined });
    setAssignId('');
  }

  const noSubCount = myCourses.filter(c => !c.substituteTeacherId).length;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100" style={{ borderTopColor: teacher.color, borderTopWidth: 3 }}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ backgroundColor: teacher.color }}
          >
            {teacher.firstName[0]}{teacher.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-800">{teacher.firstName} {teacher.lastName}</div>
            <div className="text-xs text-gray-400">{myCourses.length} cours · {teacher.specialties.join(', ') || 'Aucune spécialité'}</div>
          </div>
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg" title="Modifier les infos">
            <Pencil size={15} />
          </button>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-4">
          {([['courses', 'Cours & Remplaçants'], ['info', 'Infos du prof']] as [ManageTab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── TAB: Cours & Remplaçants ── */}
          {tab === 'courses' && (
            <div className="p-4 space-y-5">

              {/* Emergency replacement banner */}
              {noSubCount > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={15} className="text-orange-500" />
                    <span className="text-sm font-semibold text-orange-800">
                      {noSubCount} cours sans remplaçant désigné
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={emergencyId}
                      onChange={e => setEmergencyId(e.target.value)}
                      className="flex-1 border border-orange-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                    >
                      <option value="">— Remplaçant pour tous les cours —</option>
                      {teachers.filter(t => t.id !== teacher.id).map(t => (
                        <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                      ))}
                    </select>
                    <button
                      onClick={applyEmergency}
                      disabled={!emergencyId}
                      className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-40 whitespace-nowrap"
                    >
                      Appliquer
                    </button>
                  </div>
                </div>
              )}

              {/* Clear all subs button */}
              {myCourses.some(c => c.substituteTeacherId) && (
                <div className="flex justify-end">
                  <button
                    onClick={clearAllSubs}
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                  >
                    <X size={11} /> Effacer tous les remplaçants
                  </button>
                </div>
              )}

              {/* Search */}
              {myCourses.length > 5 && (
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Filtrer les cours..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
              )}

              {/* Course list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Cours assignés ({myCourses.length})
                  </h3>
                </div>

                {myCourses.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-6 text-center text-sm text-gray-400">
                    Aucun cours assigné à ce professeur.
                  </div>
                ) : filteredMy.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-4">Aucun résultat.</div>
                ) : (
                  <div className="space-y-3">
                    {filteredMy.map(course => {
                      const compatible = compatibleSubs(course);
                      const others = allOtherTeachers(teacher.id).filter(t => !compatible.find(c => c.id === t.id));
                      const currentSub = course.substituteTeacherId
                        ? teachers.find(t => t.id === course.substituteTeacherId)
                        : null;

                      return (
                        <CourseRow
                          key={course.id}
                          course={course}
                          roomLabel={roomLabel(course.room)}
                          currentSub={currentSub ?? null}
                          compatible={compatible}
                          others={others}
                          allTeachers={teachers}
                          currentTeacherId={teacher.id}
                          onSetSub={subId => setSubstitute(course, subId)}
                          onReassign={newId => reassignCourse(course, newId)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Assign new course */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Assigner un cours à ce professeur
                </h3>
                {otherCourses.length === 0 ? (
                  <p className="text-xs text-gray-400">Tous les cours actifs sont déjà assignés à ce professeur.</p>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={assignId}
                      onChange={e => setAssignId(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    >
                      <option value="">— Choisir un cours à assigner —</option>
                      {otherCourses
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(c => {
                          const currentTeacher = teachers.find(t => t.id === c.teacherId);
                          return (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.dayOfWeek} {c.startTime}){currentTeacher ? ` — actuellement: ${currentTeacher.firstName}` : ''}
                            </option>
                          );
                        })}
                    </select>
                    <button
                      onClick={doAssign}
                      disabled={!assignId}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-40 whitespace-nowrap"
                    >
                      Assigner
                    </button>
                  </div>
                )}
              </div>

              {/* Substitutability overview */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Remplaçants potentiels (par spécialité)
                </h3>
                {teacher.specialties.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Aucune spécialité définie pour ce professeur.</p>
                ) : (
                  <div className="space-y-2">
                    {teacher.specialties.map(style => {
                      const subs = teachers.filter(t => t.id !== teacher.id && t.specialties.includes(style));
                      return (
                        <div key={style} className="flex items-start gap-2">
                          <span className="text-xs text-gray-600 font-medium w-32 shrink-0 mt-0.5">{style}</span>
                          <div className="flex flex-wrap gap-1">
                            {subs.length === 0 ? (
                              <span className="text-xs text-red-400 italic">Aucun remplaçant disponible</span>
                            ) : subs.map(t => (
                              <span
                                key={t.id}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: `${t.color}18`, color: t.color }}
                              >
                                {t.firstName} {t.lastName}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: Infos du prof (read-only summary, edit opens separate modal) ── */}
          {tab === 'info' && (
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail size={14} className="text-gray-400" />
                  {teacher.email || <span className="text-gray-400 italic">Non renseigné</span>}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone size={14} className="text-gray-400" />
                  {teacher.phone || <span className="text-gray-400 italic">Non renseigné</span>}
                </div>
                {teacher.bio && (
                  <p className="text-gray-600 italic">{teacher.bio}</p>
                )}
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Spécialités</div>
                {teacher.specialties.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Aucune spécialité définie.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {teacher.specialties.map(s => (
                      <span key={s} className="text-xs px-3 py-1 rounded-full font-medium"
                        style={{ backgroundColor: `${teacher.color}18`, color: teacher.color }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Couleur calendrier</div>
                <div className="w-8 h-8 rounded-full border-2 border-gray-200" style={{ backgroundColor: teacher.color }} />
              </div>

              <button
                onClick={onEdit}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl text-sm font-medium transition-colors"
              >
                <Pencil size={14} /> Modifier les informations
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Per-course row in the management modal ──────────────────────────────────
function CourseRow({
  course, roomLabel, currentSub, compatible, others, allTeachers, currentTeacherId,
  onSetSub, onReassign,
}: {
  course: Course;
  roomLabel: string;
  currentSub: Teacher | null;
  compatible: Teacher[];
  others: Teacher[];
  allTeachers: Teacher[];
  currentTeacherId: string;
  onSetSub: (id: string) => void;
  onReassign: (id: string) => void;
}) {
  const [showReassign, setShowReassign] = useState(false);
  const [reassignTo, setReassignTo]     = useState('');

  function confirmReassign() {
    if (!reassignTo) return;
    onReassign(reassignTo);
    setShowReassign(false);
    setReassignTo('');
  }

  const hasSub = !!currentSub;

  return (
    <div className={`rounded-xl border p-3 space-y-2 ${hasSub ? 'border-green-100 bg-green-50/30' : 'border-gray-100 bg-white'}`}>
      {/* Course header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-gray-800 text-sm truncate">{course.name}</div>
          <div className="text-xs text-gray-500">{course.dayOfWeek} · {course.startTime}–{course.endTime}</div>
          <div className="text-xs text-gray-400 truncate">{roomLabel}</div>
        </div>
        <div className="flex gap-1 shrink-0">
          {hasSub && (
            <span className="text-[10px] flex items-center gap-0.5 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
              <ShieldCheck size={9} /> Couvert
            </span>
          )}
          <button
            onClick={() => { setShowReassign(v => !v); setReassignTo(''); }}
            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Réassigner ce cours"
          >
            <ArrowLeftRight size={13} />
          </button>
        </div>
      </div>

      {/* Substitute selector */}
      <div className="flex items-center gap-2">
        <UserCheck size={13} className="text-gray-400 shrink-0" />
        <select
          value={course.substituteTeacherId ?? ''}
          onChange={e => onSetSub(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
        >
          <option value="">— Aucun remplaçant —</option>
          {compatible.length > 0 && (
            <optgroup label="✓ Spécialité correspondante">
              {compatible.map(t => (
                <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
              ))}
            </optgroup>
          )}
          {others.length > 0 && (
            <optgroup label="Autres professeurs">
              {others.map(t => (
                <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
              ))}
            </optgroup>
          )}
        </select>
        {compatible.length === 0 && (
          <span className="text-[10px] text-orange-500 whitespace-nowrap">Aucune correspondance</span>
        )}
      </div>

      {/* Reassign panel */}
      {showReassign && (
        <div className="flex gap-2 border-t border-gray-100 pt-2">
          <select
            value={reassignTo}
            onChange={e => setReassignTo(e.target.value)}
            className="flex-1 border border-blue-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          >
            <option value="">— Nouveau professeur principal —</option>
            {allTeachers.filter(t => t.id !== currentTeacherId).map(t => (
              <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
            ))}
          </select>
          <button
            onClick={confirmReassign}
            disabled={!reassignTo}
            className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 disabled:opacity-40"
          >
            Confirmer
          </button>
          <button
            onClick={() => setShowReassign(false)}
            className="px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-500"
          >
            <X size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Edit / Create teacher modal ─────────────────────────────────────────────
function EditModal({
  teacher,
  onClose,
  onSave,
}: {
  teacher: Teacher | null;
  onClose: () => void;
  onSave: (data: Omit<Teacher, 'id'>) => void;
}) {
  const [form, setForm] = useState<Omit<Teacher, 'id'>>(
    teacher ? { ...teacher } : { ...EMPTY_TEACHER }
  );

  function toggleSpecialty(s: DanceStyle) {
    setForm(f => ({
      ...f,
      specialties: f.specialties.includes(s)
        ? f.specialties.filter(x => x !== s)
        : [...f.specialties, s],
    }));
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md max-h-[95vh] sm:max-h-[90vh] sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">
            {teacher ? 'Modifier le professeur' : 'Nouveau professeur'}
          </h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Notes</label>
              <textarea
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                value={form.bio ?? ''}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Couleur du calendrier</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Spécialités enseignées</label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSpecialty(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    form.specialties.includes(s)
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'border-gray-200 text-gray-600 hover:border-purple-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
            Annuler
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.firstName.trim() || !form.lastName.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-40"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function Teachers() {
  const { teachers, courses, rooms, addTeacher, updateTeacher, deleteTeacher, updateCourse } = useApp();

  const [managingTeacher, setManagingTeacher] = useState<Teacher | null>(null);
  const [editingTeacher, setEditingTeacher]   = useState<Teacher | null | 'new'>('new' as const);
  const [showEdit, setShowEdit]               = useState(false);

  function openNew() { setEditingTeacher(null); setShowEdit(true); }

  function openEdit(t: Teacher) {
    setEditingTeacher(t);
    setShowEdit(true);
    // If editing from management modal, close it temporarily then reopen after save
  }

  function handleSave(data: Omit<Teacher, 'id'>) {
    if (editingTeacher && typeof editingTeacher === 'object') {
      updateTeacher({ ...data, id: editingTeacher.id });
      // Refresh managing teacher if open
      if (managingTeacher?.id === editingTeacher.id) {
        setManagingTeacher({ ...data, id: editingTeacher.id });
      }
    } else {
      addTeacher({ ...data, id: genId() });
    }
    setShowEdit(false);
  }

  function handleDelete(t: Teacher) {
    if (!window.confirm(`Supprimer ${t.firstName} ${t.lastName} ? Cette action est irréversible.`)) return;
    deleteTeacher(t.id);
    if (managingTeacher?.id === t.id) setManagingTeacher(null);
  }

  // Summary stats
  const totalCourses = courses.filter(c => c.active).length;
  const coveredCourses = courses.filter(c => c.active && c.substituteTeacherId).length;
  const uncoveredCourses = totalCourses - coveredCourses;

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Users size={14} className="text-purple-500" /> {teachers.length} professeurs
          </span>
          <span className="flex items-center gap-1">
            <BookOpen size={14} className="text-purple-500" /> {totalCourses} cours
          </span>
          {uncoveredCourses > 0 && (
            <span className="flex items-center gap-1 text-orange-500 font-medium">
              <AlertTriangle size={14} /> {uncoveredCourses} sans remplaçant
            </span>
          )}
          {coveredCourses > 0 && uncoveredCourses === 0 && (
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <ShieldCheck size={14} /> Tous les cours couverts
            </span>
          )}
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
        >
          <Plus size={15} /> Nouveau professeur
        </button>
      </div>

      {/* Teacher grid */}
      {teachers.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">
          <Users size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aucun professeur enregistré.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map(t => (
            <TeacherCard
              key={t.id}
              teacher={t}
              courses={courses}
              onManage={() => setManagingTeacher(t)}
              onEdit={() => openEdit(t)}
              onDelete={() => handleDelete(t)}
            />
          ))}
        </div>
      )}

      {/* Management modal */}
      {managingTeacher && (
        <ManageModal
          teacher={managingTeacher}
          teachers={teachers}
          courses={courses}
          rooms={rooms}
          onClose={() => setManagingTeacher(null)}
          onEdit={() => openEdit(managingTeacher)}
          onUpdateCourse={updateCourse}
        />
      )}

      {/* Edit / Create modal */}
      {showEdit && (
        <EditModal
          teacher={editingTeacher && typeof editingTeacher === 'object' ? editingTeacher : null}
          onClose={() => setShowEdit(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
