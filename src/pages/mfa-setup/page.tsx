import { useEffect, useState } from 'react';
import { usePortalAuth } from '../../contexts/PortalAuthContext';

type Step = 'loading' | 'enroll' | 'verify' | 'error';

export default function MfaSetupPage() {
  const { enrollMfa, verifyMfa, professionalName } = usePortalAuth();
  const [step, setStep] = useState<Step>('loading');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    void loadEnrollment();
  }, []);

  const loadEnrollment = async () => {
    setStep('loading');
    try {
      const payload = await enrollMfa();
      setOtpauthUrl(payload.otpauthUrl);
      setSecret(payload.secret);

      // Gera QR code via API pública (sem enviar dados sensíveis — apenas a URL TOTP)
      const encoded = encodeURIComponent(payload.otpauthUrl);
      setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`);
      setStep('enroll');
    } catch {
      setStep('error');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyMfa(code);
      // Redirecionamento automático via PortalAuthContext → AppRoutes
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <i className="ri-loader-4-line animate-spin text-4xl text-teal-600"></i>
          <span className="text-sm">Preparando autenticação...</span>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-[2rem] border border-red-200 bg-white p-8 text-center shadow-sm">
          <i className="ri-error-warning-line mb-3 text-5xl text-red-400"></i>
          <p className="font-medium text-slate-800">Não foi possível iniciar o MFA.</p>
          <button
            onClick={() => void loadEnrollment()}
            className="mt-4 rounded-2xl bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
        <div className="bg-teal-700 px-8 py-6 text-white">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <i className="ri-shield-keyhole-line text-2xl"></i>
          </div>
          <h1 className="text-xl font-bold">Autenticação em 2 Fatores</h1>
          <p className="mt-1 text-sm text-teal-100">
            {professionalName ? `Olá, ${professionalName}. ` : ''}
            Configure o Authenticator para acessar o portal.
          </p>
        </div>

        <div className="p-8">
          {/* Step indicator */}
          <div className="mb-6 flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step === 'enroll' ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-700'}`}>
              1
            </div>
            <div className="h-px flex-1 bg-slate-200"></div>
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step === 'verify' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-400'}`}>
              2
            </div>
          </div>

          {step === 'enroll' && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-slate-700">1. Abra o Google Authenticator e escaneie o QR code:</p>
                <div className="mt-3 flex justify-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR Code MFA"
                      className="h-48 w-48 rounded-2xl border border-slate-200 p-1"
                    />
                  ) : (
                    <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-slate-100">
                      <i className="ri-loader-4-line animate-spin text-3xl text-slate-400"></i>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Não consegue escanear? Use o código manual:</p>
                <p className="mt-1 break-all font-mono text-sm font-bold tracking-widest text-slate-800">
                  {secret}
                </p>
              </div>

              <button
                onClick={() => setStep('verify')}
                className="w-full rounded-2xl bg-teal-700 py-3 font-semibold text-white transition-colors hover:bg-teal-800"
              >
                Já escaneei — Verificar código
              </button>
            </div>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  2. Digite o código de 6 dígitos que aparece no Authenticator:
                </p>
              </div>

              {error && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  <i className="ri-error-warning-line mr-1.5"></i>{error}
                </div>
              )}

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-3xl font-bold tracking-[0.5em] outline-none transition-colors focus:border-teal-400 focus:bg-white"
                placeholder="000000"
                autoFocus
                required
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('enroll')}
                  className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="flex-1 rounded-2xl bg-teal-700 py-3 font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
                >
                  {loading ? <i className="ri-loader-4-line animate-spin"></i> : 'Verificar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
