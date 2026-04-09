import { NavLink, useLocation } from 'react-router-dom'
import { Home, Search, Map, User } from 'lucide-react'

const TABS = [
  { to: '/',        icon: Home,   label: 'Feed'    },
  { to: '/search',  icon: Search, label: 'Explore' },
  { to: '/trips',   icon: Map,    label: 'Trips'   },
  { to: '/profile', icon: User,   label: 'Profile' },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="bottom-nav flex-shrink-0 flex items-center justify-around px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      {TABS.map(({ to, icon: Icon, label }) => {
        const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
        return (
          <NavLink
            key={to}
            to={to}
            className="flex flex-col items-center gap-0.5 px-5 py-1"
          >
            <Icon
              size={22}
              strokeWidth={active ? 2.5 : 1.8}
              className={active ? 'text-gold' : 'text-text-3'}
            />
            <span className={`text-[10px] font-semibold tracking-wide ${active ? 'text-gold' : 'text-text-3'}`}>
              {label}
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}
