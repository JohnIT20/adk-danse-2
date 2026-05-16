import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Users, Search, BookOpen, Phone, Mail, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function TeacherStudents() {
  const { currentUser } = useAuth();
  const { courses, courseEnrollments, students } = useApp();

  const tid = currentUser?.teacherId ?? '';
  const myCourses = courses.filter(c => c.teacherId === tid && c.active);

  // Build: for each student, which of MY courses are they in?
  const studentCourseMap = new Map<string, string[]>();
  for (const e of courseEnrollments) {
    if (e.status !== 'active') continue;
    const course = myCourses.find(c => c.id === e.courseId);
    if (!course) continue;
    const list = studentCourseMap.get(e.studentId) ?? [];
    list.push(e.courseId);
    studentCourseMap.set(e.studentId, list);
  }

  const myStudents = students.filter(s => studentCourseMap.has(s.id));

  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  const filtered = myStudents.filter(s => {
    const matchSearch = !search ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      s.parentEmail?.toLowerCase().includes(search.toLowerCase());
    const matchCourse = !filterCourse ||
      (studentCourseMap.get(s.id) ?? []).includes(filterCourse);
    return matchSearch && matchCourse;
  });

  function calcAge(birthDate: string) {
    const born = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - born.getFullYear();
    const m = now.getMonth() - born.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age--;
    return age;
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-gray-800">{myStudents.length}</div>
          <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
            <Users size={13} /> Élèves inscrits
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-gray-800">{myCourses.length}</div>
          <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
            <BookOpen size={13} /> Cours actifs
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un élève, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <select
          value={filterCourse}
          onChange={e => setFilterCourse(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">Tous mes cours</option>
          {myCourses.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Students list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm border border-gray-100">
          <Users size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Aucun élève trouvé.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const myCourseIds = studentCourseMap.get(s.id) ?? [];
            const enrolledCourses = myCourses.filter(c => myCourseIds.includes(c.id));
            return (
              <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm shrink-0">
                    {s.firstName[0]}{s.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800">
                      {s.firstName} {s.lastName}
                      <span className="ml-2 text-xs text-gray-400 font-normal">
                        {calcAge(s.birthDate)} ans
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Calendar size={11} />
                      Né(e) le {format(parseISO(s.birthDate), 'd MMMM yyyy', { locale: fr })}
                    </div>

                    {/* Enrolled courses */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {enrolledCourses.map(c => (
                        <span key={c.id} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                          <BookOpen size={10} /> {c.name} · {c.dayOfWeek} {c.startTime}
                        </span>
                      ))}
                    </div>

                    {/* Parent info */}
                    {(s.parentFirstName || s.parentEmail || s.parentPhone) && (
                      <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                        {s.parentFirstName && (
                          <div>Tuteur : {s.parentFirstName} {s.parentLastName}</div>
                        )}
                        <div className="flex flex-wrap gap-3">
                          {s.parentEmail && (
                            <a href={`mailto:${s.parentEmail}`} className="flex items-center gap-1 hover:text-indigo-600">
                              <Mail size={11} /> {s.parentEmail}
                            </a>
                          )}
                          {s.parentPhone && (
                            <a href={`tel:${s.parentPhone}`} className="flex items-center gap-1 hover:text-indigo-600">
                              <Phone size={11} /> {s.parentPhone}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
