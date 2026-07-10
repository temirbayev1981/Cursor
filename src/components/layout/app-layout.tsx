import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { GlobalSearch } from '@/components/shared/global-search'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/shared/language-switcher'
import { NotificationBell } from '@/components/layout/notification-bell'
import { useIsMobileNav } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { prefetchChartBundles } from '@/lib/chart-prefetch'

export function AppLayout() {
  const isMobileNav = useIsMobileNav()
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    prefetchChartBundles()
  }, [])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isMobileNav) setMobileNavOpen(false)
  }, [isMobileNav])

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  const mainOffset = isMobileNav ? 0 : sidebarCollapsed ? 72 : 260

  return (
    <div className="gradient-bg min-h-[100dvh] overflow-x-hidden">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        isMobile={isMobileNav}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        onToggle={() => {
          if (isMobileNav) {
            setMobileNavOpen((open) => !open)
            return
          }
          setSidebarCollapsed((collapsed) => !collapsed)
        }}
      />

      <main
        className="min-w-0 transition-[margin] duration-300"
        style={{ marginLeft: mainOffset }}
      >
        <header className="safe-top sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/70 px-3 backdrop-blur-xl sm:gap-3 sm:px-4 lg:h-16 lg:gap-4 lg:px-6">
          {isMobileNav && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <GlobalSearch />
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <LanguageSwitcher compact />
            <NotificationBell />
          </div>
        </header>

        <div className={cn('safe-bottom px-3 py-4 sm:px-4 sm:py-5 lg:p-6')}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
