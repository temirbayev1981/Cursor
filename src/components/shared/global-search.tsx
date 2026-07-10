import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useNavigate } from 'react-router-dom'
import { useGlobalSearch } from '@/hooks/use-entities'
import { useTranslation } from '@/contexts/locale-context'

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const { data } = useGlobalSearch(query)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const hasResults = query.length >= 2 && data && (
    data.jobs.length + data.customers.length + data.estimates.length + data.invoices.length > 0
  )

  return (
    <div className="relative min-w-0 flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={t.common.searchJobs}
        className="pl-10 bg-secondary/30 border-0"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
      />
      {focused && hasResults && (
        <div className="absolute top-full left-0 right-0 mt-1 glass-card z-50 max-h-64 overflow-y-auto">
          {data!.jobs.map((j) => (
            <button key={j.id} className="w-full text-left px-4 py-2 text-sm hover:bg-secondary/50 cursor-pointer" onClick={() => { navigate('/jobs'); setQuery('') }}>
              <span className="text-muted-foreground">{t.nav.jobs}: </span>{j.title}
            </button>
          ))}
          {data!.customers.map((c) => (
            <button key={c.id} className="w-full text-left px-4 py-2 text-sm hover:bg-secondary/50 cursor-pointer" onClick={() => { navigate('/customers'); setQuery('') }}>
              <span className="text-muted-foreground">{t.nav.customers}: </span>{c.name}
            </button>
          ))}
        </div>
      )}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
        <kbd className="bg-secondary px-1.5 py-0.5 rounded">⌘K</kbd>
      </div>
    </div>
  )
}
