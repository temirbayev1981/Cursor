import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, ArrowRight, User } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from '@/contexts/locale-context'
import { LanguageSwitcher } from '@/components/shared/language-switcher'
import { resolvePostAuthRoute } from '@/lib/permissions'
import { DEMO_MODE } from '@/lib/supabase'
import { getTeamInvitePreview } from '@/services/invite-service'
import { toast } from 'sonner'
import type { UserRole } from '@/types'

export default function LoginPage() {
  const [email, setEmail] = useState('owner@profixhandyman.com')
  const [password, setPassword] = useState('demo1234')
  const [fullName, setFullName] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, acceptInvite } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isPortal = searchParams.get('portal') === '1'
  const inviteToken = searchParams.get('invite') ?? undefined
  const [invitePreview, setInvitePreview] = useState<{ email: string; role: UserRole } | null>(null)
  const [inviteChecked, setInviteChecked] = useState(!inviteToken)

  useEffect(() => {
    if (!inviteToken) {
      setInvitePreview(null)
      setInviteChecked(true)
      return
    }
    setInviteChecked(false)
    void getTeamInvitePreview(inviteToken).then((preview) => {
      if (preview) {
        setInvitePreview({ email: preview.email, role: preview.role })
        setEmail(preview.email)
        setMode('signup')
      } else {
        setInvitePreview(null)
      }
      setInviteChecked(true)
    })
  }, [inviteToken])

  const handlePortalDemo = () => {
    sessionStorage.setItem('handymanos_portal_token', 'demo')
    navigate('/portal/customer')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const authState = mode === 'signup'
        ? await signUp(email, password, fullName || email.split('@')[0], inviteToken)
        : await signIn(email, password)

      if (inviteToken && mode === 'signin') {
        await acceptInvite(inviteToken, authState.profile)
      }

      toast.success(mode === 'signup' ? t.auth.accountCreated : t.auth.signedIn)
      navigate(resolvePostAuthRoute(inviteToken && mode === 'signin'
        ? { role: invitePreview?.role ?? authState.role, onboardingComplete: true }
        : authState))
    } catch {
      toast.error(t.auth.authError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gradient-bg safe-x flex min-h-[100dvh] items-center justify-center p-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="safe-top absolute right-4 top-4"><LanguageSwitcher /></div>

        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary mb-4">
            <Zap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">{t.auth.title} <span className="text-primary">AI</span></h1>
          <p className="text-muted-foreground mt-2">{t.auth.subtitle}</p>
        </div>

        <Card>
          <CardHeader>
            <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
              <TabsList className="w-full">
                <TabsTrigger value="signin" className="flex-1">{t.auth.signIn}</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">{t.auth.signUp}</TabsTrigger>
              </TabsList>
            </Tabs>
            <CardDescription className="pt-2">{mode === 'signin' ? t.auth.signInDesc : t.auth.signUpDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {inviteToken && inviteChecked && !invitePreview && (
              <div role="alert" data-testid="invite-error" className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {t.auth.inviteInvalidOrExpired}
              </div>
            )}
            {invitePreview && (
              <div className="mb-4 rounded-lg bg-primary/10 p-3 text-sm">
                <p className="font-medium">{t.auth.inviteBanner}</p>
                <p className="text-muted-foreground mt-1">
                  {t.auth.inviteRole}: <Badge variant="outline">{invitePreview.role}</Badge>
                </p>
                <p className="text-muted-foreground mt-1">{t.auth.acceptInvite}</p>
                <p className="text-muted-foreground mt-2 text-xs">{t.auth.acceptInviteSignIn}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <Label>{t.auth.fullName}</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10" required />
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="email">{t.auth.email}</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div>
                <Label htmlFor="password">{t.auth.password}</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required minLength={6} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t.common.signingIn : mode === 'signup' ? t.auth.signUpBtn : t.auth.signInBtn}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            {DEMO_MODE && <p className="text-xs text-center text-muted-foreground mt-4">{t.auth.demoHint}</p>}
            {isPortal && DEMO_MODE && (
              <Button type="button" variant="outline" className="w-full mt-3" onClick={handlePortalDemo}>
                {t.auth.portalDemoAccess}
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
