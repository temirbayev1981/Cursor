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
  ChevronLeft,
  Zap,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DEMO_MODE } from '@/lib/supabase'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Work Orders', href: '/work-orders', icon: ClipboardList },
  { name: 'Estimates', href: '/estimates', icon: FileText },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Properties', href: '/properties', icon: Building2 },
  { name: 'Scheduling', href: '/scheduling', icon: Calendar },
  { name: 'Technicians', href: '/technicians', icon: Wrench },
  { name: 'Materials', href: '/materials', icon: Package },
  { name: 'Vehicles', href: '/vehicles', icon: Truck },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Invoices', href: '/invoices', icon: FileSpreadsheet },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'AI Assistant', href: '/ai-assistant', icon: Bot },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const { user, company, signOut } = useAuth()

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-background/80 backdrop-blur-xl"
    >
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
            <span className="text-sm font-bold tracking-tight">HandymanOS</span>
            <span className="text-[10px] text-primary font-medium">AI</span>
          </motion.div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn('ml-auto h-8 w-8', collapsed && 'ml-0')}
          onClick={onToggle}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-2">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        {DEMO_MODE && !collapsed && (
          <div className="mb-3 rounded-lg bg-accent/10 px-3 py-2 text-xs text-accent">
            Demo Mode — Connect Supabase for live data
          </div>
        )}
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{getInitials(user?.full_name || 'U')}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{company?.name}</p>
            </div>
          )}
          {!collapsed && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
