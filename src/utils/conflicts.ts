import type { Course, RepresentationSession } from '../types';

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function overlaps(s1: string, e1: string, s2: string, e2: string) {
  return timeToMin(s1) < timeToMin(e2) && timeToMin(s2) < timeToMin(e1);
}

export interface Conflict {
  type: 'course' | 'representation';
  id: string;
  name: string;
  teacherId: string;
  room: string;
}

/**
 * Check if proposed schedule conflicts with any existing course or representation.
 * @param excludeCourseId - the course being edited (exclude from check)
 */
export function findScheduleConflict(
  room: string,
  day: string,
  startTime: string,
  endTime: string,
  courses: Course[],
  _representations: RepresentationSession[],
  excludeCourseId?: string,
  _excludeRepId?: string,
): Conflict | null {
  // Check regular courses (recurring, same day of week)
  for (const c of courses) {
    if (c.id === excludeCourseId) continue;
    if (c.room !== room) continue;
    if (c.dayOfWeek !== day) continue;
    if (overlaps(startTime, endTime, c.startTime, c.endTime)) {
      return { type: 'course', id: c.id, name: c.name, teacherId: c.teacherId, room: c.room };
    }
  }

  // Representations are date-specific, skip for weekly course checks
  // (they are checked separately when adding a representation)
  return null;
}

/**
 * Check conflicts for a one-time date event (representation or pro session)
 */
export function findDateConflict(
  room: string,
  date: string,
  startTime: string,
  endTime: string,
  courses: Course[],
  representations: RepresentationSession[],
  excludeRepId?: string,
): Conflict | null {
  // Check representations on same date
  for (const r of representations) {
    if (r.id === excludeRepId) continue;
    if (r.room !== room) continue;
    if (r.date !== date) continue;
    if (overlaps(startTime, endTime, r.startTime, r.endTime)) {
      return { type: 'representation', id: r.id, name: r.title, teacherId: r.teacherId, room: r.room };
    }
  }

  // Check regular courses on that day of week
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const dayOfWeek = dayNames[new Date(date).getDay()];
  for (const c of courses) {
    if (c.room !== room) continue;
    if (c.dayOfWeek !== dayOfWeek) continue;
    if (overlaps(startTime, endTime, c.startTime, c.endTime)) {
      return { type: 'course', id: c.id, name: c.name, teacherId: c.teacherId, room: c.room };
    }
  }

  return null;
}
