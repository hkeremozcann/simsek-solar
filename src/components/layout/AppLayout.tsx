import { Outlet } from 'react-router-dom'
import { Sidebar, MobileNav } from './Sidebar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <Sidebar />
      <main
        id="ana-icerik"
        className="md:ml-60 min-h-screen pb-16 md:pb-0"
        tabIndex={-1}
      >
        <Outlet />
      </main>
      <MobileNav />
    </div>
  )
}
