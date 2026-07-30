import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: string
  roller?: string[]
}

const navItems: NavItem[] = [
  { href: '/panel', label: 'Kontrol Paneli', icon: '◈' },
  { href: '/projeler', label: 'Projeler', icon: '◫' },
  { href: '/raporlar', label: 'Raporlar', icon: '≡', roller: ['yonetici', 'satis_sonrasi_sorumlusu'] },
  { href: '/tanimlar', label: 'Tanımlar', icon: '⚙', roller: ['yonetici'] },
]

export function Sidebar() {
  const { kullanici, cikisYap } = useAuth()
  const navigate = useNavigate()

  async function handleCikis() {
    await cikisYap()
    navigate('/giris')
  }

  const gorunenItems = navItems.filter((item) => {
    if (!item.roller) return true
    return kullanici && item.roller.includes(kullanici.rol)
  })

  return (
    <aside
      className="hidden md:flex flex-col w-60 bg-[#0F1F33] text-white min-h-screen fixed left-0 top-0 z-40"
      aria-label="Ana navigasyon"
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: '#B4531F' }}
            aria-hidden
          >
            ☀
          </div>
          <div>
            <div className="font-bold text-sm" style={{ fontFamily: 'Archivo, sans-serif' }}>
              Şimşek Solar
            </div>
            <div className="text-xs text-white/50">Proje Takip</div>
          </div>
        </div>
      </div>

      {/* Navigasyon */}
      <nav className="flex-1 py-4" aria-label="Menü">
        <ul className="space-y-0.5 px-2" role="list">
          {gorunenItems.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors min-h-[44px]',
                    isActive
                      ? 'bg-[#B4531F] text-white font-medium'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                <span className="text-base w-5 text-center flex-shrink-0" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Kullanıcı */}
      <div className="border-t border-white/10 p-4">
        <NavLink
          to="/profil"
          className="flex items-center gap-2 group mb-2"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: '#1B4B73' }}
            aria-hidden
          >
            {(kullanici?.ad_soyad || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate group-hover:text-[#B4531F] transition-colors">
              {kullanici?.ad_soyad}
            </div>
            <div className="text-xs text-white/50 truncate">{kullanici?.eposta}</div>
          </div>
        </NavLink>
        <button
          onClick={handleCikis}
          className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1 min-h-[36px]"
        >
          <span aria-hidden>⇥</span>
          Çıkış yap
        </button>
      </div>
    </aside>
  )
}

// Mobil alt navigasyon çubuğu
export function MobileNav() {
  const { kullanici } = useAuth()

  const gorunenItems = navItems
    .filter((item) => {
      if (!item.roller) return true
      return kullanici && item.roller.includes(kullanici.rol)
    })
    .slice(0, 4)

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F1F33] border-t border-white/10 z-40"
      aria-label="Alt navigasyon"
    >
      <ul className="flex" role="list">
        {gorunenItems.map((item) => (
          <li key={item.href} className="flex-1">
            <NavLink
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center py-2 text-xs min-h-[56px] w-full transition-colors',
                  isActive
                    ? 'text-[#B4531F]'
                    : 'text-white/60 hover:text-white'
                )
              }
            >
              <span className="text-lg" aria-hidden>{item.icon}</span>
              <span className="mt-0.5 leading-none">{item.label.split(' ')[0]}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
