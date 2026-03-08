import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Staff from "./pages/Staff";
import Clients from "./pages/Clients";
import Roster from "./pages/Roster";
import ShiftCheckIn from "./pages/ShiftCheckIn";
import Timesheets from "./pages/Timesheets";
import Invoices from "./pages/Invoices";
import CaseNotes from "./pages/CaseNotes";
import Incidents from "./pages/Incidents";
import Compliance from "./pages/Compliance";
import Financials from "./pages/Financials";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import Onboarding from "./pages/Onboarding";
import MyCompliance from "./pages/MyCompliance";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* Admin-only pages */}
            <Route path="/" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
            <Route path="/staff" element={<ProtectedRoute adminOnly><Staff /></ProtectedRoute>} />
            <Route path="/compliance" element={<ProtectedRoute adminOnly><Compliance /></ProtectedRoute>} />
            <Route path="/financials" element={<ProtectedRoute adminOnly><Financials /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
            {/* All authenticated users */}
            <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
            <Route path="/roster" element={<ProtectedRoute><Roster /></ProtectedRoute>} />
            <Route path="/check-in" element={<ProtectedRoute><ShiftCheckIn /></ProtectedRoute>} />
            <Route path="/timesheets" element={<ProtectedRoute><Timesheets /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/case-notes" element={<ProtectedRoute><CaseNotes /></ProtectedRoute>} />
            <Route path="/incidents" element={<ProtectedRoute><Incidents /></ProtectedRoute>} />
            <Route path="/my-compliance" element={<ProtectedRoute><MyCompliance /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
