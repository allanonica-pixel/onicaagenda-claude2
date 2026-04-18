import { useState } from 'react';
import { usePortalAuth } from '../../contexts/PortalAuthContext';

export default function LoginPage() {
  const { signIn, authError } = usePortalAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50 px-4">
      <div className="w-full max-w-sm overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
        <div className="bg-teal-700 px-8 py-8 text-white">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <i className="ri-stethoscope-line text-3xl"></i>
          </div>
          <h1 className="text-2xl font-bold">Portal do Profissional</h1>
          <p className="mt-1.5 text-sm text-teal-100">
            Acesse sua agenda em todas as clínicas
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-8">
          {(error || authError) && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <i className="ri-error-warning-line mr-1.5"></i>
              {error || authError}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-teal-400 focus:bg-white"
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Senha</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm outline-none transition-colors focus:border-teal-400 focus:bg-white"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <i className={showPw ? 'ri-eye-off-line text-lg' : 'ri-eye-line text-lg'}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-2xl bg-teal-700 py-3 font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
          >
            {loading ? (
              <><i className="ri-loader-4-line animate-spin mr-2"></i>Entrando...</>
            ) : 'Entrar'}
          </button>
        </form>

        <p className="pb-6 text-center text-xs text-slate-400">
          profissional.onica.com.br · Acesso exclusivo para profissionais de saúde
        </p>
      </div>
    </div>
  );
}
