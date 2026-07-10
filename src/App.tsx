import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { LocaleProvider } from '@/contexts/locale-context'
import { AppLayout } from '@/components/layout/app-layout'
import LoginPage from '@/pages/login'
import OnboardingPage from '@/pages/onboarding'
import DashboardPage from '@/pages/dashboard'
import JobsPage from '@/pages/jobs'
import WorkOrdersPage from '@/pages/work-orders'
import EstimatesPage from '@/pages/estimates'
import CustomersPage from '@/pages/customers'
import PropertiesPage from '@/pages/properties'
import SchedulingPage from '@/pages/scheduling'
import TechniciansPage from '@/pages/technicians'
import MaterialsPage from '@/pages/materials'
import VehiclesPage from '@/pages/vehicles'
import ExpensesPage from '@/pages/expenses'
import InvoicesPage from '@/pages/invoices'
import ReportsPage from '@/pages/reports'
import AIAssistantPage from '@/pages/ai-assistant'
import SettingsPage from '@/pages/settings'
import TechnicianMobilePage from '@/pages/technician-mobile'
import PropertyPortalPage from '@/pages/property-portal'
import CustomerPortalPage from '@/pages/customer-portal'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, onboardingComplete } = useAuth()

  if (isLoading) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/tech" element={<TechnicianMobilePage />} />
      <Route path="/portal/property" element={<PropertyPortalPage />} />
      <Route path="/portal/customer" element={<CustomerPortalPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/work-orders" element={<WorkOrdersPage />} />
        <Route path="/estimates" element={<EstimatesPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/scheduling" element={<SchedulingPage />} />
        <Route path="/technicians" element={<TechniciansPage />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/ai-assistant" element={<AIAssistantPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster theme="dark" position="top-right" richColors />
          </BrowserRouter>
        </AuthProvider>
      </LocaleProvider>
    </QueryClientProvider>
  )
}
