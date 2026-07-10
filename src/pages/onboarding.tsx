import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Zap, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/auth-context'
import type { OnboardingData } from '@/types'

const STEPS = [
  { title: 'Company', description: 'Business information' },
  { title: 'Services', description: 'Service catalog' },
  { title: 'Pricing', description: 'Rates & multipliers' },
  { title: 'Employees', description: 'Team setup' },
  { title: 'Vehicles', description: 'Fleet management' },
  { title: 'Materials', description: 'Inventory basics' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    company: { name: '', email: '', phone: '', address: '' },
    services: [],
    pricing: { hourly_rate: 75, emergency_multiplier: 1.5, weekend_multiplier: 1.25, property_mgmt_discount: 0.1 },
    employees: [],
    vehicles: [],
    materials: [],
  })
  const { completeOnboarding } = useAuth()
  const navigate = useNavigate()

  const progress = ((step + 1) / STEPS.length) * 100

  const handleComplete = () => {
    completeOnboarding()
    navigate('/dashboard')
  }

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-3">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to HandymanOS AI</h1>
          <p className="text-muted-foreground">Let's set up your business in a few steps</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">{STEPS[step].title}</span>
            <span className="text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
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
                    <h2 className="text-lg font-semibold">Company Information</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2"><Label>Company Name</Label><Input className="mt-1" placeholder="ProFix Handyman Services" onChange={(e) => setData({ ...data, company: { ...data.company, name: e.target.value } })} /></div>
                      <div><Label>Email</Label><Input className="mt-1" type="email" placeholder="info@company.com" /></div>
                      <div><Label>Phone</Label><Input className="mt-1" placeholder="(555) 123-4567" /></div>
                      <div className="col-span-2"><Label>Address</Label><Input className="mt-1" placeholder="123 Main St, City, ST" /></div>
                    </div>
                  </div>
                )}
                {step === 1 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Select Your Services</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {['Drywall Repair', 'Painting', 'Plumbing', 'Electrical', 'Door Installation', 'Fixture Install', 'Rental Turnover', 'General Maintenance'].map((svc) => (
                        <button key={svc} className="rounded-lg border border-border p-3 text-sm text-left hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
                          <Check className="h-4 w-4 text-primary mb-1" />
                          {svc}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Pricing Configuration</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Hourly Rate ($)</Label><Input className="mt-1" type="number" defaultValue={75} /></div>
                      <div><Label>Emergency Multiplier</Label><Input className="mt-1" type="number" step="0.1" defaultValue={1.5} /></div>
                      <div><Label>Weekend Multiplier</Label><Input className="mt-1" type="number" step="0.1" defaultValue={1.25} /></div>
                      <div><Label>Property Mgmt Discount (%)</Label><Input className="mt-1" type="number" defaultValue={10} /></div>
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Add Your First Employee</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Name</Label><Input className="mt-1" placeholder="John Smith" /></div>
                      <div><Label>Role</Label><Input className="mt-1" placeholder="Lead Technician" /></div>
                      <div><Label>Hourly Wage ($)</Label><Input className="mt-1" type="number" placeholder="25" /></div>
                      <div><Label>Billing Rate ($)</Label><Input className="mt-1" type="number" placeholder="75" /></div>
                    </div>
                  </div>
                )}
                {step === 4 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Add a Vehicle</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Vehicle Name</Label><Input className="mt-1" placeholder="Service Van #1" /></div>
                      <div><Label>Type</Label><Input className="mt-1" placeholder="Van" /></div>
                      <div><Label>Make / Model</Label><Input className="mt-1" placeholder="Ford Transit" /></div>
                      <div><Label>License Plate</Label><Input className="mt-1" placeholder="ABC-1234" /></div>
                    </div>
                  </div>
                )}
                {step === 5 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Common Materials</h2>
                    <p className="text-sm text-muted-foreground">We've pre-loaded common materials. You can customize later.</p>
                    <div className="space-y-2">
                      {['Joint Compound', 'Interior Paint', 'Door Trim', 'Plumber Tape', 'Sandpaper'].map((m) => (
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
                <ArrowLeft className="h-4 w-4" />Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep(step + 1)}>
                  Next<ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete}>
                  Complete Setup<Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
