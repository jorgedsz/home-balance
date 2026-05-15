import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Resumen', icon: 'home', end: true },
  { to: '/transacciones', label: 'Ingresos / Egresos', icon: 'flow' },
  { to: '/cuentas', label: 'Cuentas', icon: 'wallet' },
  { to: '/facturas', label: 'Facturas', icon: 'doc' }
];

const ICONS = {
  home: 'M3 12L12 4l9 8M5 10v10h14V10',
  flow: 'M4 7h11l-3-3m3 3l-3 3M20 17H9l3 3m-3-3l3-3',
  wallet: 'M3 7h18v12H3zM3 7l3-3h12l3 3M16 13h2',
  doc: 'M7 3h7l5 5v13H7zM14 3v5h5'
};

const Icon = ({ name }) => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={ICONS[name]} />
  </svg>
);

export default function DashboardLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-full">
      <aside className="w-60 border-r border-border bg-card flex flex-col">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-bg font-extrabold">B</div>
          <div>
            <div className="text-sm font-bold leading-tight">Home Balance</div>
            <div className="text-[11px] text-muted">Finanzas del hogar</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-cardHover hover:text-text'
                }`
              }
            >
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="mx-3 mb-4 px-3 py-2 text-sm text-muted hover:text-text rounded-lg hover:bg-cardHover text-left"
        >
          Cerrar sesión
        </button>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
