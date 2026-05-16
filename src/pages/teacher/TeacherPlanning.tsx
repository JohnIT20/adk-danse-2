import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, X, Users, Mail, Phone, Clock,
  MapPin, Tag, Euro, BookOpen, ArrowRight,
} from 'lucide-react';
import type { Course, DanceStyle, RepresentationSession } from '../../types';
import { layoutTimeSlots } from '../../utils/layout';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00–22:00

const STYLE_COLORS: Record<DanceStyle, string> = {
  'Éveil à la danse': '#6366F1',
  'Danse classique':  '#3B82F6',
  'Jazz':             '#EC4899',
  'Contemporain':     '#14B8A6',
  'Hip-hop':          '#F59E0B',
  'Break':            '#EF4444',
  'Ragga':            '#22C55E',
  'Girly':            '#DB2777',
  'Pomdance':         '#8B5CF6',
  'Line Dance':       '#06B6D4',
  'Pole Dance':       '#A855F7',
};

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const MIN_HOUR = 8;
const TOTAL_MIN = 15 * 60;

function posStyle(startTime: string, endTime: string) {
  const top    = ((timeToMin(startTime) - MIN_HOUR * 60) / TOTAL_MIN) * 100;
  const height = ((timeToMin(endTime)   - timeToMin(startTime)) / TOTAL_MIN) * 100;
  return { top: `${top}%`, height: `${Math.max(height, 2)}%` };
}

function calcAge(birthDate: string) {
  const born = parseISO(birthDate);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  if (now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())) age--;
  return age;
}

type Selection =
  | { kind: 'course'; course: Course }
  | { kind: 'rep'; rep: RepresentationSession };

