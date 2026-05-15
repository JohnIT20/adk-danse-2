import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types';

interface Profile {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  studentIds: string[];
  teacherId: string | null;
}

export default function AdminAccounts() {
  const { students, teachers } = useApp();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    const { data, error } = await supabase.from('profiles').select('*').order('email');
    if (error) toast.error('Erreur lors du chargement des comptes');
    else setProfiles(data?.map(p => ({ ...p, studentIds: p.studentIds || [] })) || []);
    setLoading(false);
  }

  async function updateRole(id: string, newRole: UserRole) {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    if (error) {
      toast.error('Erreur lors de la mise à jour du rôle');
    } else {
      toast.success('Rôle mis à jour avec succès');
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, role: newRole } : p));
    }
  }

  async function updateTeacherId(id: string, teacherId: string) {
    const { error } = await supabase.from('profiles').update({ teacherId: teacherId || null }).eq('id', id);
    if (error) {
      toast.error('Erreur lors de la liaison du professeur');
    } else {
      toast.success('Professeur lié avec succès');
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, teacherId } : p));
    }
  }

  async function toggleStudent(profile: Profile, studentId: string) {
    const current = profile.studentIds || [];
    const next = current.includes(studentId) ? current.filter(x => x !== studentId) : [...current, studentId];
    const { error } = await supabase.from('profiles').update({ studentIds: next }).eq('id', profile.id);
    if (error) {
      toast.error('Erreur lors de la liaison de l\'élève');
    } else {
      toast.success('Élèves liés mis à jour');
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, studentIds: next } : p));
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement des comptes...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <ShieldAlert className="text-purple-600" size={20} /> Gestion des accès
          </h2>
          <p className="text-sm text-gray-500 mt-1">Tous les nouveaux inscrits ont le rôle "Parent" par défaut par sécurité.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3">Email (Compte)</th>
                <th className="px-5 py-3">Nom (Affichage)</th>
                <th className="px-5 py-3">Rôle & Droits</th>
                <th className="px-5 py-3">Liaisons (Élèves / Prof)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {profiles.map(profile => (
                <tr key={profile.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{profile.email}</td>
                  <td className="px-5 py-3 text-gray-600">{profile.displayName || '-'}</td>
                  <td className="px-5 py-3">
                    <select
                      className={`border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-purple-400 outline-none ${profile.role === 'admin' ? 'bg-red-50 border-red-200 text-red-700' : profile.role === 'teacher' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-200'}`}
                      value={profile.role}
                      onChange={(e) => updateRole(profile.id, e.target.value as UserRole)}
                    >
                      <option value="parent">Parent (Portail Famille)</option>
                      <option value="teacher">Professeur (Espace Prof)</option>
                      <option value="admin">Administrateur (Gestion Totale)</option>
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    {profile.role === 'parent' && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {profile.studentIds.map(sid => {
                            const s = students.find(x => x.id === sid);
                            return s ? (
                              <span key={sid} className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                {s.firstName} {s.lastName}
                                <button onClick={() => toggleStudent(profile, sid)} className="hover:text-red-500"><X size={10} /></button>
                              </span>
                            ) : null;
                          })}
                        </div>
                        <select
                          className="text-xs border border-gray-200 rounded p-1.5 w-full outline-none focus:border-purple-400 bg-white"
                          value=""
                          onChange={(e) => {
                            if (e.target.value) toggleStudent(profile, e.target.value);
                          }}
                        >
                          <option value="">+ Lier un élève...</option>
                          {students.filter(s => !profile.studentIds.includes(s.id)).map(s => (
                            <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {profile.role === 'teacher' && (
                      <select
                        className="text-xs border border-gray-200 rounded p-1.5 w-full outline-none focus:border-purple-400 bg-white"
                        value={profile.teacherId || ''}
                        onChange={(e) => updateTeacherId(profile.id, e.target.value)}
                      >
                        <option value="">— Sélectionner le prof associé —</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                        ))}
                      </select>
                    )}
                    {profile.role === 'admin' && (
                      <span className="text-xs text-gray-400 italic">Accès total</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}