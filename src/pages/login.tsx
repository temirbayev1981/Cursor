import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, ArrowRight } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from '@/contexts/locale-context'
import { LanguageSwitcher } from '@/components/shared/language-switcher'
import { DEMO_MODE } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('owner@profixhandyman.com')
  const [password, setPassword] = useState('demo1234')
  const [loading, setLoading] = useState(false)
  const { signIn, onboardingComplete } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isPortal = searchParams.get('portal') === '1'

  const handlePortalDemo = () => {
    sessionStorage.setItem('handymanos_portal_token', 'demo')
    navigate('/portal/customer')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email, password)
      navigate(onboardingComplete ? '/dashboard' : '/onboarding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary mb-4">
            <Zap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">{t.auth.title} <span className="text-primary">AI</span></h1>
          <p className="text-muted-foreground mt-2">{t.auth.subtitle}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.auth.signIn}</CardTitle>
            <CardDescription>{t.auth.signInDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t.common.signingIn : t.auth.signInBtn}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            {DEMO_MODE && (
              <p className="text-xs text-center text-muted-foreground mt-4">
                {t.auth.demoHint}
              </p>
            )}
            {isPortal && DEMO_MODE && (
              <Button type="button" variant="outline" className="w-full mt-3" onClick={handlePortalDemo}>
                Демо-доступ к порталу клиента
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
