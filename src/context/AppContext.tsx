import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
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
  deleteStudent: (id: string) => void;

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
  initializeDb: () => Promise<void>;
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

      initializeDb: async () => {
        const { data: teachers } = await supabase.from('teachers').select('*');
        const { data: courses } = await supabase.from('courses').select('*');
        const { data: students } = await supabase.from('students').select('*');
        const { data: proSessions } = await supabase.from('pro_sessions').select('*');
        const { data: registrations } = await supabase.from('registrations').select('*');
        const { data: courseExceptions } = await supabase.from('course_exceptions').select('*');
        const { data: spectacles } = await supabase.from('spectacles').select('*');
        const { data: courseEnrollments } = await supabase.from('course_enrollments').select('*');
        const { data: rooms } = await supabase.from('rooms').select('*');
        const { data: changeRequests } = await supabase.from('schedule_change_requests').select('*');
        const { data: representations } = await supabase.from('representations').select('*');

        set((state) => ({
          teachers: teachers || state.teachers,
          courses: courses || state.courses,
          students: students || state.students,
          proSessions: proSessions || state.proSessions,
          registrations: registrations || state.registrations,
          courseExceptions: courseExceptions || state.courseExceptions,
          spectacles: spectacles || state.spectacles,
          courseEnrollments: courseEnrollments || state.courseEnrollments,
          rooms: rooms || state.rooms,
          changeRequests: changeRequests || state.changeRequests,
          representations: representations || state.representations,
        }));
      },

      addTeacher: async (t) => { set((state) => ({ teachers: [...state.teachers, t] })); await supabase.from('teachers').insert(t); },
      updateTeacher: async (t) => { set((state) => ({ teachers: state.teachers.map((x) => (x.id === t.id ? t : x)) })); await supabase.from('teachers').update(t).eq('id', t.id); },
      deleteTeacher: async (id) => { set((state) => ({ teachers: state.teachers.filter((x) => x.id !== id) })); await supabase.from('teachers').delete().eq('id', id); },

      addCourse: async (c) => { set((state) => ({ courses: [...state.courses, c] })); await supabase.from('courses').insert(c); },
      updateCourse: async (c) => { set((state) => ({ courses: state.courses.map((x) => (x.id === c.id ? c : x)) })); await supabase.from('courses').update(c).eq('id', c.id); },
      deleteCourse: async (id) => { set((state) => ({ courses: state.courses.filter((x) => x.id !== id) })); await supabase.from('courses').delete().eq('id', id); },

      addProSession: async (s) => { set((state) => ({ proSessions: [...state.proSessions, s] })); await supabase.from('pro_sessions').insert(s); },
      updateProSession: async (s) => { set((state) => ({ proSessions: state.proSessions.map((x) => (x.id === s.id ? s : x)) })); await supabase.from('pro_sessions').update(s).eq('id', s.id); },
      deleteProSession: async (id) => { set((state) => ({ proSessions: state.proSessions.filter((x) => x.id !== id) })); await supabase.from('pro_sessions').delete().eq('id', id); },

      addStudent: async (s) => {
        set((state) => ({ students: [...state.students, s] }));
        await supabase.from('students').insert(s);
        // Auto-link to the matching parent profile if one exists, so no
        // child stays orphaned because someone forgot to wire it up.
        const email = (s.parentEmail || '').trim().toLowerCase();
        if (email) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, studentIds')
            .ilike('email', email)
            .maybeSingle();
          if (profile) {
            const currentIds: string[] = profile.studentIds ?? [];
            if (!currentIds.includes(s.id)) {
              await supabase
                .from('profiles')
                .update({ studentIds: [...currentIds, s.id] })
                .eq('id', profile.id);
            }
          }
        }
      },
      updateStudent: async (s) => { set((state) => ({ students: state.students.map((x) => (x.id === s.id ? s : x)) })); await supabase.from('students').update(s).eq('id', s.id); },
      deleteStudent: async (id) => { set((state) => ({ students: state.students.filter((x) => x.id !== id) })); await supabase.from('students').delete().eq('id', id); },

      addRegistration: async (r) => { set((state) => ({ registrations: [...state.registrations, r] })); await supabase.from('registrations').insert(r); },
      updateRegistration: async (r) => { set((state) => ({ registrations: state.registrations.map((x) => (x.id === r.id ? r : x)) })); await supabase.from('registrations').update(r).eq('id', r.id); },
      deleteRegistration: async (id) => { set((state) => ({ registrations: state.registrations.filter((x) => x.id !== id) })); await supabase.from('registrations').delete().eq('id', id); },

      addCourseException: async (e) => { set((state) => ({ courseExceptions: [...state.courseExceptions, e] })); await supabase.from('course_exceptions').insert(e); },
      updateCourseException: async (e) => { set((state) => ({ courseExceptions: state.courseExceptions.map((x) => (x.id === e.id ? e : x)) })); await supabase.from('course_exceptions').update(e).eq('id', e.id); },
      deleteCourseException: async (id) => { set((state) => ({ courseExceptions: state.courseExceptions.filter((x) => x.id !== id) })); await supabase.from('course_exceptions').delete().eq('id', id); },

      addCourseEnrollment: async (e) => {
        set((state) => ({ courseEnrollments: [...state.courseEnrollments, e] }));
        const { error } = await supabase.from('course_enrollments').insert(e);
        if (error) {
          // Rollback the optimistic insert so the UI matches the DB.
          set((state) => ({ courseEnrollments: state.courseEnrollments.filter((x) => x.id !== e.id) }));
          toast.error(`Inscription non enregistrée : ${error.message}`);
          throw error;
        }
      },
      updateCourseEnrollment: async (e) => {
        const previous = useApp.getState().courseEnrollments.find((x) => x.id === e.id);
        set((state) => ({ courseEnrollments: state.courseEnrollments.map((x) => (x.id === e.id ? e : x)) }));
        const { error } = await supabase.from('course_enrollments').update(e).eq('id', e.id);
        if (error) {
          if (previous) set((state) => ({ courseEnrollments: state.courseEnrollments.map((x) => (x.id === e.id ? previous : x)) }));
          toast.error(`Mise à jour échouée : ${error.message}`);
          throw error;
        }
      },
      deleteCourseEnrollment: async (id) => {
        const previous = useApp.getState().courseEnrollments.find((x) => x.id === id);
        set((state) => ({ courseEnrollments: state.courseEnrollments.filter((x) => x.id !== id) }));
        const { error } = await supabase.from('course_enrollments').delete().eq('id', id);
        if (error) {
          if (previous) set((state) => ({ courseEnrollments: [...state.courseEnrollments, previous] }));
          toast.error(`Suppression échouée : ${error.message}`);
          throw error;
        }
      },

      addChangeRequest: async (r) => { set((state) => ({ changeRequests: [...state.changeRequests, r] })); await supabase.from('schedule_change_requests').insert(r); },
      updateChangeRequest: async (r) => { set((state) => ({ changeRequests: state.changeRequests.map((x) => (x.id === r.id ? r : x)) })); await supabase.from('schedule_change_requests').update(r).eq('id', r.id); },

      addRepresentation: async (r) => { set((state) => ({ representations: [...state.representations, r] })); await supabase.from('representations').insert(r); },
      updateRepresentation: async (r) => { set((state) => ({ representations: state.representations.map((x) => (x.id === r.id ? r : x)) })); await supabase.from('representations').update(r).eq('id', r.id); },
      deleteRepresentation: async (id) => { set((state) => ({ representations: state.representations.filter((x) => x.id !== id) })); await supabase.from('representations').delete().eq('id', id); },

      addSpectacle: async (s) => { set((state) => ({ spectacles: [...state.spectacles, s] })); await supabase.from('spectacles').insert(s); },
      updateSpectacle: async (s) => { set((state) => ({ spectacles: state.spectacles.map((x) => (x.id === s.id ? s : x)) })); await supabase.from('spectacles').update(s).eq('id', s.id); },
      deleteSpectacle: async (id) => { set((state) => ({ spectacles: state.spectacles.filter((x) => x.id !== id) })); await supabase.from('spectacles').delete().eq('id', id); },

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
