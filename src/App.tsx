import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Staff from "./pages/Staff";
import Clients from "./pages/Clients";
import Roster from "./pages/Roster";
import ShiftCheckIn from "./pages/ShiftCheckIn";
import Timesheets from "./pages/Timesheets";
import CaseNotes from "./pages/CaseNotes";
import Incidents from "./pages/Incidents";
import Compliance from "./pages/Compliance";
import Financials from "./pages/Financials";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/roster" element={<Roster />} />
          <Route path="/check-in" element={<ShiftCheckIn />} />
          <Route path="/timesheets" element={<Timesheets />} />
          <Route path="/case-notes" element={<CaseNotes />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/financials" element={<Financials />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
