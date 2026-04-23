import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense, lazy } from "react";
import { PageSkeleton } from "@/components/LoadingSkeletons";

// Eager load critical pages
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import WorkerHome from "./pages/WorkerHome";

// Lazy load less critical pages for better initial load
const Staff = lazy(() => import("./pages/Staff"));
const StaffHR = lazy(() => import("./pages/StaffHR"));
const StaffTraining = lazy(() => import("./pages/StaffTraining"));
const StaffCompliance = lazy(() => import("./pages/Compliance")); // Reuse compliance page

const Clients = lazy(() => import("./pages/Clients"));
const ClientCarePlans = lazy(() => import("./pages/ClientCarePlans"));
const ClientRisk = lazy(() => import("./pages/ClientRisk"));

const Roster = lazy(() => import("./pages/Roster"));
const ShiftCheckIn = lazy(() => import("./pages/ShiftCheckIn"));
const Timesheets = lazy(() => import("./pages/Timesheets"));
const Invoices = lazy(() => import("./pages/Invoices"));
const CaseNotes = lazy(() => import("./pages/CaseNotes"));
const Incidents = lazy(() => import("./pages/Incidents"));
const Compliance = lazy(() => import("./pages/Compliance"));
const Financials = lazy(() => import("./pages/Financials"));
const Reports = lazy(() => import("./pages/Reports"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const MyCompliance = lazy(() => import("./pages/MyCompliance"));
const MyRoster = lazy(() => import("./pages/MyRoster"));
const MyTimesheets = lazy(() => import("./pages/MyTimesheets"));
const WorkerCheckIn = lazy(() => import("./pages/WorkerCheckIn"));
const WorkerNotes = lazy(() => import("./pages/WorkerNotes"));

// Configure React Query with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000, // 30 seconds
      refetchOnWindowFocus: false,
    },
  },
});

// Suspense fallback component
function PageLoader() {
  return <PageSkeleton />;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />

              {/* Admin Dashboard */}
              <Route
                path="/"
                element={
                  <ProtectedRoute adminOnly>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Staff Section (Admin) */}
              <Route
                path="/staff"
                element={
                  <ProtectedRoute adminOnly>
                    <Suspense fallback={<PageLoader />}>
                      <Staff />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff/hr"
                element={
                  <ProtectedRoute adminOnly>
                    <Suspense fallback={<PageLoader />}>
                      <StaffHR />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff/training"
                element={
                  <ProtectedRoute adminOnly>
                    <Suspense fallback={<PageLoader />}>
                      <StaffTraining />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff/compliance"
                element={
                  <ProtectedRoute adminOnly>
                    <Suspense fallback={<PageLoader />}>
                      <StaffCompliance />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              {/* Clients Section */}
              <Route
                path="/clients"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Clients />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clients/care-plans"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <ClientCarePlans />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clients/risk"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <ClientRisk />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              {/* Shifts Section */}
              <Route
                path="/roster"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Roster />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/check-in"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <ShiftCheckIn />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/timesheets"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Timesheets />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Invoices />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              {/* Records Section */}
              <Route
                path="/case-notes"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <CaseNotes />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/incidents"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Incidents />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              {/* My Profile Section (Worker) */}
              <Route
                path="/my-roster"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <MyRoster />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-compliance"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <MyCompliance />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-timesheets"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <MyTimesheets />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              {/* Finance Section (Admin) */}
              <Route
                path="/financials"
                element={
                  <ProtectedRoute adminOnly>
                    <Suspense fallback={<PageLoader />}>
                      <Financials />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute adminOnly>
                    <Suspense fallback={<PageLoader />}>
                      <Reports />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              {/* Settings (Admin) */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute adminOnly>
                    <Suspense fallback={<PageLoader />}>
                      <SettingsPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              {/* Legacy routes - kept for compatibility */}
              <Route
                path="/compliance"
                element={
                  <ProtectedRoute adminOnly>
                    <Suspense fallback={<PageLoader />}>
                      <Compliance />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Onboarding />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              {/* Worker app routes */}
              <Route
                path="/worker"
                element={
                  <ProtectedRoute>
                    <WorkerHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/worker/check-in"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <WorkerCheckIn />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/worker/notes"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <WorkerNotes />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
