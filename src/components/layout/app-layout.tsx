import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { GlobalSearch } from '@/components/shared/global-search'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/shared/language-switcher'

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="gradient-bg min-h-screen">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main
        className="transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? 72 : 260 }}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/60 backdrop-blur-xl px-6">
          <GlobalSearch />
          <LanguageSwitcher compact />
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
          </Button>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
