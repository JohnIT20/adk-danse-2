import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, AlertTriangle, X, Shirt, Euro, ChevronRight } from 'lucide-react';
import type { Course, DanceStyle, Level, AgeGroup, DayOfWeek, AttireItem, AttireCategory } from '../types';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const STYLES: DanceStyle[] = ['Éveil à la danse', 'Danse classique', 'Jazz', 'Contemporain', 'Hip-hop', 'Break', 'Ragga', 'Girly', 'Pomdance', 'Line Dance', 'Pole Dance'];
const LEVELS: Level[] = ['Éveil', 'Débutant', 'Intermédiaire', 'Avancé', 'Tous niveaux'];
const AGE_GROUPS: AgeGroup[] = ['3-5 ans', '6-8 ans', '9-11 ans', '12-14 ans', '15-17 ans', 'Adultes', 'Tous âges'];
const DAYS: DayOfWeek[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const ATTIRE_CATEGORIES: AttireCategory[] = ['Tenue', 'Chaussures', 'Accessoire', 'Costume de spectacle'];
const PRICE_LABELS = ['/ mois', '/ trimestre', '/ semestre', '/ année', '/ séance'];

const CATEGORY_COLORS: Record<AttireCategory, string> = {
  'Tenue': 'bg-purple-100 text-purple-700',
  'Chaussures': 'bg-blue-100 text-blue-700',
  'Accessoire': 'bg-green-100 text-green-700',
  'Costume de spectacle': 'bg-amber-100 text-amber-700',
};

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

const emptyCourse: Omit<Course, 'id'> = {
  name: '', style: 'Jazz', level: 'Débutant', ageGroup: '6-8 ans',
  teacherId: '', room: '', dayOfWeek: 'Lundi', startTime: '09:00', endTime: '10:00',
  capacity: 15, price: 60, priceLabel: '/ mois', attire: [], active: true,
};

const courseSchema = z.object({
  name: z.string().min(1, "Le nom du cours est requis"),
  style: z.string(),
  level: z.string(),
  ageGroup: z.string(),
  teacherId: z.string(),
  room: z.string().min(1, "La salle est requise"),
  dayOfWeek: z.string(),
  startTime: z.string().min(1, "Heure requise"),
  endTime: z.string().min(1, "Heure requise"),
  capacity: z.coerce.number().min(1, "Capacité minimum de 1"),
  price: z.coerce.number().min(0, "Prix invalide"),
  priceLabel: z.string(),
  description: z.string().optional(),
  active: z.boolean(),
});
type CourseFormValues = z.infer<typeof courseSchema>;

const attireSchema = z.object({
  category: z.enum(['Tenue', 'Chaussures', 'Accessoire', 'Costume de spectacle']),
  mandatory: z.boolean(),
  name: z.string().min(1, "Le nom de l'article est requis"),
  description: z.string().optional(),
  color: z.string().optional(),
  brand: z.string().optional(),
  notes: z.string().optional(),
});
type AttireFormValues = z.infer<typeof attireSchema>;

const STYLE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Éveil à la danse': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', dot: '#ec4899' },
  'Danse classique': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: '#7c3aed' },
  'Jazz':            { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: '#d97706' },
  'Contemporain':    { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',   dot: '#0d9488' },
  'Hip-hop':         { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: '#2563eb' },
  'Break':           { bg: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-200',   dot: '#0891b2' },
  'Ragga':           { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: '#ea580c' },
  'Girly':           { bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200',   dot: '#e11d48' },
  'Pomdance':        { bg: 'bg-fuchsia-50',text: 'text-fuchsia-700',border: 'border-fuchsia-200',dot: '#a21caf' },
  'Line Dance':      { bg: 'bg-lime-50',   text: 'text-lime-700',   border: 'border-lime-200',   dot: '#65a30d' },
  'Pole Dance':      { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: '#4338ca' },
};
const DEFAULT_STYLE_COLOR = { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: '#6b7280' };

export default function Courses() {
  const { courses, teachers, addCourse, updateCourse, deleteCourse, courseExceptions, addCourseException, deleteCourseException } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [attireList, setAttireList] = useState<AttireItem[]>([]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: emptyCourse as unknown as CourseFormValues
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionCourse, setExceptionCourse] = useState<Course | null>(null);
  const [exForm, setExForm] = useState({ originalDate: format(new Date(), 'yyyy-MM-dd'), isCancelled: true, newDate: '', newStartTime: '', newEndTime: '', reason: '' });
  const [showAttireForm, setShowAttireForm] = useState(false);

  const attireForm = useForm<AttireFormValues>({
    resolver: zodResolver(attireSchema),
    defaultValues: { category: 'Tenue', mandatory: true, name: '', description: '', color: '', brand: '', notes: '' }
  });

  function openNew() {
    setEditing(null);
    setAttireList([]);
    reset({ ...emptyCourse, teacherId: teachers[0]?.id ?? '' } as CourseFormValues);
    attireForm.reset();
    setShowAttireForm(false);
    setShowModal(true);
  }

  function openEdit(c: Course) {
    setEditing(c);
    setAttireList(c.attire || []);
    reset({
      name: c.name, style: c.style, level: c.level, ageGroup: c.ageGroup,
      teacherId: c.teacherId, room: c.room, dayOfWeek: c.dayOfWeek, startTime: c.startTime,
      endTime: c.endTime, capacity: c.capacity, price: c.price, priceLabel: c.priceLabel,
      description: c.description ?? '', active: c.active
    });
    attireForm.reset();
    setShowAttireForm(false);
    setShowModal(true);
  }

  function onSubmit(data: CourseFormValues) {
    const courseData = { ...data, attire: attireList } as unknown as Omit<Course, 'id'>;
    if (editing) updateCourse({ ...courseData, id: editing.id });
    else addCourse({ ...courseData, id: generateId() });
    setShowModal(false);
  }

  async function addAttireItem() {
    const isValid = await attireForm.trigger();
    if (isValid) {
      const data = attireForm.getValues();
      setAttireList(prev => [...prev, { ...data, description: data.description ?? '', id: generateId() } as AttireItem]);
      attireForm.reset();
      setShowAttireForm(false);
    }
  }

  function removeAttireItem(id: string) {
    setAttireList(prev => prev.filter(a => a.id !== id));
  }

  function openException(c: Course) {
    setExceptionCourse(c);
    setExForm({ originalDate: format(new Date(), 'yyyy-MM-dd'), isCancelled: true, newDate: '', newStartTime: '', newEndTime: '', reason: '' });
    setShowExceptionModal(true);
  }

  function saveException() {
    if (!exceptionCourse) return;
    addCourseException({ id: generateId(), courseId: exceptionCourse.id, ...exForm });
    setShowExceptionModal(false);
  }

  // Helper: render a single course card
  function renderCourseCard(c: typeof courses[number]) {
    const teacher = teachers.find(t => t.id === c.teacherId);
    const exceptions = courseExceptions.filter(e => e.courseId === c.id);
    const isExpanded = expandedId === c.id;
    return (
      <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 flex items-start gap-3">
          <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: teacher?.color ?? '#7C3AED' }} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-gray-800">{c.name}</span>
              {!c.active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactif</span>}
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.level}</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{c.ageGroup}</span>
            </div>
            <div className="text-sm text-gray-500">
              {c.dayOfWeek} · {c.startTime}–{c.endTime} · {c.room}
              {teacher && <> · <span style={{ color: teacher.color }}>{teacher.firstName} {teacher.lastName}</span></>}
            </div>
            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-3">
              <span>{c.capacity} places max</span>
              {c.price > 0 && (
                <span className="flex items-center gap-0.5 text-green-600 font-medium">
                  <Euro size={11} />{c.price}{c.priceLabel}
                </span>
              )}
              {c.attire.length > 0 && (
                <span className="flex items-center gap-0.5 text-purple-500">
                  <Shirt size={11} />{c.attire.length} article(s) tenue
                </span>
              )}
              {exceptions.length > 0 && (
                <span className="text-orange-500">{exceptions.length} exception(s)</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => openException(c)} className="p-1.5 text-orange-400 hover:bg-orange-50 rounded-lg" title="Exception ponctuelle">
              <AlertTriangle size={15} />
            </button>
            <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
              <Pencil size={15} />
            </button>
            <button onClick={() => deleteCourse(c.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
              <Trash2 size={15} />
            </button>
            <button onClick={() => setExpandedId(isExpanded ? null : c.id)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>
        {isExpanded && (
          <div className="border-t border-gray-100 p-4 space-y-4">
            {c.description && <p className="text-sm text-gray-600">{c.description}</p>}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <Shirt size={14} className="text-purple-500" /> Tenue requise pour les élèves
              </h3>
              {c.attire.length === 0 ? (
                <p className="text-xs text-gray-400">Aucune tenue définie.</p>
              ) : (
                <div className="space-y-2">
                  {c.attire.map(a => (
                    <div key={a.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${CATEGORY_COLORS[a.category]}`}>
                        {a.category}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-800">
                          {a.name}
                          {!a.mandatory && <span className="ml-1 text-xs text-gray-400">(optionnel)</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{a.description}</div>
                        {(a.color || a.brand) && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {a.color && <span>Couleur : {a.color}</span>}
                            {a.color && a.brand && <span> · </span>}
                            {a.brand && <span>Marque : {a.brand}</span>}
                          </div>
                        )}
                        {a.notes && <div className="text-xs text-gray-400 italic mt-0.5">{a.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {exceptions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-orange-500" /> Exceptions / Modifications ponctuelles
                </h3>
                <div className="space-y-1">
                  {exceptions.map(ex => (
                    <div key={ex.id} className="text-xs flex items-center gap-2 bg-orange-50 rounded-lg p-2">
                      <span className="font-medium text-gray-700">{ex.originalDate}</span>
                      {ex.isCancelled ? (
                        <span className="text-red-600 font-medium">Annulé</span>
                      ) : (
                        <span className="text-blue-600">→ Déplacé au {ex.newDate} {ex.newStartTime && `à ${ex.newStartTime}`}</span>
                      )}
                      {ex.reason && <span className="text-gray-400">({ex.reason})</span>}
                      <button onClick={() => deleteCourseException(ex.id)} className="ml-auto text-red-400 hover:text-red-600">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Group active courses by style, keep inactive separate.
  // Data-driven: group by the actual `style` value present in the data
  // (works even if Supabase returns a value not in the predefined STYLES list).
  const activeCourses = courses.filter(c => c.active);
  const inactiveCourses = courses.filter(c => !c.active);
  const presentStyles: string[] = Array.from(new Set(activeCourses.map(c => c.style ?? 'Autre')));
  const KNOWN_STYLES: string[] = STYLES;
  const styleOrder = presentStyles.sort((a, b) => {
    const ia = KNOWN_STYLES.indexOf(a);
    const ib = KNOWN_STYLES.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  const grouped = styleOrder.map(style => ({
    style,
    items: activeCourses.filter(c => (c.style ?? 'Autre') === style),
  }));

  function toggleGroup(key: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {activeCourses.length} cours actifs · {grouped.length} spécialité{grouped.length > 1 ? 's' : ''}
        </p>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
          <Plus size={16} /> Nouveau cours
        </button>
      </div>

      <div className="space-y-4">
        {grouped.map(({ style, items }) => {
          const sc = STYLE_COLORS[style] ?? DEFAULT_STYLE_COLOR;
          const isCollapsed = collapsedGroups.has(style);
          return (
            <div key={style} className={`rounded-xl border ${sc.border} overflow-hidden`}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(style)}
                className={`w-full flex items-center gap-3 px-4 py-3 ${sc.bg} hover:brightness-95 transition-all`}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sc.dot }} />
                <span className={`font-semibold text-sm ${sc.text} flex-1 text-left`}>{style}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.text} border ${sc.border}`}>
                  {items.length} cours
                </span>
                {isCollapsed
                  ? <ChevronRight size={16} className={sc.text} />
                  : <ChevronDown size={16} className={sc.text} />}
              </button>
              {/* Course cards */}
              {!isCollapsed && (
                <div className="divide-y divide-gray-100">
                  {items.map(c => renderCourseCard(c))}
                </div>
              )}
            </div>
          );
        })}

        {/* Inactive courses */}
        {inactiveCourses.length > 0 && (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleGroup('__inactive__')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-all"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400 flex-shrink-0" />
              <span className="font-semibold text-sm text-gray-500 flex-1 text-left">Cours inactifs</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500 border border-gray-200">
                {inactiveCourses.length} cours
              </span>
              {collapsedGroups.has('__inactive__')
                ? <ChevronRight size={16} className="text-gray-400" />
                : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {!collapsedGroups.has('__inactive__') && (
              <div className="divide-y divide-gray-100">
                {inactiveCourses.map(c => renderCourseCard(c))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Course modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">{editing ? 'Modifier le cours' : 'Nouveau cours'}</h2>
            <button type="button" onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-5">

              {/* --- Infos générales --- */}
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Informations générales</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du cours *</label>
                <input className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
                  {...register('name')} placeholder="Ex: Danse classique - Débutants 6-8 ans" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Style de danse</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  {...register('style')}>
                      {STYLES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  {...register('level')}>
                      {LEVELS.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Groupe d'âge</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  {...register('ageGroup')}>
                      {AGE_GROUPS.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Professeur assigné</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  {...register('teacherId')}>
                      <option value="">— Aucun —</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                  {...register('description')} />
                  </div>
                </div>
              </section>

              {/* --- Horaire --- */}
              <section className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Horaire & lieu</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jour de la semaine</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  {...register('dayOfWeek')}>
                      {DAYS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salle</label>
                <input className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${errors.room ? 'border-red-400' : 'border-gray-200'}`}
                  {...register('room')} placeholder="Ex: Salle A, Grande Salle..." />
                {errors.room && <p className="text-red-500 text-xs mt-1">{errors.room.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début</label>
                <input type="time" className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${errors.startTime ? 'border-red-400' : 'border-gray-200'}`}
                  {...register('startTime')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure de fin</label>
                <input type="time" className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${errors.endTime ? 'border-red-400' : 'border-gray-200'}`}
                  {...register('endTime')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacité max (élèves)</label>
                <input type="number" min={1} className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${errors.capacity ? 'border-red-400' : 'border-gray-200'}`}
                  {...register('capacity')} />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="active" {...register('active')} className="rounded w-4 h-4 accent-purple-600" />
                    <label htmlFor="active" className="text-sm text-gray-700">Cours actif (visible au planning)</label>
                  </div>
                </div>
              </section>

              {/* --- Tarif --- */}
              <section className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Tarif</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix (€)</label>
                    <div className="relative">
                      <Euro size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="number" min={0} step={0.5} className={`w-full border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${errors.price ? 'border-red-400' : 'border-gray-200'}`}
                    {...register('price')} placeholder="0" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Période</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  {...register('priceLabel')}>
                      {PRICE_LABELS.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {/* --- Tenues requises --- */}
              <section className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Shirt size={13} /> Tenues & équipement requis pour les élèves
                  </p>
              <button type="button" onClick={() => setShowAttireForm(v => !v)} className="text-xs text-purple-600 flex items-center gap-1 hover:text-purple-800">
                    <Plus size={12} /> Ajouter
                  </button>
                </div>

                {/* Existing items */}
            {attireList.length > 0 && (
                  <div className="space-y-2 mb-3">
                {attireList.map(a => (
                      <div key={a.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[a.category]}`}>{a.category}</span>
                        <span className="font-medium text-gray-700">{a.name}</span>
                        {!a.mandatory && <span className="text-xs text-gray-400">(optionnel)</span>}
                        {a.color && <span className="text-xs text-gray-400">· {a.color}</span>}
                    <button type="button" onClick={() => removeAttireItem(a.id)} className="ml-auto text-red-400 hover:text-red-600"><X size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New item form */}
                {showAttireForm && (
                  <div className="border border-purple-200 rounded-xl p-4 space-y-3 bg-purple-50/30">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Catégorie</label>
                        <select className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                      {...attireForm.register('category')}>
                          {ATTIRE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-2 pt-4">
                    <input type="checkbox" id="mandatory" {...attireForm.register('mandatory')} className="rounded w-4 h-4 accent-purple-600" />
                        <label htmlFor="mandatory" className="text-sm text-gray-700">Obligatoire</label>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nom de l'article *</label>
                    <input className={`w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400 ${attireForm.formState.errors.name ? 'border-red-400' : 'border-gray-200'}`}
                      placeholder="Ex: Justaucorps, Chaussons, Collants..." {...attireForm.register('name')} />
                    {attireForm.formState.errors.name && <p className="text-red-500 text-xs mt-1">{attireForm.formState.errors.name.message}</p>}
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Description précise</label>
                        <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                      placeholder="Ex: Justaucorps lilas, sans manches, col rond..." {...attireForm.register('description')} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Couleur requise</label>
                        <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                      placeholder="Ex: Rose, Noir, Blanc..." {...attireForm.register('color')} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Marque recommandée</label>
                        <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                      placeholder="Ex: Bloch, Freed, Capezio..." {...attireForm.register('brand')} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Notes / remarques</label>
                        <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                      placeholder="Commande groupée possible, achat via l'école..." {...attireForm.register('notes')} />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowAttireForm(false)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-500">Annuler</button>
                  <button type="button" onClick={addAttireItem} className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700">Ajouter l'article</button>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
                Enregistrer
              </button>
            </div>
      </form>
        </div>
      )}

      {/* Exception modal */}
      {showExceptionModal && exceptionCourse && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">Exception — {exceptionCourse.name}</h2>
              <button onClick={() => setShowExceptionModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date du cours concerné</label>
                <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nouvelle date</label>
                    <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      value={exForm.newDate} onChange={e => setExForm(f => ({ ...f, newDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure début</label>
                    <input type="time" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      value={exForm.newStartTime} onChange={e => setExForm(f => ({ ...f, newStartTime: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure fin</label>
                    <input type="time" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      value={exForm.newEndTime} onChange={e => setExForm(f => ({ ...f, newEndTime: e.target.value }))} />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raison</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Congé, événement exceptionnel..." value={exForm.reason}
                  onChange={e => setExForm(f => ({ ...f, reason: e.target.value }))} />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowExceptionModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Annuler</button>
              <button onClick={saveException} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
