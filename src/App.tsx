import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'

const Giris = lazy(() => import('@/pages/Giris'))
const Panel = lazy(() => import('@/pages/Panel'))
const Projeler = lazy(() => import('@/pages/Projeler'))
const YeniProje = lazy(() => import('@/pages/YeniProje'))
const ProjeDetay = lazy(() => import('@/pages/ProjeDetay'))
const Tanimlar = lazy(() => import('@/pages/Tanimlar'))
const Raporlar = lazy(() => import('@/pages/Raporlar'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
    },
  },
})

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#F5F7F9] flex items-center justify-center">
      <div
        className="w-8 h-8 border-2 border-[#B4531F] border-t-transparent rounded-full animate-spin"
        role="status"
        aria-label="Yükleniyor"
      />
    </div>
  )
}

function KorunanRota({ children }: { children: React.ReactNode }) {
  const { user, yukleniyor } = useAuth()
  if (yukleniyor) return <LoadingSpinner />
  if (!user) return <Navigate to="/giris" replace />
  return <>{children}</>
}

function GirisRotasi({ children }: { children: React.ReactNode }) {
  const { user, yukleniyor } = useAuth()
  if (yukleniyor) return <LoadingSpinner />
  if (user) return <Navigate to="/panel" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/giris" element={<GirisRotasi><Giris /></GirisRotasi>} />
              <Route element={<KorunanRota><AppLayout /></KorunanRota>}>
                <Route index element={<Navigate to="/panel" replace />} />
                <Route path="/panel" element={<Panel />} />
                <Route path="/projeler" element={<Projeler />} />
                <Route path="/projeler/yeni" element={<YeniProje />} />
                <Route path="/projeler/:id" element={<ProjeDetay />} />
                <Route path="/tanimlar" element={<Tanimlar />} />
                <Route path="/raporlar" element={<Raporlar />} />
              </Route>
              <Route path="*" element={<Navigate to="/panel" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
