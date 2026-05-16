import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS: string[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 to 21:00

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export default function Planning() {
  const { courses, proSessions, teachers, courseExceptions } = useApp();
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekDays = DAYS.map((_, i) => addDays(weekStart, i));

  function prevWeek() { setWeekStart(d => addDays(d, -7)); }
  function nextWeek() { setWeekStart(d => addDays(d, 7)); }
  function goToday() { setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 })); }

  const minHour = 8;
  const totalMinutes = 14 * 60; // 8:00-22:00

  function getPositionStyle(startTime: string, endTime: string) {
    const startMin = timeToMinutes(startTime) - minHour * 60;
    const endMin = timeToMinutes(endTime) - minHour * 60;
    const top = (startMin / totalMinutes) * 100;
    const height = ((endMin - startMin) / totalMinutes) * 100;
    return { top: `${top}%`, height: `${height}%` };
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-wrap items-center gap-2">
        <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-gray-800 text-sm flex-1 text-center">
          {format(weekStart, 'd MMM', { locale: fr })} – {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: fr })}
        </span>
        <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
          <ChevronRight size={18} />
        </button>
        <button onClick={goToday} className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          Aujourd'hui
        </button>

      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Légende</div>
        <div className="flex flex-wrap gap-3">
          {teachers
            .filter(t => courses.some(c => c.active && c.teacherId === t.id))
            .map(t => (
              <span key={t.id} className="flex items-center gap-1.5 text-xs text-gray-700">
                <span className="w-3.5 h-3.5 rounded shrink-0" style={{ backgroundColor: t.color }} />
                {t.firstName} {t.lastName}
              </span>
            ))}
          <span className="flex items-center gap-1.5 text-xs text-gray-700">
            <span className="w-3.5 h-3.5 rounded shrink-0 border border-amber-400 bg-amber-100" />
            Session pro
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-700">
            <span className="w-3.5 h-3.5 rounded shrink-0 opacity-70 border-2 border-white ring-1 ring-gray-300 bg-gray-400" />
            Cours déplacé
          </span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto rounded-xl">
          <div style={{ minWidth: '480px' }}>
        {/* Header */}
        <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
          <div className="p-2" />
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div key={i} className={`p-2 text-center border-l border-gray-100 ${isToday ? 'bg-purple-50' : ''}`}>
                <div className="text-xs text-gray-500">{DAYS[i].slice(0, 3)}</div>
                <div className={`text-sm font-semibold mt-0.5 ${isToday ? 'text-purple-700' : 'text-gray-700'}`}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="relative overflow-y-auto" style={{ height: 'clamp(280px, 60vh, 560px)' }}>
          <div className="grid h-full" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
            {/* Time labels */}
            <div className="relative">
              {HOURS.map(h => (
                <div
                  key={h}
                  className="absolute left-0 right-0 text-xs text-gray-400 text-right pr-2 -translate-y-2"
                  style={{ top: `${((h - minHour) / 14) * 100}%` }}
                >
                  {h}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, di) => {
              const dayName = DAYS[di];
              const dateStr = format(day, 'yyyy-MM-dd');
              const isToday = isSameDay(day, new Date());

              // Regular courses for this day
              const dayCourses = courses.filter(c => c.active && c.dayOfWeek === dayName);

              // Check exceptions
              const effectiveCourses = dayCourses.filter(c => {
                const ex = courseExceptions.find(e => e.courseId === c.id && e.originalDate === dateStr);
                return !ex?.isCancelled;
              });

              // Check if any course is rescheduled to this day
              const rescheduled = courseExceptions.filter(e => e.newDate === dateStr && !e.isCancelled);

              // Pro sessions on this day
              const dayProSessions = proSessions.filter(s =>
                s.date === dateStr && s.status !== 'cancelled'
              );

              return (
                <div
                  key={di}
                  className={`relative border-l border-gray-100 ${isToday ? 'bg-purple-50/30' : ''}`}
                >
                  {/* Hour lines */}
                  {HOURS.map(h => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-gray-100"
                      style={{ top: `${((h - minHour) / 14) * 100}%` }}
                    />
                  ))}

                  {/* Regular courses */}
                  {effectiveCourses.map(c => {
                    const teacher = teachers.find(t => t.id === c.teacherId);
                    const style = getPositionStyle(c.startTime, c.endTime);
                    return (
                      <div
                        key={c.id}
                        className="absolute left-1 right-1 rounded-md p-1.5 text-white overflow-hidden cursor-pointer hover:opacity-90 transition-opacity z-10"
                        style={{ ...style, backgroundColor: teacher?.color ?? '#7C3AED' }}
                        title={`${c.name} · ${c.startTime}-${c.endTime} · ${teacher?.firstName}`}
                      >
                        <div className="text-xs font-semibold leading-tight truncate">{c.name}</div>
                        <div className="text-xs opacity-80 leading-tight">{c.startTime}–{c.endTime}</div>
                      </div>
                    );
                  })}

                  {/* Rescheduled courses */}
                  {rescheduled.map(ex => {
                    const c = courses.find(x => x.id === ex.courseId);
                    if (!c) return null;
                    const teacher = teachers.find(t => t.id === c.teacherId);
                    const st = ex.newStartTime ?? c.startTime;
                    const et = ex.newEndTime ?? c.endTime;
                    const style = getPositionStyle(st, et);
                    return (
                      <div
                        key={ex.id}
                        className="absolute left-1 right-1 rounded-md p-1.5 text-white overflow-hidden cursor-pointer hover:opacity-90 z-10 opacity-80 border-2 border-white/50"
                        style={{ ...style, backgroundColor: teacher?.color ?? '#7C3AED' }}
                        title={`[Déplacé] ${c.name}`}
                      >
                        <div className="text-xs font-semibold leading-tight truncate">↩ {c.name}</div>
                        <div className="text-xs opacity-80">{st}–{et}</div>
                      </div>
                    );
                  })}

                  {/* Pro sessions */}
                  {dayProSessions.map(s => {
                    const style = getPositionStyle(s.startTime, s.endTime);
                    return (
                      <div
                        key={s.id}
                        className="absolute left-1 right-1 rounded-md p-1.5 overflow-hidden cursor-pointer hover:opacity-90 z-10 border border-amber-400"
                        style={{ ...style, backgroundColor: '#FEF3C7', color: '#92400E' }}
                        title={`${s.title} · ${s.startTime}-${s.endTime}`}
                      >
                        <div className="text-xs font-semibold leading-tight truncate">⭐ {s.title}</div>
                        <div className="text-xs opacity-80">{s.startTime}–{s.endTime}</div>
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
    </div>
  );
}
