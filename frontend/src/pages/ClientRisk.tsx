import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle, ShieldCheck, FileText, Users, Plus, ChevronRight,
  AlertCircle, CheckCircle, Clock, Flame, Heart, Activity,
} from "lucide-react";
import { SearchInput, PrimaryButton, EmptyState } from "@/components/ui-kit";

const RISK_CATEGORIES = [
  { key: "falls", label: "Falls Risk", icon: Activity, color: "orange" },
  { key: "medication", label: "Medication Risk", icon: Heart, color: "red" },
  { key: "behavior", label: "Behavioral Risk", icon: AlertTriangle, color: "purple" },
  { key: "environmental", label: "Environmental", icon: Flame, color: "yellow" },
  { key: "health", label: "Health Risk", icon: Activity, color: "pink" },
  { key: "communication", label: "Communication", icon: FileText, color: "blue" },
];

const SAFETY_PLAN_SECTIONS = [
  "Emergency Contacts",
  "Medical Alerts",
  "Behavioral Strategies",
  "Environmental Modifications",
  "Supervision Requirements",
  "Communication Protocols",
];

export default function ClientRisk() {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"assessments" | "safety">("assessments");

  const { data: clientsData = [], isLoading } = useQuery({
    queryKey: ["clients-risk"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const filteredClients = clientsData.filter((c: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.first_name?.toLowerCase().includes(q) ||
      c.last_name?.toLowerCase().includes(q)
    );
  });

  // Mock risk levels
  const getClientRiskLevel = (clientId: string) => {
    const seed = clientId.charCodeAt(0) % 3;
    return ["low", "medium", "high"][seed];
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high": return { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" };
      case "medium": return { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" };
      default: return { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" };
    }
  };

  const highRiskCount = clientsData.filter((c: any) => getClientRiskLevel(c.id) === "high").length;
  const mediumRiskCount = clientsData.filter((c: any) => getClientRiskLevel(c.id) === "medium").length;

  return (
    <AppLayout title="Risk Management & Safety">
      <div className="space-y-5">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-teal">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{clientsData.length}</p>
              <p className="text-xs text-muted-foreground">Total Clients</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg, #f87171, #ef4444)" }}>
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{highRiskCount}</p>
              <p className="text-xs text-muted-foreground">High Risk</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-orange">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{mediumRiskCount}</p>
              <p className="text-xs text-muted-foreground">Medium Risk</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-green">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{clientsData.length}</p>
              <p className="text-xs text-muted-foreground">Safety Plans</p>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("assessments")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === "assessments"
                ? "bg-purple-100 text-purple-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Risk Assessments
          </button>
          <button
            onClick={() => setActiveTab("safety")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === "safety"
                ? "bg-purple-100 text-purple-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Safety Plans
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search clients..."
            className="w-full sm:w-72"
          />
          <PrimaryButton variant="orange">
            <Plus className="h-4 w-4 mr-2" />
            New Assessment
          </PrimaryButton>
        </div>

        {/* Risk Categories Overview */}
        {activeTab === "assessments" && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {RISK_CATEGORIES.map((cat) => (
              <div
                key={cat.key}
                className="bg-white rounded-xl border border-border/50 p-3 flex flex-col items-center text-center"
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-2 icon-${cat.color}`}>
                  <cat.icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs font-medium text-foreground">{cat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Clients List */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h3 className="font-semibold text-foreground">
              {activeTab === "assessments" ? "Client Risk Assessments" : "Client Safety Plans"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeTab === "assessments" 
                ? "View and manage risk assessments for each client" 
                : "Manage safety plans and protocols"}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredClients.length === 0 ? (
            <EmptyState
              icon={<Users className="h-10 w-10 text-slate-300" />}
              title="No clients found"
              description="Add clients or adjust your search."
            />
          ) : (
            <div className="divide-y divide-border/50">
              {filteredClients.map((client: any) => {
                const riskLevel = getClientRiskLevel(client.id);
                const riskColors = getRiskColor(riskLevel);

                return (
                  <div key={client.id}>
                    <button
                      onClick={() => setSelectedClient(selectedClient === client.id ? null : client.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ background: "linear-gradient(135deg, #fb923c, #f97316)" }}
                        >
                          {client.first_name?.[0]}{client.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {client.preferred_name || client.first_name} {client.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last assessed 3 weeks ago
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${riskColors.bg} ${riskColors.text}`}>
                          {riskLevel} Risk
                        </span>
                        <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${selectedClient === client.id ? "rotate-90" : ""}`} />
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {selectedClient === client.id && (
                      <div className="bg-slate-50 border-t border-border/50 p-4">
                        {activeTab === "assessments" ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {RISK_CATEGORIES.map((cat) => (
                              <div
                                key={cat.key}
                                className="flex items-center gap-2 p-3 rounded-xl bg-white border border-border/50"
                              >
                                <cat.icon className="h-4 w-4 text-slate-500" />
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-foreground">{cat.label}</p>
                                  <p className="text-[10px] text-muted-foreground">Not assessed</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {SAFETY_PLAN_SECTIONS.map((section) => (
                              <div
                                key={section}
                                className="flex items-center justify-between p-3 rounded-xl bg-white border border-border/50"
                              >
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                  <p className="text-sm font-medium text-foreground">{section}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
