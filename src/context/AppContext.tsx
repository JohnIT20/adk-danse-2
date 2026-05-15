import React, { createContext, useContext, useState, useCallback } from 'react';
import type {
  Teacher, Course, ProSession, Student, Registration, CourseException, Spectacle, CourseEnrollment,
  Room, ScheduleChangeRequest, RepresentationSession,
} from '../types';
import {
  teachers as defaultTeachers,
  courses as defaultCourses,
  proSessions as defaultProSessions,
  students as defaultStudents,
  registrations as defaultRegistrations,
  courseExceptions as defaultExceptions,
  spectacles as defaultSpectacles,
  courseEnrollments as defaultEnrollments,
  rooms as defaultRooms,
  scheduleChangeRequests as defaultChangeRequests,
  representationSessions as defaultRepresentations,
} from '../data/mockData';

// --- localStorage helpers ---
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

function usePersisted<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => load(key, initial));

  const set = useCallback((updater: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater;
      save(key, next);
      return next;
    });
  }, [key]);

  return [state, set] as const;
}

// ---

interface AppContextType {
  teachers: Teacher[];
  courses: Course[];
  proSessions: ProSession[];
  students: Student[];
  registrations: Registration[];
  courseExceptions: CourseException[];
  spectacles: Spectacle[];
  courseEnrollments: CourseEnrollment[];
  rooms: Room[];
  changeRequests: ScheduleChangeRequest[];
  representations: RepresentationSession[];

  addTeacher: (t: Teacher) => void;
  updateTeacher: (t: Teacher) => void;
  deleteTeacher: (id: string) => void;

  addCourse: (c: Course) => void;
  updateCourse: (c: Course) => void;
  deleteCourse: (id: string) => void;

  addProSession: (s: ProSession) => void;
  updateProSession: (s: ProSession) => void;
  deleteProSession: (id: string) => void;

  addStudent: (s: Student) => void;
  updateStudent: (s: Student) => void;

  addRegistration: (r: Registration) => void;
  updateRegistration: (r: Registration) => void;
  deleteRegistration: (id: string) => void;

  addCourseException: (e: CourseException) => void;
  updateCourseException: (e: CourseException) => void;
  deleteCourseException: (id: string) => void;

  addSpectacle: (s: Spectacle) => void;
  updateSpectacle: (s: Spectacle) => void;
  deleteSpectacle: (id: string) => void;

  addCourseEnrollment: (e: CourseEnrollment) => void;
  updateCourseEnrollment: (e: CourseEnrollment) => void;
  deleteCourseEnrollment: (id: string) => void;

  addChangeRequest: (r: ScheduleChangeRequest) => void;
  updateChangeRequest: (r: ScheduleChangeRequest) => void;

  addRepresentation: (r: RepresentationSession) => void;
  updateRepresentation: (r: RepresentationSession) => void;
  deleteRepresentation: (id: string) => void;

  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [teachers, setTeachers] = usePersisted('adk_teachers', defaultTeachers);
  const [courses, setCourses] = usePersisted('adk_courses', defaultCourses);
  const [proSessions, setProSessions] = usePersisted('adk_proSessions', defaultProSessions);
  const [students, setStudents] = usePersisted('adk_students', defaultStudents);
  const [registrations, setRegistrations] = usePersisted('adk_registrations', defaultRegistrations);
  const [courseExceptions, setCourseExceptions] = usePersisted('adk_exceptions', defaultExceptions);
  const [spectacles, setSpectacles] = usePersisted('adk_spectacles', defaultSpectacles);
  const [courseEnrollments, setCourseEnrollments] = usePersisted('adk_enrollments', defaultEnrollments);
  const [rooms] = usePersisted('adk_rooms', defaultRooms);
  const [changeRequests, setChangeRequests] = usePersisted('adk_changeRequests', defaultChangeRequests);
  const [representations, setRepresentations] = usePersisted('adk_representations', defaultRepresentations);

  const addTeacher = useCallback((t: Teacher) => setTeachers(p => [...p, t]), [setTeachers]);
  const updateTeacher = useCallback((t: Teacher) => setTeachers(p => p.map(x => x.id === t.id ? t : x)), [setTeachers]);
  const deleteTeacher = useCallback((id: string) => setTeachers(p => p.filter(x => x.id !== id)), [setTeachers]);

  const addCourse = useCallback((c: Course) => setCourses(p => [...p, c]), [setCourses]);
  const updateCourse = useCallback((c: Course) => setCourses(p => p.map(x => x.id === c.id ? c : x)), [setCourses]);
  const deleteCourse = useCallback((id: string) => setCourses(p => p.filter(x => x.id !== id)), [setCourses]);

