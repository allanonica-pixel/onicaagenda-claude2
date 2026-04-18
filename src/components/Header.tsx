import { NavLink, useNavigate } from 'react-router-dom';
import { usePortalAuth } from '../contexts/PortalAuthContext';

export default function Header() {
  const { professionalName, signOut } = usePortalAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600">
              <i className="ri-stethoscope-line text-sm text-white"></i>
            </div>
            <span className="font-bold text-slate-900">Ônica</span>
            <span className="hidden text-xs font-medium text-slate-400 sm:block">· Portal Profissional</span>
          </div>

          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <i className="ri-calendar-line mr-1.5"></i>Agenda
            </NavLink>
            <NavLink
              to="/faturamento"
              className={({ isActive }) =>
                `rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <i className="ri-money-dollar-circle-line mr-1.5"></i>Faturamento
            </NavLink>
            <NavLink
              to="/relatorios"
              className={({ isActive }) =>
                `rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <i className="ri-bar-chart-line mr-1.5"></i>Relatórios
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {professionalName && (
            <span className="hidden text-sm text-slate-600 sm:block">
              <i className="ri-user-3-line mr-1 text-slate-400"></i>
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

      {/* Mobile nav */}
      <nav className="flex border-t border-slate-100 sm:hidden">
        {[
          { to: '/', icon: 'ri-calendar-line', label: 'Agenda' },
          { to: '/faturamento', icon: 'ri-money-dollar-circle-line', label: 'Faturamento' },
          { to: '/relatorios', icon: 'ri-bar-chart-line', label: 'Relatórios' },
        ].map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-teal-700' : 'text-slate-500'
              }`
            }
          >
            <i className={`${item.icon} text-xl`}></i>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
