import { AlertTriangle, ExternalLink } from 'lucide-react'
import { hasSupabase, isE2eMockBackend } from '@/lib/env'

export function SupabaseRequiredScreen() {
  if (hasSupabase || isE2eMockBackend) return null

  return (
    <div className="gradient-bg flex min-h-[100dvh] items-center justify-center p-6">
      <div className="glass-card max-w-lg p-8 text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
        <h1 className="text-2xl font-bold mb-2">Supabase required</h1>
        <p className="text-muted-foreground mb-6">
          HandymanOS AI runs on Supabase. Set <code className="text-sm">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-sm">VITE_SUPABASE_ANON_KEY</code> in <code className="text-sm">.env.local</code>,
          apply <code className="text-sm">supabase/schema.sql</code>, and deploy Edge Functions.
        </p>
        <a
          href="https://github.com/temirbayev1981/Cursor/blob/main/DEPLOYMENT.md"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          Deployment guide <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}
