import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Heart, FileText, Users, Clock, Plus, ChevronRight, User,
  Calendar, CheckCircle, AlertCircle, Edit, Trash2,
} from "lucide-react";
import { SearchInput, PrimaryButton, EmptyState } from "@/components/ui-kit";

export default function ClientCarePlans() {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const { data: clientsData = [], isLoading } = useQuery({
    queryKey: ["clients-care-plans"],
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

  // Mock care plan data structure
  const carePlanSections = [
    { key: "about_me", label: "About Me", description: "Personal history, preferences, and what matters most" },
    { key: "daily_living", label: "Daily Living", description: "Support needs for everyday activities" },
    { key: "health", label: "Health & Medical", description: "Medical conditions, medications, and health goals" },
    { key: "communication", label: "Communication", description: "How the client communicates and prefers to be communicated with" },
    { key: "goals", label: "Goals & Aspirations", description: "Short and long-term goals" },
    { key: "support_network", label: "Support Network", description: "Family, friends, and key contacts" },
  ];

  return (
    <AppLayout title="Care Plans">
      <div className="space-y-5">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-pink">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{clientsData.length}</p>
              <p className="text-xs text-muted-foreground">Care Plans</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-green">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{Math.floor(clientsData.length * 0.8)}</p>
              <p className="text-xs text-muted-foreground">Up to Date</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-orange">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{Math.floor(clientsData.length * 0.15)}</p>
              <p className="text-xs text-muted-foreground">Review Due</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-blue">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">6</p>
              <p className="text-xs text-muted-foreground">Plan Sections</p>
            </div>
          </motion.div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search clients..."
            className="w-full sm:w-72"
          />
          <PrimaryButton variant="pink">
            <Plus className="h-4 w-4 mr-2" />
            New Care Plan
          </PrimaryButton>
        </div>

        {/* Clients List */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h3 className="font-semibold text-foreground">Client Care Plans</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Click on a client to view their care plan</p>
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
              {filteredClients.map((client: any) => (
                <div key={client.id}>
                  <button
                    onClick={() => setSelectedClient(selectedClient === client.id ? null : client.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: "linear-gradient(135deg, #f472b6, #ec4899)" }}
                      >
                        {client.first_name?.[0]}{client.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {client.preferred_name || client.first_name} {client.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {client.funding_type?.toUpperCase() || "NDIS"} • Last updated 2 weeks ago
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        Active
                      </span>
                      <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${selectedClient === client.id ? "rotate-90" : ""}`} />
                    </div>
                  </button>

                  {/* Expanded Care Plan Sections */}
                  {selectedClient === client.id && (
                    <div className="bg-slate-50 border-t border-border/50 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {carePlanSections.map((section) => (
                          <button
                            key={section.key}
                            className="flex items-start gap-3 p-3 rounded-xl bg-white border border-border/50 hover:shadow-sm transition-shadow text-left"
                          >
                            <div className="h-8 w-8 rounded-lg bg-pink-100 flex items-center justify-center shrink-0 mt-0.5">
                              <Heart className="h-4 w-4 text-pink-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm">{section.label}</p>
                              <p className="text-xs text-muted-foreground truncate">{section.description}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 mt-1" />
                          </button>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                        <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors flex items-center gap-1">
                          <Edit className="h-3 w-3" /> Edit Plan
                        </button>
                        <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1">
                          <FileText className="h-3 w-3" /> View Notes
                        </button>
                        <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Schedule Review
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
