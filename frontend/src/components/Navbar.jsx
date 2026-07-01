import { NavLink } from 'react-router-dom'

const links = [
  { to: '/dashboard',  label: 'Dashboard',     icon: '📊' },
  { to: '/canchas',    label: 'Canchas',        icon: '⚽' },
  { to: '/horarios',   label: 'Horarios',       icon: '🕒' },
  { to: '/clientes',   label: 'Clientes',       icon: '👥' },
  { to: '/reservas',   label: 'Reservas',       icon: '📅' },
  { to: '/reservar',   label: 'Nueva reserva →', icon: '➕', public: true },
]

export default function Navbar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-primary-900 text-white flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-primary-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center text-lg">⚽</div>
          <div>
            <p className="font-bold text-base leading-tight">Canchas</p>
            <p className="text-primary-300 text-xs">Reservas</p>
          </div>
        </div>
      </div>

      {/* Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? link.public
                    ? 'bg-primary-500 text-white'
                    : 'bg-white/10 text-white'
                  : link.public
                  ? 'text-primary-300 hover:bg-primary-500/20 hover:text-white border border-primary-600 mt-2'
                  : 'text-primary-200 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <span className="text-base">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-primary-700">
        <p className="text-primary-400 text-xs">&copy; 2026 Canchas Reservas</p>
      </div>
    </aside>
  )
}
