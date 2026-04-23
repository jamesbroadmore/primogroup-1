import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  GraduationCap, Play, CheckCircle, Clock, Users, BookOpen,
  Award, ChevronRight, ExternalLink, AlertTriangle,
} from "lucide-react";
import { SearchInput, PrimaryButton, EmptyState } from "@/components/ui-kit";
import { Progress } from "@/components/ui/progress";

// Training modules - NDIS and Aged Care
const TRAINING_MODULES = [
  {
    category: "NDIS Worker Training",
    modules: [
      { id: "ndis-orientation", title: "NDIS Orientation", duration: "45 mins", required: true },
      { id: "ndis-practice-standards", title: "NDIS Practice Standards", duration: "1.5 hrs", required: true },
      { id: "ndis-code-conduct", title: "NDIS Code of Conduct", duration: "30 mins", required: true },
      { id: "ndis-rights-responsibilities", title: "Rights & Responsibilities", duration: "45 mins", required: true },
      { id: "ndis-person-centred", title: "Person-Centred Care", duration: "1 hr", required: true },
      { id: "ndis-risk-management", title: "Risk Management", duration: "45 mins", required: false },
      { id: "ndis-documentation", title: "Documentation Requirements", duration: "30 mins", required: false },
    ],
  },
  {
    category: "Aged Care Training",
    modules: [
      { id: "ac-dementia", title: "Understanding Dementia", duration: "2 hrs", required: true },
      { id: "ac-parkinsons", title: "Parkinson's Disease Care", duration: "1.5 hrs", required: true },
      { id: "ac-stroke-signs", title: "Signs of Stroke & Heart Attack", duration: "1 hr", required: true },
      { id: "ac-medication", title: "Medication Management", duration: "1 hr", required: true },
      { id: "ac-falls-prevention", title: "Falls Prevention", duration: "45 mins", required: true },
      { id: "ac-nutrition", title: "Nutrition & Hydration", duration: "30 mins", required: false },
      { id: "ac-palliative", title: "Palliative Care Basics", duration: "1 hr", required: false },
    ],
  },
  {
    category: "General Training",
    modules: [
      { id: "gen-manual-handling", title: "Manual Handling", duration: "1 hr", required: true },
      { id: "gen-infection-control", title: "Infection Control", duration: "45 mins", required: true },
      { id: "gen-first-aid", title: "First Aid Refresher", duration: "2 hrs", required: true },
      { id: "gen-fire-safety", title: "Fire Safety", duration: "30 mins", required: true },
      { id: "gen-cultural-safety", title: "Cultural Safety", duration: "1 hr", required: false },
      { id: "gen-mental-health", title: "Mental Health First Aid", duration: "2 hrs", required: false },
    ],
  },
];

export default function StaffTraining() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: staffData = [], isLoading } = useQuery({
    queryKey: ["staff-training"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("status", "active")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  // Mock training completion data (in real app, this would come from database)
  const getTrainingCompletion = (staffId: string) => {
    // Simulate random completion for demo
    const seed = staffId.charCodeAt(0);
    const totalRequired = TRAINING_MODULES.flatMap(c => c.modules).filter(m => m.required).length;
    const completed = Math.floor((seed % 10) / 10 * totalRequired);
    return { completed, total: totalRequired, percentage: Math.round((completed / totalRequired) * 100) };
  };

  const totalModules = TRAINING_MODULES.flatMap(c => c.modules).length;
  const requiredModules = TRAINING_MODULES.flatMap(c => c.modules).filter(m => m.required).length;

  return (
    <AppLayout title="Training Modules">
      <div className="space-y-5">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-purple">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{totalModules}</p>
              <p className="text-xs text-muted-foreground">Total Modules</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-orange">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{requiredModules}</p>
              <p className="text-xs text-muted-foreground">Required</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-blue">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{staffData.length}</p>
              <p className="text-xs text-muted-foreground">Staff Members</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-green">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">3</p>
              <p className="text-xs text-muted-foreground">Categories</p>
            </div>
          </motion.div>
        </div>

        {/* Training Modules by Category */}
        <div className="space-y-4">
          {TRAINING_MODULES.map((category, idx) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setSelectedCategory(selectedCategory === category.category ? null : category.category)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm"
                    style={{
                      background: idx === 0 
                        ? "linear-gradient(135deg, #a78bfa, #8b5cf6)" 
                        : idx === 1 
                          ? "linear-gradient(135deg, #2dd4bf, #14b8a6)"
                          : "linear-gradient(135deg, #60a5fa, #3b82f6)"
                    }}
                  >
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{category.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {category.modules.length} modules • {category.modules.filter(m => m.required).length} required
                    </p>
                  </div>
                </div>
                <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${selectedCategory === category.category ? "rotate-90" : ""}`} />
              </button>

              {selectedCategory === category.category && (
                <div className="border-t border-border/50">
                  <div className="divide-y divide-border/30">
                    {category.modules.map((module) => (
                      <div
                        key={module.id}
                        className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Play className="h-4 w-4 text-slate-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground text-sm">{module.title}</p>
                              {module.required && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                                  Required
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{module.duration}</p>
                          </div>
                        </div>
                        <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors flex items-center gap-1">
                          Launch <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Staff Training Progress */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h3 className="font-semibold text-foreground">Staff Training Progress</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Required training completion by staff member</p>
          </div>

          <div className="divide-y divide-border/30">
            {staffData.slice(0, 10).map((staff: any) => {
              const progress = getTrainingCompletion(staff.id);
              return (
                <div key={staff.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
                    >
                      {staff.first_name?.[0]}{staff.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {staff.preferred_name || staff.first_name} {staff.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{staff.role || "Support Worker"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <Progress value={progress.percentage} className="h-2" />
                    </div>
                    <span className={`text-xs font-semibold ${progress.percentage === 100 ? "text-emerald-600" : "text-slate-500"}`}>
                      {progress.completed}/{progress.total}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
