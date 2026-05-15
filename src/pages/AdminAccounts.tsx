import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldAlert, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import type { UserRole } from '../types';

interface Profile {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
}

export default function AdminAccounts() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    const { data, error } = await supabase.from('profiles').select('*').order('email');
    if (error) toast.error('Erreur lors du chargement des comptes');
    else setProfiles(data || []);
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}