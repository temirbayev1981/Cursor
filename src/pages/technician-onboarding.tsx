import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from '@/contexts/locale-context'
import { LanguageSwitcher } from '@/components/shared/language-switcher'
import {
  TECH_SKILL_OPTIONS,
  completeTechOnboarding,
} from '@/services/tech-onboarding-service'
import { toast } from 'sonner'

export default function TechnicianOnboardingPage() {
  const { t, locale } = useTranslation()
  const { user, company } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [skills, setSkills] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const toggleSkill = (skill: string) => {
    setSkills((current) =>
      current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill],
    )
  }

  const handleFinish = async () => {
    if (!user || !company) return
    if (!fullName.trim() || !phone.trim()) {
      toast.error(locale === 'ru' ? 'Заполните имя и телефон' : 'Enter your name and phone')
      return
    }
    setLoading(true)
    try {
      await completeTechOnboarding(
        { fullName: fullName.trim(), phone: phone.trim(), skills },
        user.id,
        company.id,
      )
      toast.success(t.techOnboarding.complete)
      navigate('/tech', { replace: true })
    } catch {
      toast.error(locale === 'ru' ? 'Ошибка сохранения' : 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  const progress = step === 0 ? 50 : 100

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-4 right-4"><LanguageSwitcher /></div>
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-3">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{t.techOnboarding.title}</h1>
          <p className="text-muted-foreground mt-1">{t.techOnboarding.subtitle}</p>
        </div>

        <Progress value={progress} className="mb-4" />

        <Card>
          <CardContent className="p-6 space-y-4">
            {step === 0 ? (
              <>
                <div>
                  <Label>{t.techOnboarding.fullName}</Label>
                  <Input className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <Label>{t.techOnboarding.phone}</Label>
                  <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
                </div>
                <Button className="w-full" onClick={() => setStep(1)} disabled={!fullName.trim() || !phone.trim()}>
                  {t.common.next}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{t.techOnboarding.skillsHint}</p>
                <div className="flex flex-wrap gap-2">
                  {TECH_SKILL_OPTIONS.map((skill) => (
                    <Badge
                      key={skill}
                      variant={skills.includes(skill) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSkill(skill)}
                    >
                      {skills.includes(skill) && <Check className="h-3 w-3 mr-1" />}
                      {skill}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>
                    {t.common.back}
                  </Button>
                  <Button className="flex-1" disabled={loading} onClick={() => void handleFinish()}>
                    {loading ? '...' : t.techOnboarding.finish}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
