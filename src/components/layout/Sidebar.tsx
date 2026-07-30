import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, Grid3X3, AlertCircle,
  Package, FileText, BarChart3, Settings2, Settings,
  Bell, Search, LogOut, ChevronRight, Wifi, WifiOff
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { ROL_ETIKETLERI } from '@/lib/types'
import type { KullaniciRolu } from '@/lib/types'

interface NavItem {
  href: string
  label: string
  Icon: React.ElementType
  roller?: string[]
  badge?: number
}

const navItems: NavItem[] = [
  { href: '/panel', label: 'Kontrol Paneli', Icon: LayoutDashboard },
  { href: '/projeler', label: 'Projeler', Icon: FolderKanban },
  { href: '/blok-takibi', label: 'Blok Takibi', Icon: Grid3X3 },
  { href: '/hatalar', label: 'Hatalar', Icon: AlertCircle },
  { href: '/eksik-imalat', label: 'Eksik İmalat', Icon: Package },
  { href: '/saha-raporlari', label: 'Saha Raporları', Icon: FileText },
  { href: '/analitik', label: 'Analitik', Icon: BarChart3, roller: ['yonetici', 'satis_sonrasi_sorumlusu'] },
  { href: '/tanimlar', label: 'Tanımlar', Icon: Settings2, roller: ['yonetici'] },
  { href: '/ayarlar', label: 'Ayarlar', Icon: Settings },
]

export function Sidebar() {
  const { kullanici, cikisYap } = useAuth()
  const navigate = useNavigate()

  async function handleCikis() {
    await cikisYap()
    navigate('/giris')
  }

  const gorunenItems = navItems.filter(item => {
    if (!item.roller) return true
    return kullanici && item.roller.includes(kullanici.rol)
  })

  return (
    <aside
      className="hidden md:flex flex-col w-60 bg-[#0F1F33] text-white min-h-screen fixed left-0 top-0 z-40"
      aria-label="Ana navigasyon"
    >
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: '#B4531F' }}
            aria-hidden
          >
            ŞS
          </div>
          <div>
            <div className="font-bold text-sm" style={{ fontFamily: 'Archivo, sans-serif' }}>
              Şimşek Solar
            </div>
            <div className="text-xs text-white/50">Proje Takip</div>
          </div>
        </div>
      </div>

      {/* Arama kısayolu */}
      <button
        className="mx-2 mt-3 px-3 py-2 text-xs text-white/40 border border-white/10 rounded flex items-center gap-2 hover:bg-white/5 transition-colors"
        aria-label="Proje ara (Ctrl+K)"
        onClick={() => {/* TODO: Ctrl+K global search */}}
      >
        <Search size={13} aria-hidden />
        <span>Ara...</span>
        <kbd className="ml-auto text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded">⌘K</kbd>
      </button>

      {/* Navigasyon */}
      <nav className="flex-1 py-3 overflow-y-auto" aria-label="Menü">
        <ul className="space-y-0.5 px-2" role="list">
          {gorunenItems.map(({ href, label, Icon, badge }) => (
            <li key={href}>
              <NavLink
                to={href}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors min-h-[44px]',
                  isActive
                    ? 'bg-[#B4531F] text-white font-medium'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon size={16} className="flex-shrink-0" aria-hidden />
                <span>{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span
                    className="ml-auto bg-[#B3261E] text-white text-xs rounded-full px-1.5 min-w-[18px] text-center"
                    aria-label={`${badge} adet`}
                  >
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Kullanıcı */}
      <div className="border-t border-white/10 p-3">
        <NavLink
          to="/profil"
          className="flex items-center gap-2 p-2 rounded hover:bg-white/10 transition-colors group"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: '#1B4B73' }}
            aria-hidden
          >
            {(kullanici?.ad_soyad || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-white truncate group-hover:text-[#B4531F] transition-colors">
              {kullanici?.ad_soyad || 'Kullanıcı'}
            </div>
            <div className="text-xs text-white/40 truncate">
              {ROL_ETIKETLERI[(kullanici?.rol || 'satis_temsilcisi') as KullaniciRolu]}
            </div>
          </div>
          <ChevronRight size={14} className="text-white/30 flex-shrink-0" aria-hidden />
        </NavLink>
        <button
          onClick={handleCikis}
          className="mt-1 w-full flex items-center gap-2 px-2 py-1.5 text-xs text-white/40 hover:text-white rounded hover:bg-white/5 transition-colors"
        >
          <LogOut size={13} aria-hidden />
          Çıkış yap
        </button>
      </div>
    </aside>
  )
}

// Mobil alt navigasyon
export function MobileNav() {
  const { kullanici } = useAuth()
  const mainItems = navItems.slice(0, 5) // İlk 5 öğe

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F1F33] border-t border-white/10 z-40"
      aria-label="Alt navigasyon"
    >
      <ul className="flex" role="list">
        {mainItems.map(({ href, label, Icon }) => (
          <li key={href} className="flex-1">
            <NavLink
              to={href}
              className={({ isActive }) => cn(
                'flex flex-col items-center justify-center py-2 min-h-[56px] w-full transition-colors text-[10px]',
                isActive ? 'text-[#B4531F]' : 'text-white/60 hover:text-white'
              )}
            >
              <Icon size={20} aria-hidden />
              <span className="mt-0.5">{label.split(' ')[0]}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// Çevrimdışı göstergesi
export function CevrimDisiGosterge({ cerimDisiBekleyen }: { cerimDisiBekleyen: number }) {
  if (cerimDisiBekleyen === 0) return null
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-[#9A6700] text-white text-xs py-1.5 px-4 flex items-center justify-center gap-2"
      role="status"
      aria-live="polite"
    >
      <WifiOff size={13} aria-hidden />
      Çevrimdışı — {cerimDisiBekleyen} değişiklik bekliyor
    </div>
  )
}
