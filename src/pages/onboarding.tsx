import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Zap, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from '@/contexts/locale-context'
import { LanguageSwitcher } from '@/components/shared/language-switcher'
import { toast } from 'sonner'
import type { OnboardingData } from '@/types'
import { loadOnboardingData, saveOnboardingData } from '@/services/onboarding-service'

const EMPTY_ONBOARDING: OnboardingData = {
  company: { name: '', email: '', phone: '', address: '' },
  services: [],
  pricing: { hourly_rate: 75, emergency_multiplier: 1.5, weekend_multiplier: 1.25, property_mgmt_discount: 0.1 },
  employees: [],
  vehicles: [],
  materials: [],
}

export default function OnboardingPage() {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>(() => loadOnboardingData() ?? EMPTY_ONBOARDING)
  const { completeOnboarding } = useAuth()
  const navigate = useNavigate()

  const STEPS = [
    { title: t.onboarding.company, description: t.onboarding.companyDesc },
    { title: t.onboarding.services, description: t.onboarding.servicesDesc },
    { title: t.onboarding.pricing, description: t.onboarding.pricingDesc },
    { title: t.onboarding.employees, description: t.onboarding.employeesDesc },
    { title: t.onboarding.vehicles, description: t.onboarding.vehiclesDesc },
    { title: t.onboarding.materials, description: t.onboarding.materialsDesc },
  ]

  const [selectedServices, setSelectedServices] = useState<string[]>(() =>
    (loadOnboardingData()?.services ?? [])
      .map((service) => service.name)
      .filter((name): name is string => Boolean(name)),
  )
  const [employeeDraft, setEmployeeDraft] = useState({ name: '', role: '', hourly_wage: 25, billing_rate: 75 })
  const [vehicleDraft, setVehicleDraft] = useState({ name: '', type: 'van', make_model: '', license_plate: '' })

  const toggleService = (svc: string) => {
    setSelectedServices((prev) => {
      const next = prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]
      setData((d) => ({
        ...d,
        services: next.map((name) => ({ name, category: name })),
      }))
      return next
    })
  }

  const addEmployee = () => {
    if (!employeeDraft.name) return
    const emp = { ...employeeDraft, skills: [] as string[] }
    setData((d) => ({ ...d, employees: [...d.employees, emp] }))
    setEmployeeDraft({ name: '', role: '', hourly_wage: 25, billing_rate: 75 })
  }

  const addVehicle = () => {
    if (!vehicleDraft.name) return
    const [make = '', model = ''] = vehicleDraft.make_model.split(' ')
    setData((d) => ({
      ...d,
      vehicles: [...d.vehicles, {
        name: vehicleDraft.name,
        type: vehicleDraft.type as import('@/types').Vehicle['type'],
        make,
        model,
        license_plate: vehicleDraft.license_plate,
      }],
    }))
    setVehicleDraft({ name: '', type: 'van', make_model: '', license_plate: '' })
  }

  const progress = ((step + 1) / STEPS.length) * 100

  useEffect(() => {
    saveOnboardingData({
      ...data,
      services: selectedServices.map((name) => ({ name, category: name })),
    })
  }, [data, selectedServices])

  const canProceed = () => {
    if (step === 0) return (data.company.name ?? '').trim().length >= 2
    if (step === 1) return selectedServices.length > 0
    return true
  }

  const goNext = () => {
    if (!canProceed()) {
      if (step === 0) toast.error(t.onboarding.companyNameRequired)
      if (step === 1) toast.error(t.onboarding.servicesRequired)
      return
    }
    setStep(step + 1)
  }

  const handleComplete = async () => {
    const payload: OnboardingData = {
      ...data,
      services: selectedServices.map((name) => ({ name, category: name })),
      materials: t.onboarding.materialList.map((name) => ({ name, category: 'general' })),
    }
    try {
      await completeOnboarding(payload)
      toast.success(t.auth.completeSetup)
      navigate('/dashboard')
    } catch {
      toast.error(t.onboarding.saveFailed)
    }
  }

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-2xl">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-3">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{t.auth.welcome}</h1>
          <p className="text-muted-foreground">{t.auth.setupDesc}</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">{STEPS[step].title}</span>
            <span className="text-muted-foreground">{t.common.step} {step + 1} {t.common.of} {STEPS.length}</span>
          </div>
          <Progress value={progress} />
        </div>

        <Card>
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {step === 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">{t.onboarding.companyInfo}</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2"><Label>{t.onboarding.companyName}</Label><Input className="mt-1" placeholder="ProFix Handyman Services" value={data.company.name} onChange={(e) => setData({ ...data, company: { ...data.company, name: e.target.value } })} /></div>
                      <div><Label>{t.auth.email}</Label><Input className="mt-1" type="email" placeholder="info@company.com" value={data.company.email} onChange={(e) => setData({ ...data, company: { ...data.company, email: e.target.value } })} /></div>
                      <div><Label>{t.onboarding.phone}</Label><Input className="mt-1" placeholder="(555) 123-4567" value={data.company.phone} onChange={(e) => setData({ ...data, company: { ...data.company, phone: e.target.value } })} /></div>
                      <div className="col-span-2"><Label>{t.onboarding.address}</Label><Input className="mt-1" placeholder="123 Main St, City, ST" value={data.company.address} onChange={(e) => setData({ ...data, company: { ...data.company, address: e.target.value } })} /></div>
                    </div>
                  </div>
                )}
                {step === 1 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">{t.onboarding.selectServices}</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {t.onboarding.serviceList.map((svc) => (
                        <button key={svc} type="button" onClick={() => toggleService(svc)}
                          className={`rounded-lg border p-3 text-sm text-left transition-colors cursor-pointer ${selectedServices.includes(svc) ? 'border-primary bg-primary/10' : 'border-border hover:border-primary hover:bg-primary/5'}`}>
                          <Check className={`h-4 w-4 mb-1 ${selectedServices.includes(svc) ? 'text-primary' : 'text-muted-foreground'}`} />
                          {svc}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">{t.onboarding.pricingConfig}</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>{t.onboarding.hourlyRate}</Label><Input className="mt-1" type="number" value={data.pricing.hourly_rate} onChange={(e) => setData({ ...data, pricing: { ...data.pricing, hourly_rate: Number(e.target.value) } })} /></div>
                      <div><Label>{t.onboarding.emergencyMultiplier}</Label><Input className="mt-1" type="number" step="0.1" value={data.pricing.emergency_multiplier} onChange={(e) => setData({ ...data, pricing: { ...data.pricing, emergency_multiplier: Number(e.target.value) } })} /></div>
                      <div><Label>{t.onboarding.weekendMultiplier}</Label><Input className="mt-1" type="number" step="0.1" value={data.pricing.weekend_multiplier} onChange={(e) => setData({ ...data, pricing: { ...data.pricing, weekend_multiplier: Number(e.target.value) } })} /></div>
                      <div><Label>{t.onboarding.propertyMgmtDiscount}</Label><Input className="mt-1" type="number" value={data.pricing.property_mgmt_discount * 100} onChange={(e) => setData({ ...data, pricing: { ...data.pricing, property_mgmt_discount: Number(e.target.value) / 100 } })} /></div>
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">{t.onboarding.addEmployee}</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>{t.onboarding.name}</Label><Input className="mt-1" placeholder="John Smith" value={employeeDraft.name} onChange={(e) => setEmployeeDraft({ ...employeeDraft, name: e.target.value })} /></div>
                      <div><Label>{t.onboarding.role}</Label><Input className="mt-1" placeholder="Lead Technician" value={employeeDraft.role} onChange={(e) => setEmployeeDraft({ ...employeeDraft, role: e.target.value })} /></div>
                      <div><Label>{t.onboarding.hourlyWage}</Label><Input className="mt-1" type="number" value={employeeDraft.hourly_wage} onChange={(e) => setEmployeeDraft({ ...employeeDraft, hourly_wage: Number(e.target.value) })} /></div>
                      <div><Label>{t.onboarding.billingRate}</Label><Input className="mt-1" type="number" value={employeeDraft.billing_rate} onChange={(e) => setEmployeeDraft({ ...employeeDraft, billing_rate: Number(e.target.value) })} /></div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addEmployee}>{t.common.add}</Button>
                    {data.employees.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {t.onboarding.employeesAdded.replace('{count}', String(data.employees.length))}
                      </div>
                    )}
                  </div>
                )}
                {step === 4 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">{t.onboarding.addVehicle}</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>{t.onboarding.vehicleName}</Label><Input className="mt-1" value={vehicleDraft.name} onChange={(e) => setVehicleDraft({ ...vehicleDraft, name: e.target.value })} /></div>
                      <div><Label>{t.onboarding.type}</Label><Input className="mt-1" value={vehicleDraft.type} onChange={(e) => setVehicleDraft({ ...vehicleDraft, type: e.target.value })} /></div>
                      <div><Label>{t.onboarding.makeModel}</Label><Input className="mt-1" value={vehicleDraft.make_model} onChange={(e) => setVehicleDraft({ ...vehicleDraft, make_model: e.target.value })} /></div>
                      <div><Label>{t.onboarding.licensePlate}</Label><Input className="mt-1" value={vehicleDraft.license_plate} onChange={(e) => setVehicleDraft({ ...vehicleDraft, license_plate: e.target.value })} /></div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addVehicle}>{t.common.add}</Button>
                  </div>
                )}
                {step === 5 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">{t.onboarding.commonMaterials}</h2>
                    <p className="text-sm text-muted-foreground">{t.onboarding.materialsPreloaded}</p>
                    <div className="space-y-2">
                      {t.onboarding.materialList.map((m) => (
                        <div key={m} className="flex items-center gap-2 rounded-lg bg-secondary/30 p-3 text-sm">
                          <Check className="h-4 w-4 text-success" />
                          {m}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
                <ArrowLeft className="h-4 w-4" />{t.common.back}
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={goNext} disabled={!canProceed()}>
                  {t.common.next}<ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete}>
                  {t.auth.completeSetup}<Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