  const addProSession = useCallback((s: ProSession) => setProSessions(p => [...p, s]), [setProSessions]);
  const updateProSession = useCallback((s: ProSession) => setProSessions(p => p.map(x => x.id === s.id ? s : x)), [setProSessions]);
  const deleteProSession = useCallback((id: string) => setProSessions(p => p.filter(x => x.id !== id)), [setProSessions]);

  const addStudent = useCallback((s: Student) => setStudents(p => [...p, s]), [setStudents]);
  const updateStudent = useCallback((s: Student) => setStudents(p => p.map(x => x.id === s.id ? s : x)), [setStudents]);

  const addRegistration = useCallback((r: Registration) => setRegistrations(p => [...p, r]), [setRegistrations]);
  const updateRegistration = useCallback((r: Registration) => setRegistrations(p => p.map(x => x.id === r.id ? r : x)), [setRegistrations]);
  const deleteRegistration = useCallback((id: string) => setRegistrations(p => p.filter(x => x.id !== id)), [setRegistrations]);

  const addCourseException = useCallback((e: CourseException) => setCourseExceptions(p => [...p, e]), [setCourseExceptions]);
  const updateCourseException = useCallback((e: CourseException) => setCourseExceptions(p => p.map(x => x.id === e.id ? e : x)), [setCourseExceptions]);
  const deleteCourseException = useCallback((id: string) => setCourseExceptions(p => p.filter(x => x.id !== id)), [setCourseExceptions]);

  const addCourseEnrollment = useCallback((e: CourseEnrollment) => setCourseEnrollments(p => [...p, e]), [setCourseEnrollments]);
  const updateCourseEnrollment = useCallback((e: CourseEnrollment) => setCourseEnrollments(p => p.map(x => x.id === e.id ? e : x)), [setCourseEnrollments]);
  const deleteCourseEnrollment = useCallback((id: string) => setCourseEnrollments(p => p.filter(x => x.id !== id)), [setCourseEnrollments]);

  const addChangeRequest = useCallback((r: ScheduleChangeRequest) => setChangeRequests(p => [...p, r]), [setChangeRequests]);
  const updateChangeRequest = useCallback((r: ScheduleChangeRequest) => setChangeRequests(p => p.map(x => x.id === r.id ? r : x)), [setChangeRequests]);

  const addRepresentation = useCallback((r: RepresentationSession) => setRepresentations(p => [...p, r]), [setRepresentations]);
  const updateRepresentation = useCallback((r: RepresentationSession) => setRepresentations(p => p.map(x => x.id === r.id ? r : x)), [setRepresentations]);
  const deleteRepresentation = useCallback((id: string) => setRepresentations(p => p.filter(x => x.id !== id)), [setRepresentations]);

  const addSpectacle = useCallback((s: Spectacle) => setSpectacles(p => [...p, s]), [setSpectacles]);
  const updateSpectacle = useCallback((s: Spectacle) => setSpectacles(p => p.map(x => x.id === s.id ? s : x)), [setSpectacles]);
  const deleteSpectacle = useCallback((id: string) => setSpectacles(p => p.filter(x => x.id !== id)), [setSpectacles]);

  const resetToDefaults = useCallback(() => {
    setTeachers(defaultTeachers);
    setCourses(defaultCourses);
    setProSessions(defaultProSessions);
    setStudents(defaultStudents);
    setRegistrations(defaultRegistrations);
    setCourseExceptions(defaultExceptions);
    setSpectacles(defaultSpectacles);
    setCourseEnrollments(defaultEnrollments);
    setChangeRequests(defaultChangeRequests);
    setRepresentations(defaultRepresentations);
  }, []);

  return (
    <AppContext.Provider value={{
      teachers, courses, proSessions, students, registrations, courseExceptions, spectacles,
      courseEnrollments, rooms, changeRequests, representations,
      addTeacher, updateTeacher, deleteTeacher,
      addCourse, updateCourse, deleteCourse,
      addProSession, updateProSession, deleteProSession,
      addStudent, updateStudent,
      addRegistration, updateRegistration, deleteRegistration,
      addCourseException, updateCourseException, deleteCourseException,
      addSpectacle, updateSpectacle, deleteSpectacle,
      addCourseEnrollment, updateCourseEnrollment, deleteCourseEnrollment,
      addChangeRequest, updateChangeRequest,
      addRepresentation, updateRepresentation, deleteRepresentation,
      resetToDefaults,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
