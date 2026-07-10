import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { LocaleProvider } from '@/contexts/locale-context'
import { ThemeProvider } from '@/contexts/theme-context'
import { WorkflowProvider } from '@/contexts/workflow-context'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { CommandPalette } from '@/components/shared/command-palette'
import { AppLayout } from '@/components/layout/app-layout'
import { TableSkeleton } from '@/components/shared/skeleton'
import { canAccess, getDefaultRoute } from '@/lib/permissions'
import LoginPage from '@/pages/login'
import OnboardingPage from '@/pages/onboarding'
import TechnicianMobilePage from '@/pages/technician-mobile'

const DashboardPage = lazy(() => import('@/pages/dashboard'))
const JobsPage = lazy(() => import('@/pages/jobs'))
const WorkOrdersPage = lazy(() => import('@/pages/work-orders'))
const EstimatesPage = lazy(() => import('@/pages/estimates'))
const CustomersPage = lazy(() => import('@/pages/customers'))
const PropertiesPage = lazy(() => import('@/pages/properties'))
const SchedulingPage = lazy(() => import('@/pages/scheduling'))
const DispatchPage = lazy(() => import('@/pages/dispatch'))
const TechniciansPage = lazy(() => import('@/pages/technicians'))
const MaterialsPage = lazy(() => import('@/pages/materials'))
const VehiclesPage = lazy(() => import('@/pages/vehicles'))
const ExpensesPage = lazy(() => import('@/pages/expenses'))
const InvoicesPage = lazy(() => import('@/pages/invoices'))
const ReportsPage = lazy(() => import('@/pages/reports'))
const AIAssistantPage = lazy(() => import('@/pages/ai-assistant'))
const SettingsPage = lazy(() => import('@/pages/settings'))
const PropertyPortalPage = lazy(() => import('@/pages/property-portal'))
const CustomerPortalPage = lazy(() => import('@/pages/customer-portal'))

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
})

function PageLoader() {
  return <div className="p-6"><TableSkeleton /></div>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, onboardingComplete, user } = useAuth()

  if (isLoading) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />

  if (user && user.role === 'technician') {
    return <Navigate to="/tech" replace />
  }

  return <>{children}</>
}

function RoleRoute({ module, children }: { module: string; children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user || !canAccess(user.role, module)) return <Navigate to={getDefaultRoute(user?.role ?? 'owner')} replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/tech" element={<TechnicianMobilePage />} />
        <Route path="/portal/property" element={<PropertyPortalPage />} />
        <Route path="/portal/customer" element={<CustomerPortalPage />} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<RoleRoute module="dashboard"><DashboardPage /></RoleRoute>} />
          <Route path="/jobs" element={<RoleRoute module="jobs"><JobsPage /></RoleRoute>} />
          <Route path="/work-orders" element={<RoleRoute module="work-orders"><WorkOrdersPage /></RoleRoute>} />
          <Route path="/estimates" element={<RoleRoute module="estimates"><EstimatesPage /></RoleRoute>} />
          <Route path="/customers" element={<RoleRoute module="customers"><CustomersPage /></RoleRoute>} />
          <Route path="/properties" element={<RoleRoute module="properties"><PropertiesPage /></RoleRoute>} />
          <Route path="/scheduling" element={<RoleRoute module="scheduling"><SchedulingPage /></RoleRoute>} />
          <Route path="/dispatch" element={<RoleRoute module="dispatch"><DispatchPage /></RoleRoute>} />
          <Route path="/technicians" element={<RoleRoute module="technicians"><TechniciansPage /></RoleRoute>} />
          <Route path="/materials" element={<RoleRoute module="materials"><MaterialsPage /></RoleRoute>} />
          <Route path="/vehicles" element={<RoleRoute module="vehicles"><VehiclesPage /></RoleRoute>} />
          <Route path="/expenses" element={<RoleRoute module="expenses"><ExpensesPage /></RoleRoute>} />
          <Route path="/invoices" element={<RoleRoute module="invoices"><InvoicesPage /></RoleRoute>} />
          <Route path="/reports" element={<RoleRoute module="reports"><ReportsPage /></RoleRoute>} />
          <Route path="/ai-assistant" element={<RoleRoute module="ai-assistant"><AIAssistantPage /></RoleRoute>} />
          <Route path="/settings" element={<RoleRoute module="settings"><SettingsPage /></RoleRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>
              <WorkflowProvider>
                <BrowserRouter>
                  <AppRoutes />
                  <CommandPalette />
                  <Toaster theme="dark" position="top-right" richColors />
                </BrowserRouter>
              </WorkflowProvider>
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
