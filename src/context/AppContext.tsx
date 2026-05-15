import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

export const useApp = create<AppContextType>()(
  persist(
    (set) => ({
      teachers: defaultTeachers,
      courses: defaultCourses,
      proSessions: defaultProSessions,
      students: defaultStudents,
      registrations: defaultRegistrations,
      courseExceptions: defaultExceptions,
      spectacles: defaultSpectacles,
      courseEnrollments: defaultEnrollments,
      rooms: defaultRooms,
      changeRequests: defaultChangeRequests,
      representations: defaultRepresentations,

      addTeacher: (t) => set((state) => ({ teachers: [...state.teachers, t] })),
      updateTeacher: (t) => set((state) => ({ teachers: state.teachers.map((x) => (x.id === t.id ? t : x)) })),
      deleteTeacher: (id) => set((state) => ({ teachers: state.teachers.filter((x) => x.id !== id) })),

      addCourse: (c) => set((state) => ({ courses: [...state.courses, c] })),
      updateCourse: (c) => set((state) => ({ courses: state.courses.map((x) => (x.id === c.id ? c : x)) })),
      deleteCourse: (id) => set((state) => ({ courses: state.courses.filter((x) => x.id !== id) })),

      addProSession: (s) => set((state) => ({ proSessions: [...state.proSessions, s] })),
      updateProSession: (s) => set((state) => ({ proSessions: state.proSessions.map((x) => (x.id === s.id ? s : x)) })),
      deleteProSession: (id) => set((state) => ({ proSessions: state.proSessions.filter((x) => x.id !== id) })),

      addStudent: (s) => set((state) => ({ students: [...state.students, s] })),
      updateStudent: (s) => set((state) => ({ students: state.students.map((x) => (x.id === s.id ? s : x)) })),

      addRegistration: (r) => set((state) => ({ registrations: [...state.registrations, r] })),
      updateRegistration: (r) => set((state) => ({ registrations: state.registrations.map((x) => (x.id === r.id ? r : x)) })),
      deleteRegistration: (id) => set((state) => ({ registrations: state.registrations.filter((x) => x.id !== id) })),

      addCourseException: (e) => set((state) => ({ courseExceptions: [...state.courseExceptions, e] })),
      updateCourseException: (e) => set((state) => ({ courseExceptions: state.courseExceptions.map((x) => (x.id === e.id ? e : x)) })),
      deleteCourseException: (id) => set((state) => ({ courseExceptions: state.courseExceptions.filter((x) => x.id !== id) })),

      addCourseEnrollment: (e) => set((state) => ({ courseEnrollments: [...state.courseEnrollments, e] })),
      updateCourseEnrollment: (e) => set((state) => ({ courseEnrollments: state.courseEnrollments.map((x) => (x.id === e.id ? e : x)) })),
      deleteCourseEnrollment: (id) => set((state) => ({ courseEnrollments: state.courseEnrollments.filter((x) => x.id !== id) })),

      addChangeRequest: (r) => set((state) => ({ changeRequests: [...state.changeRequests, r] })),
      updateChangeRequest: (r) => set((state) => ({ changeRequests: state.changeRequests.map((x) => (x.id === r.id ? r : x)) })),

      addRepresentation: (r) => set((state) => ({ representations: [...state.representations, r] })),
      updateRepresentation: (r) => set((state) => ({ representations: state.representations.map((x) => (x.id === r.id ? r : x)) })),
      deleteRepresentation: (id) => set((state) => ({ representations: state.representations.filter((x) => x.id !== id) })),

      addSpectacle: (s) => set((state) => ({ spectacles: [...state.spectacles, s] })),
      updateSpectacle: (s) => set((state) => ({ spectacles: state.spectacles.map((x) => (x.id === s.id ? s : x)) })),
      deleteSpectacle: (id) => set((state) => ({ spectacles: state.spectacles.filter((x) => x.id !== id) })),

      resetToDefaults: () => set({
        teachers: defaultTeachers,
        courses: defaultCourses,
        proSessions: defaultProSessions,
        students: defaultStudents,
        registrations: defaultRegistrations,
        courseExceptions: defaultExceptions,
        spectacles: defaultSpectacles,
        courseEnrollments: defaultEnrollments,
        changeRequests: defaultChangeRequests,
        representations: defaultRepresentations,
      }),
    }),
    {
      name: 'adk-danse-storage',
    }
  )
);
