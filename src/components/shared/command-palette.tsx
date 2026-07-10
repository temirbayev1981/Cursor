import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { Search, Briefcase, Users, FileText, FileSpreadsheet, LayoutDashboard, Bot, Settings, Sun, Moon } from 'lucide-react'
import { useTranslation } from '@/contexts/locale-context'
import { useTheme } from '@/contexts/theme-context'
import { useGlobalSearch } from '@/hooks/use-entities'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'jobs', href: '/jobs', icon: Briefcase },
  { key: 'workOrders', href: '/work-orders', icon: FileText },
  { key: 'estimates', href: '/estimates', icon: FileText },
  { key: 'customers', href: '/customers', icon: Users },
  { key: 'invoices', href: '/invoices', icon: FileSpreadsheet },
  { key: 'aiAssistant', href: '/ai-assistant', icon: Bot },
  { key: 'settings', href: '/settings', icon: Settings },
] as const

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const { data: searchResults } = useGlobalSearch(query)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const go = useCallback((path: string) => {
    navigate(path)
    setOpen(false)
    setQuery('')
  }, [navigate])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setOpen(false)}>
      <div className="mx-auto mt-[15vh] max-w-xl px-4" onClick={(e) => e.stopPropagation()}>
        <Command className="glass-card overflow-hidden shadow-2xl" shouldFilter={false}>
          <div className="flex items-center border-b border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder={t.common.searchJobs}
              className="flex-1 bg-transparent py-3 text-sm outline-none"
            />
            <kbd className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">ESC</kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              {t.common.noData}
            </Command.Empty>

            <Command.Group heading={t.nav.dashboard} className="text-xs text-muted-foreground px-2 py-1">
              {NAV_ITEMS.map((item) => (
                <Command.Item
                  key={item.href}
                  onSelect={() => go(item.href)}
                  className={cn('flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer',
                    'aria-selected:bg-primary/10 aria-selected:text-primary')}
                >
                  <item.icon className="h-4 w-4" />
                  {t.nav[item.key]}
                </Command.Item>
              ))}
            </Command.Group>

            {searchResults?.jobs && searchResults.jobs.length > 0 && (
              <Command.Group heading={t.nav.jobs} className="text-xs text-muted-foreground px-2 py-1">
                {searchResults.jobs.map((job) => (
                  <Command.Item key={job.id} onSelect={() => go('/jobs')} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer aria-selected:bg-primary/10">
                    <Briefcase className="h-4 w-4" />
                    {job.title}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {searchResults?.customers && searchResults.customers.length > 0 && (
              <Command.Group heading={t.nav.customers} className="text-xs text-muted-foreground px-2 py-1">
                {searchResults.customers.map((c) => (
                  <Command.Item key={c.id} onSelect={() => go('/customers')} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer aria-selected:bg-primary/10">
                    <Users className="h-4 w-4" />
                    {c.name}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Actions" className="text-xs text-muted-foreground px-2 py-1">
              <Command.Item onSelect={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setOpen(false) }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer aria-selected:bg-primary/10">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}

export function useCommandPalette() {
  return { openCommandPalette: () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true })) }
}
