import { NavLink, useNavigate } from 'react-router-dom';
import { usePortalAuth } from '../contexts/PortalAuthContext';

const NAV_ITEMS = [
  { to: '/', icon: 'ri-calendar-line', iconActive: 'ri-calendar-fill', label: 'Agenda' },
  { to: '/faturamento', icon: 'ri-money-dollar-circle-line', iconActive: 'ri-money-dollar-circle-fill', label: 'Faturamento' },
  { to: '/relatorios', icon: 'ri-bar-chart-line', iconActive: 'ri-bar-chart-fill', label: 'Relatórios' },
];

export default function Header() {
  const { professionalName, signOut } = usePortalAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <>
      {/* ── Desktop top bar (md+) ─────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 hidden border-b border-slate-200 bg-white/95 backdrop-blur-sm md:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-700">
                <i className="ri-stethoscope-line text-sm text-white"></i>
              </div>
              <span className="font-bold text-slate-900">Ônica</span>
              <span className="text-xs font-medium text-slate-400">· Portal Profissional</span>
            </div>

            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <i className={`${isActive ? item.iconActive : item.icon} text-base`}></i>
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {professionalName && (
              <span className="text-sm text-slate-500">
                <i className="ri-user-3-line mr-1 text-slate-300"></i>
                {professionalName}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              <i className="ri-logout-box-line mr-1"></i>Sair
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile top bar ────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-sm md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700">
            <i className="ri-stethoscope-line text-xs text-white"></i>
          </div>
          <span className="font-bold text-slate-900 text-sm">Ônica Pro</span>
        </div>

        {professionalName && (
          <span className="truncate max-w-[140px] text-xs text-slate-500">
            {professionalName}
          </span>
        )}

        <button
          onClick={handleSignOut}
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 active:bg-slate-200"
          aria-label="Sair"
        >
          <i className="ri-logout-box-line text-lg"></i>
        </button>
      </header>

      {/* ── Mobile bottom nav bar ─────────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-slate-200 bg-white/95 backdrop-blur-sm md:hidden"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors ${
                isActive ? 'text-teal-700' : 'text-slate-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <i className={`${isActive ? item.iconActive : item.icon} text-2xl`}></i>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
