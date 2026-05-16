import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { Music2, Eye, EyeOff, UserPlus } from 'lucide-react';

const signupSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema)
  });

  async function onSubmit(data: SignupForm) {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Compte créé avec succès ! Vous pouvez vous connecter.');
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
            <Music2 size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Anne DK Danse</h1>
          <p className="text-purple-200 mt-1">Créer un nouveau compte</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Inscription</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
              <input
                autoFocus
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                placeholder="votre@email.com"
                {...register('email')}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition pr-11 ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPwd(v => !v)}>
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input
                type={showPwd ? 'text' : 'password'}
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition ${errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                placeholder="••••••••"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <UserPlus size={17} />}
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Déjà un compte ? <Link to="/login" className="text-purple-600 hover:underline font-medium">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}