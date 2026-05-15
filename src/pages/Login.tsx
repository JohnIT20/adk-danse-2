import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Music2, Eye, EyeOff, LogIn } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  async function onSubmit(data: LoginForm) {
    setLoading(true);
    const result = await login(data.email, data.password);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error ?? 'Erreur de connexion.');
      return;
    }
    toast.success('Connexion réussie !');
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
            <Music2 size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Anne DK Danse</h1>
          <p className="text-purple-200 mt-1">Espace membres & gestion</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Connexion</h2>
          <p className="text-sm text-gray-500 mb-6">Connectez-vous avec votre adresse email.</p>

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
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPwd(v => !v)}
                >
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <LogIn size={17} />
              )}
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Pas encore de compte ? <Link to="/signup" className="text-purple-600 hover:underline font-medium">S'inscrire</Link>
          </p>

          {/* Demo hint */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">Comptes de démonstration</p>
            <div className="space-y-1.5 text-xs text-gray-500">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <div className="font-medium text-gray-700">Admin</div>
                <div className="text-gray-400">admin@annedkdanse.be · admin2026</div>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <div className="font-medium text-gray-700">Professeur</div>
                <div className="text-gray-400">anne@annedkdanse.be · anne2026</div>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <div className="font-medium text-gray-700">Parent</div>
                <div className="text-gray-400">marie.dupont@email.com · dupont2026</div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-purple-300 text-xs mt-6">
          © 2026 Anne DK Danse · annedkdanse@hotmail.com
        </p>
      </div>
    </div>
  );
}
