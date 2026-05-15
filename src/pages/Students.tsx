import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Mail, Phone, Calendar } from 'lucide-react';
import { format, parseISO, differenceInYears } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Students() {
  const { students, registrations, proSessions } = useApp();
  const [search, setSearch] = useState('');

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.parentEmail.toLowerCase().includes(q)
    );
  });

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