export default function TeacherPlanning() {
  const { currentUser } = useAuth();
  const { courses, representations, rooms, courseEnrollments, courseExceptions, students } = useApp();

  const tid = currentUser?.teacherId ?? '';
  const myCourses = courses.filter(c => c.teacherId === tid && c.active);
  const myReps    = representations.filter(r => r.teacherId === tid && r.status !== 'cancelled');

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weekDays = DAYS.map((_, i) => addDays(weekStart, i));

  const [sel, setSel] = useState<Selection | null>(null);

  function prevWeek() { setWeekStart(d => addDays(d, -7)); }
  function nextWeek() { setWeekStart(d => addDays(d, 7)); }
  function goToday()  { setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 })); }

  // Styles used by this teacher (for legend)
  const usedStyles = Object.entries(STYLE_COLORS).filter(([style]) =>
    myCourses.some(c => c.style === style)
  ) as [DanceStyle, string][];

  // Enrolled students for selected course
  const selectedStudents = sel?.kind === 'course'
    ? courseEnrollments
        .filter(e => e.courseId === sel.course.id && e.status === 'active')
        .map(e => students.find(s => s.id === e.studentId))
        .filter(Boolean)
    : [];

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* ── Main column ── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-wrap items-center gap-2">
          <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"><ChevronLeft size={18} /></button>
          <span className="font-semibold text-gray-800 text-sm flex-1 text-center capitalize">
            {format(weekStart, 'd MMM', { locale: fr })} – {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: fr })}
          </span>
          <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"><ChevronRight size={18} /></button>
          <button onClick={goToday} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Aujourd'hui
          </button>
          <div className="hidden md:block ml-auto text-xs text-gray-400 italic">Cliquez sur un cours pour voir les détails</div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto rounded-xl">
            <div style={{ minWidth: '480px' }}>
          {/* Day headers */}
          <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
            <div />
            {weekDays.map((day, i) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div key={i} className={`p-2 text-center border-l border-gray-100 ${isToday ? 'bg-indigo-50' : ''}`}>
                  <div className="text-[11px] text-gray-400 uppercase tracking-wide">{DAYS[i].slice(0, 3)}</div>
                  <div className={`text-sm font-bold mt-0.5 ${isToday ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="overflow-y-auto" style={{ height: 'clamp(280px, 60vh, 580px)' }}>
            <div className="grid relative" style={{ gridTemplateColumns: '48px repeat(7, 1fr)', height: '900px' }}>
              {/* Hour labels */}
              <div className="relative border-r border-gray-100">
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 text-[10px] text-gray-400 text-right pr-1.5 -translate-y-2 select-none"
                    style={{ top: `${((h - MIN_HOUR) / 15) * 100}%` }}
                  >
                    {h}h
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDays.map((day, di) => {
                const dayName = DAYS[di];
                const dateStr = format(day, 'yyyy-MM-dd');
                const isToday = isSameDay(day, new Date());

                const dayCourses = myCourses
                  .filter(c => c.dayOfWeek === dayName)
                  .filter(c => {
                    const ex = courseExceptions.find(e => e.courseId === c.id && e.originalDate === dateStr);
                    return !ex?.isCancelled;
                  });

                const rescheduled = courseExceptions.filter(e => e.newDate === dateStr && !e.isCancelled);
                const dayReps = myReps.filter(r => r.date === dateStr);

                // Merge all events and lay them out side-by-side when they overlap
                type DayEvent =
                  | { kind: 'course'; data: typeof dayCourses[number]; startTime: string; endTime: string }
                  | { kind: 'rescheduled'; data: typeof rescheduled[number]; startTime: string; endTime: string }
                  | { kind: 'rep'; data: typeof dayReps[number]; startTime: string; endTime: string };
                const allEvents: DayEvent[] = [
                  ...dayCourses.map(c => ({ kind: 'course' as const, data: c, startTime: c.startTime, endTime: c.endTime })),
                  ...rescheduled.map(ex => {
                    const c = myCourses.find(x => x.id === ex.courseId);
                    return { kind: 'rescheduled' as const, data: ex, startTime: ex.newStartTime ?? c?.startTime ?? '00:00', endTime: ex.newEndTime ?? c?.endTime ?? '00:00' };
                  }),
                  ...dayReps.map(r => ({ kind: 'rep' as const, data: r, startTime: r.startTime, endTime: r.endTime })),
                ];
                const positioned = layoutTimeSlots(allEvents);
                const trackStyle = (column: number, columns: number) => {
                  const gap = 0.25;
                  const width = (100 - gap * (columns - 1)) / columns;
                  return { left: `${column * (width + gap)}%`, width: `${width}%` };
                };

                return (
                  <div
                    key={di}
                    className={`relative border-l border-gray-100 ${isToday ? 'bg-indigo-50/20' : ''}`}
                    onClick={() => setSel(null)}
                  >
                    {HOURS.map(h => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-t border-gray-100"
                        style={{ top: `${((h - MIN_HOUR) / 15) * 100}%` }}
                      />
                    ))}

                    {positioned.map(({ item, column, columns }) => {
                      const ps = posStyle(item.startTime, item.endTime);
                      const track = trackStyle(column, columns);
                      if (item.kind === 'course') {
                        const c = item.data;
                        const color = STYLE_COLORS[c.style] ?? '#6366F1';
                        const enroll = courseEnrollments.filter(e => e.courseId === c.id && e.status === 'active').length;
                        const isActive = sel?.kind === 'course' && sel.course.id === c.id;
                        const room = rooms.find(x => x.id === c.room);
                        return (
                          <div
                            key={c.id}
                            className="absolute rounded-md px-1.5 py-1 text-white cursor-pointer z-10 shadow-sm transition-all overflow-hidden"
                            style={{
                              ...ps, ...track,
                              backgroundColor: color,
                              outline: isActive ? '2px solid white' : 'none',
                              filter: isActive ? 'brightness(1.15)' : undefined,
                            }}
                            onClick={e => { e.stopPropagation(); setSel({ kind: 'course', course: c }); }}
                            title={`${c.name} · ${c.startTime}–${c.endTime} · ${room?.name ?? c.room}`}
                          >
                            <div className="text-[11px] font-semibold leading-tight truncate">{c.name}</div>
                            <div className="text-[10px] opacity-80 truncate">{c.startTime}–{c.endTime}</div>
                            {columns > 1 && room && <div className="text-[10px] opacity-75 truncate">{room.name}</div>}
                            {columns === 1 && enroll > 0 && <div className="text-[10px] opacity-75">{enroll} élève{enroll > 1 ? 's' : ''}</div>}
                          </div>
                        );
                      }
                      if (item.kind === 'rescheduled') {
                        const ex = item.data;
                        const c = myCourses.find(x => x.id === ex.courseId);
                        if (!c) return null;
                        const color = STYLE_COLORS[c.style] ?? '#6366F1';
                        return (
                          <div
                            key={ex.id}
                            className="absolute rounded-md px-1.5 py-1 text-white z-10 opacity-75 ring-2 ring-white/60 cursor-pointer overflow-hidden"
                            style={{ ...ps, ...track, backgroundColor: color }}
                            onClick={e => { e.stopPropagation(); setSel({ kind: 'course', course: c }); }}
                          >
                            <div className="text-[11px] font-semibold leading-tight truncate">↩ {c.name}</div>
                            <div className="text-[10px] opacity-80 truncate">{item.startTime}–{item.endTime}</div>
                          </div>
                        );
                      }
                      const r = item.data;
                      const room = rooms.find(x => x.id === r.room);
                      const isActive = sel?.kind === 'rep' && sel.rep.id === r.id;
                      return (
                        <div
                          key={r.id}
                          className="absolute rounded-md px-1.5 py-1 z-10 shadow-sm cursor-pointer border border-amber-400 transition-all overflow-hidden"
                          style={{
                            ...ps, ...track,
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            outline: isActive ? '2px solid #F59E0B' : 'none',
                          }}
                          onClick={e => { e.stopPropagation(); setSel({ kind: 'rep', rep: r }); }}
                          title={`${r.title} · ${r.startTime}–${r.endTime}`}
                        >
                          <div className="text-[11px] font-semibold leading-tight truncate">🎭 {r.title}</div>
                          <div className="text-[10px] opacity-80 truncate">{r.startTime}–{r.endTime}</div>
                          {room && <div className="text-[10px] opacity-70 truncate">{room.venue}</div>}
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

        {/* ── Legend below calendar ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Légende</div>
          <div className="flex flex-wrap gap-3">
            {usedStyles.map(([style, color]) => (
              <span key={style} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-4 h-4 rounded shrink-0 shadow-sm" style={{ backgroundColor: color }} />
                {style}
              </span>
            ))}
            <span className="flex items-center gap-2 text-sm text-gray-700">
              <span className="w-4 h-4 rounded shrink-0 border border-amber-400" style={{ backgroundColor: '#FEF3C7' }} />
              Représentation
            </span>
          </div>
        </div>
      </div>

      {/* ── Detail panel ── */}
      {sel && (
        <div className="sm:w-72 sm:shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 sm:sticky sm:top-0 overflow-hidden">
            {/* Panel header */}
            <div
              className="p-4 flex items-start justify-between gap-2"
              style={{
                backgroundColor: sel.kind === 'course'
                  ? (STYLE_COLORS[sel.course.style] ?? '#6366F1')
                  : '#FEF3C7',
                color: sel.kind === 'course' ? 'white' : '#92400E',
              }}
            >
              <div className="min-w-0">
                <div className="font-bold text-base leading-tight">
                  {sel.kind === 'course' ? sel.course.name : `🎭 ${sel.rep.title}`}
                </div>
                {sel.kind === 'course' && (
                  <div className="text-xs opacity-80 mt-0.5">{sel.course.style} · {sel.course.level}</div>
                )}
              </div>
              <button
                onClick={() => setSel(null)}
                className="shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto max-h-[45vh] sm:max-h-[calc(100vh-200px)]">

              {/* ── Course detail ── */}
              {sel.kind === 'course' && (() => {
                const c = sel.course;
                const room = rooms.find(r => r.id === c.room);
                const enroll = courseEnrollments.filter(e => e.courseId === c.id && e.status === 'active').length;
                return (
                  <>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={14} className="shrink-0 text-gray-400" />
                        <span>{c.dayOfWeek} · {c.startTime}–{c.endTime}</span>
                      </div>
                      {room && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin size={14} className="shrink-0 text-gray-400" />
                          <span>{room.venue} · {room.name}<br /><span className="text-gray-400 text-xs">{room.city}</span></span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Tag size={14} className="shrink-0 text-gray-400" />
                        <span>{c.ageGroup}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Euro size={14} className="shrink-0 text-gray-400" />
                        <span>{c.price} € {c.priceLabel}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users size={14} className="shrink-0 text-gray-400" />
                        <span>{enroll} / {c.capacity} élève{c.capacity > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {c.description && (
                      <div className="text-xs text-gray-500 italic bg-gray-50 rounded-lg p-2 border border-gray-100">
                        {c.description}
                      </div>
                    )}

                    {/* Attire */}
                    {c.attire.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tenue requise</div>
                        <div className="space-y-1">
                          {c.attire.map(a => (
                            <div key={a.id} className="flex items-start gap-2 text-xs text-gray-600">
                              <span className={`mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full ${a.mandatory ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                              <span><strong>{a.name}</strong>{a.color ? ` — ${a.color}` : ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick links */}
                    <div className="flex flex-col gap-2">
                      <Link
                        to="/teacher/cours"
                        className="flex items-center justify-between gap-2 text-sm text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-3 py-2 transition-colors"
                      >
                        <span className="flex items-center gap-2"><BookOpen size={14} /> Modifier ce cours</span>
                        <ArrowRight size={13} />
                      </Link>
                      <Link
                        to="/teacher/eleves"
                        className="flex items-center justify-between gap-2 text-sm text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-3 py-2 transition-colors"
                      >
                        <span className="flex items-center gap-2"><Users size={14} /> Voir tous mes élèves</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>

                    {/* Enrolled students */}
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Élèves inscrits ({selectedStudents.length})
                      </div>
                      {selectedStudents.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Aucun élève inscrit.</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedStudents.map(s => {
                            if (!s) return null;
                            const age = calcAge(s.birthDate);
                            return (
                              <div key={s.id} className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                                    {s.firstName[0]}{s.lastName[0]}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-800">{s.firstName} {s.lastName}</div>
                                    <div className="text-xs text-gray-400">{age} ans</div>
                                  </div>
                                </div>
                                {(s.parentFirstName || s.parentEmail || s.parentPhone) && (
                                  <div className="text-xs text-gray-500 space-y-0.5 pl-9">
                                    {s.parentFirstName && (
                                      <div className="text-gray-400">Tuteur : {s.parentFirstName} {s.parentLastName}</div>
                                    )}
                                    {s.parentEmail && (
                                      <a href={`mailto:${s.parentEmail}`} className="flex items-center gap-1 hover:text-indigo-600 truncate">
                                        <Mail size={10} /> {s.parentEmail}
                                      </a>
                                    )}
                                    {s.parentPhone && (
                                      <a href={`tel:${s.parentPhone}`} className="flex items-center gap-1 hover:text-indigo-600">
                                        <Phone size={10} /> {s.parentPhone}
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* ── Representation detail ── */}
              {sel.kind === 'rep' && (() => {
                const r = sel.rep;
                const room = rooms.find(x => x.id === r.room);
                const linkedCourses = courses.filter(c => r.courseIds.includes(c.id));
                return (
                  <>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={14} className="shrink-0 text-gray-400" />
                        <span>{format(parseISO(r.date), 'EEEE d MMMM yyyy', { locale: fr })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={14} className="shrink-0 text-gray-400 opacity-0" />
                        <span>{r.startTime}–{r.endTime}</span>
                      </div>
                      {room && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin size={14} className="shrink-0 text-gray-400" />
                          <span>{room.venue} · {room.name}<br /><span className="text-xs text-gray-400">{room.city}</span></span>
                        </div>
                      )}
                      <div className="flex items-start gap-2 text-gray-600">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {r.status === 'confirmed' ? 'Confirmée' : 'Brouillon'}
                        </span>
                      </div>
                    </div>

                    {r.description && (
                      <div className="text-xs text-gray-500 italic bg-amber-50 rounded-lg p-2 border border-amber-100">
                        {r.description}
                      </div>
                    )}

                    {linkedCourses.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Groupes concernés</div>
                        <div className="space-y-1">
                          {linkedCourses.map(c => (
                            <div key={c.id} className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 rounded-lg px-2 py-1.5 border border-gray-100">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STYLE_COLORS[c.style] }} />
                              {c.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Link
                      to="/teacher/representations"
                      className="flex items-center justify-between gap-2 text-sm text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg px-3 py-2 transition-colors"
                    >
                      <span>Gérer les représentations</span>
                      <ArrowRight size={13} />
                    </Link>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
