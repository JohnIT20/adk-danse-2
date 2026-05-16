import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Mail, Phone, Calendar, AlertTriangle } from 'lucide-react';
import { format, parseISO, differenceInYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import type { Student } from '../types';

function dedupeKey(s: Student) {
  return [
    s.firstName.trim().toLowerCase(),
    s.lastName.trim().toLowerCase(),
    (s.parentEmail || '').trim().toLowerCase(),
  ].join('|');
}

export default function Students() {
  const {
    students, registrations, proSessions,
    courseEnrollments, updateRegistration, updateCourseEnrollment, deleteStudent,
  } = useApp();
  const [search, setSearch] = useState('');
  const [merging, setMerging] = useState(false);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.parentEmail.toLowerCase().includes(q)
    );
  });

  // Detect duplicate groups: same firstName + lastName + parentEmail (normalized).
  const duplicateGroups = (() => {
    const map = new Map<string, Student[]>();
    for (const s of students) {
      const key = dedupeKey(s);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return [...map.values()].filter(g => g.length > 1);
  })();
  const duplicateCount = duplicateGroups.reduce((sum, g) => sum + (g.length - 1), 0);

  async function mergeDuplicates() {
    if (merging || duplicateGroups.length === 0) return;
    const ok = window.confirm(
      `${duplicateCount} fiche(s) en double détectée(s) dans ${duplicateGroups.length} groupe(s).\n\n` +
      `Les inscriptions et abonnements seront transférés vers la fiche la plus complète, puis les doublons seront supprimés.\n\nContinuer ?`
    );
    if (!ok) return;
    setMerging(true);
    try {
      for (const group of duplicateGroups) {
        // Pick the canonical record: prefer one with a birthDate, then most filled fields.
        const score = (s: Student) =>
          (s.birthDate ? 4 : 0) +
          (s.parentFirstName ? 1 : 0) +
          (s.parentLastName ? 1 : 0) +
          (s.parentPhone ? 1 : 0);
        const canonical = [...group].sort((a, b) => score(b) - score(a))[0];
        const dups = group.filter(s => s.id !== canonical.id);
        const dupIds = dups.map(d => d.id);

        // Reassign registrations & course enrollments to canonical.
        for (const r of registrations.filter(r => dupIds.includes(r.studentId))) {
          await updateRegistration({ ...r, studentId: canonical.id });
        }
        for (const e of courseEnrollments.filter(e => dupIds.includes(e.studentId))) {
          await updateCourseEnrollment({ ...e, studentId: canonical.id });
        }

        // Patch any parent profile that referenced a duplicate id.
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, studentIds')
          .overlaps('studentIds', dupIds);
        for (const p of profiles ?? []) {
          const updated = Array.from(new Set(
            (p.studentIds as string[]).map(id => (dupIds.includes(id) ? canonical.id : id))
          ));
          await supabase.from('profiles').update({ studentIds: updated }).eq('id', p.id);
        }

        // Finally delete the duplicate student records.
        for (const dup of dups) {
          await deleteStudent(dup.id);
        }
      }
    } finally {
      setMerging(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Rechercher par nom, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {duplicateCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-orange-800">
              {duplicateCount} fiche{duplicateCount > 1 ? 's' : ''} en double détectée{duplicateCount > 1 ? 's' : ''}
            </div>
            <div className="text-xs text-orange-700 mt-0.5">
              {duplicateGroups.length} groupe{duplicateGroups.length > 1 ? 's' : ''} d'élèves avec le même nom et parent.
              La fusion transfère les inscriptions vers la fiche canonique puis supprime les doublons.
            </div>
          </div>
          <button
            onClick={mergeDuplicates}
            disabled={merging}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {merging ? 'Fusion...' : 'Fusionner les doublons'}
          </button>
        </div>
      )}

      <div className="text-sm text-gray-500">{filtered.length} élève(s)</div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(s => {
          const age = s.birthDate ? differenceInYears(new Date(), parseISO(s.birthDate)) : null;
          const studentRegs = registrations.filter(r => r.studentId === s.id);
          const validatedCount = studentRegs.filter(r => r.status === 'validated').length;

          return (
            <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-sm">
                  {s.firstName[0]}{s.lastName[0]}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{s.firstName} {s.lastName}</div>
                  {age !== null && (
                    <div className="text-xs text-gray-500">{age} ans</div>
                  )}
                </div>
              </div>

              {s.birthDate && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Calendar size={12} />
                  Né(e) le {format(parseISO(s.birthDate), 'd MMMM yyyy', { locale: fr })}
                </div>
              )}

              <div className="border-t border-gray-100 pt-3 space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Contact parent</p>
                {(s.parentFirstName || s.parentLastName) && (
                  <div className="text-sm text-gray-700">{s.parentFirstName} {s.parentLastName}</div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Mail size={11} />{s.parentEmail}
                </div>
                {s.parentPhone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone size={11} />{s.parentPhone}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3 mt-3">
                <div className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{validatedCount}</span> inscription(s) validée(s)
                  {studentRegs.length > validatedCount && (
                    <span className="ml-1 text-orange-500">({studentRegs.length - validatedCount} en attente)</span>
                  )}
                </div>
                {studentRegs.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {studentRegs.slice(0, 2).map(r => {
                      const session = proSessions.find(p => p.id === r.sessionId);
                      return session ? (
                        <div key={r.id} className="text-xs text-gray-400 truncate">· {session.title}</div>
                      ) : null;
                    })}
                    {studentRegs.length > 2 && <div className="text-xs text-gray-400">+{studentRegs.length - 2} autres</div>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
