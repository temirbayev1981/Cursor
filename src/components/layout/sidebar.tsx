import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  FileText,
  Users,
  Building2,
  Calendar,
  Wrench,
  Package,
  Truck,
  Receipt,
  FileSpreadsheet,
  BarChart3,
  Bot,
  Settings,
  Kanban,
  ChevronLeft,
  X,
  Zap,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from '@/contexts/locale-context'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/shared/language-switcher'
import { CompanySwitcher } from '@/components/shared/company-switcher'
import { canAccess } from '@/lib/permissions'

const navItems = [
  { key: 'dashboard' as const, href: '/dashboard', icon: LayoutDashboard },
  { key: 'jobs' as const, href: '/jobs', icon: Briefcase },
  { key: 'workOrders' as const, href: '/work-orders', icon: ClipboardList },
  { key: 'estimates' as const, href: '/estimates', icon: FileText },
  { key: 'customers' as const, href: '/customers', icon: Users },
  { key: 'properties' as const, href: '/properties', icon: Building2 },
  { key: 'scheduling' as const, href: '/scheduling', icon: Calendar },
  { key: 'dispatch' as const, href: '/dispatch', icon: Kanban, label: 'Диспетчерская' },
  { key: 'technicians' as const, href: '/technicians', icon: Wrench },
  { key: 'materials' as const, href: '/materials', icon: Package },
  { key: 'vehicles' as const, href: '/vehicles', icon: Truck },
  { key: 'expenses' as const, href: '/expenses', icon: Receipt },
  { key: 'invoices' as const, href: '/invoices', icon: FileSpreadsheet },
  { key: 'reports' as const, href: '/reports', icon: BarChart3 },
  { key: 'aiAssistant' as const, href: '/ai-assistant', icon: Bot },
  { key: 'settings' as const, href: '/settings', icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  isMobile?: boolean
  mobileOpen?: boolean
  onMobileClose?: () => void
  onToggle: () => void
}

export function Sidebar({
  collapsed,
  isMobile = false,
  mobileOpen = false,
  onMobileClose,
  onToggle,
}: SidebarProps) {
  const location = useLocation()
  const { user, company, signOut } = useAuth()
  const { t } = useTranslation()

  const visibleNav = navItems.filter((item) => {
    const module = item.key === 'dispatch' ? 'dispatch' : item.href.replace('/', '')
    return !user || canAccess(user.role, module)
  })

  const showLabels = isMobile || !collapsed
  const sidebarWidth = isMobile ? 288 : collapsed ? 72 : 260

  return (
    <motion.aside
      initial={false}
      animate={
        isMobile
          ? { x: mobileOpen ? 0 : -sidebarWidth }
          : { width: sidebarWidth }
      }
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      className={cn(
        'fixed left-0 top-0 z-40 flex h-[100dvh] flex-col border-r border-border bg-background/95 backdrop-blur-xl',
        isMobile ? 'w-[min(288px,88vw)] shadow-2xl' : 'translate-x-0',
      )}
      aria-hidden={isMobile ? !mobileOpen : undefined}
    >
      <div className="safe-top flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 lg:h-16 lg:px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        {showLabels && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 flex flex-col">
            <span className="truncate text-sm font-bold tracking-tight">HandymanOS</span>
            <span className="text-[10px] font-medium text-primary">AI</span>
          </motion.div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn('ml-auto h-8 w-8 shrink-0', !showLabels && !isMobile && 'ml-0')}
          onClick={isMobile ? onMobileClose ?? onToggle : onToggle}
          aria-label={isMobile ? 'Close navigation' : 'Toggle sidebar'}
        >
          {isMobile ? (
            <X className="h-4 w-4" />
          ) : (
            <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          )}
        </Button>
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto overscroll-contain px-2 py-3">
        <ul className="space-y-1">
          {visibleNav.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
            const name = 'label' in item && item.label ? item.label : t.nav[item.key as keyof typeof t.nav]
            return (
              <li key={item.key}>
                <NavLink
                  to={item.href}
                  onClick={isMobile ? onMobileClose : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                  )}
                  title={!showLabels ? name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {showLabels && <span className="truncate">{name}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="safe-bottom shrink-0 border-t border-border p-3">
        {showLabels && (
          <div className="mb-3">
            <LanguageSwitcher />
          </div>
        )}
        <CompanySwitcher collapsed={!showLabels} />
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback>{getInitials(user?.full_name || 'U')}</AvatarFallback>
          </Avatar>
          {showLabels && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">{company?.name}</p>
            </div>
          )}
          {showLabels && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
