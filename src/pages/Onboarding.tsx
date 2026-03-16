import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, ChevronRight, ChevronLeft, Heart, Shield,
  Monitor, ClipboardCheck, Sparkles, Loader2, FileText, Eye,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import cartersLogo from "@/assets/Carters-Logo.png";

const STEPS = [
  { key: "welcome", label: "Welcome", icon: Heart },
  { key: "policies", label: "Policies", icon: Shield },
  { key: "system", label: "System Guide", icon: Monitor },
  { key: "checklist", label: "Checklist", icon: ClipboardCheck },
] as const;

export default function Onboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);

  const { data: staffId } = useQuery({
    queryKey: ["my-staff-id-onboarding", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("staff_id").eq("user_id", user.id).single();
      return data?.staff_id || null;
    },
    enabled: !!user,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["onboarding-tasks", staffId],
    queryFn: async () => {
      if (!staffId) return [];
      const { data, error } = await supabase.from("onboarding_tasks").select("*").eq("staff_id", staffId).order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!staffId,
  });

  const { data: policies = [] } = useQuery({
    queryKey: ["published-policies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("policies").select("*").eq("status", "published").order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: acknowledgements = [] } = useQuery({
    queryKey: ["my-acknowledgements", staffId],
    queryFn: async () => {
      if (!staffId) return [];
      const { data, error } = await supabase.from("policy_acknowledgements").select("policy_id").eq("staff_id", staffId);
      if (error) throw error;
      return data.map((a: any) => a.policy_id);
    },
    enabled: !!staffId,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (policyId: string) => {
      if (!staffId) throw new Error("No staff record linked");
      const { error } = await supabase.from("policy_acknowledgements").insert({
        staff_id: staffId,
        policy_id: policyId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Policy acknowledged");
      queryClient.invalidateQueries({ queryKey: ["my-acknowledgements"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const completedTasks = tasks.filter((t: any) => t.status === "completed" || t.status === "verified").length;
  const totalTasks = tasks.length;
  const unacknowledgedPolicies = policies.filter((p: any) => p.requires_acknowledgement && !acknowledgements.includes(p.id));
  const allDone = totalTasks > 0 && completedTasks === totalTasks && unacknowledgedPolicies.length === 0;

  return (
    <AppLayout title="Staff Onboarding">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const active = i === currentStep;
            return (
              <button
                key={s.key}
                onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-secondary/50"
                }`}
              >
                <s.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            );
          })}
          <div className="flex-1" />
          {totalTasks > 0 && (
            <span className="text-xs text-muted-foreground">{completedTasks}/{totalTasks} tasks</span>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {currentStep === 0 && <WelcomeStep />}
            {currentStep === 1 && (
              <PoliciesStep
                policies={policies}
                acknowledgements={acknowledgements}
                onAcknowledge={(id: string) => acknowledgeMutation.mutate(id)}
                isPending={acknowledgeMutation.isPending}
              />
            )}
            {currentStep === 2 && <SystemStep />}
            {currentStep === 3 && <ChecklistStep tasks={tasks} loading={tasksLoading} staffId={staffId} />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="h-9 px-4 rounded-lg border text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-30 flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          {allDone && (
            <div className="flex items-center gap-2 text-sm font-medium text-success">
              <Sparkles className="h-4 w-4" /> Onboarding Complete!
            </div>
          )}
          <button
            onClick={() => setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))}
            disabled={currentStep === STEPS.length - 1}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-30"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-card p-6 shadow-card border border-border/50 space-y-4">
      <h3 className="text-base font-semibold text-card-foreground">{title}</h3>
      {children}
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-card p-8 shadow-card border border-border/50 text-center space-y-4">
        <img src={cartersLogo} alt="Carters Care Group" className="h-16 mx-auto" />
        <h2 className="text-xl font-bold text-card-foreground">Welcome to Carters Care Group</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          We're thrilled to have you join our team. At Carters Care Group, we are dedicated to providing exceptional support to our NDIS and Aged Care clients across the community.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Our Mission">
          <p className="text-sm text-muted-foreground leading-relaxed">
            To empower individuals with disability and older Australians to live their best lives through person-centred, high-quality care and support services.
          </p>
        </SectionCard>
        <SectionCard title="Our Values">
          <ul className="space-y-2 text-sm text-muted-foreground">
            {["Dignity & Respect — Every person deserves to be treated with kindness",
              "Safety First — We never compromise on the safety of our clients or staff",
              "Accountability — We take ownership of our actions and responsibilities",
              "Team Spirit — We support each other and grow together",
            ].map((v, i) => (
              <li key={i} className="flex items-start gap-2"><Heart className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span>{v}</span></li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="Your Role">
          <p className="text-sm text-muted-foreground leading-relaxed">
            As a support worker, you'll be the primary point of contact for clients in their homes and community. You'll assist with daily living, personal care, community access, and skill development.
          </p>
        </SectionCard>
        <SectionCard title="Who to Contact">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><strong className="text-card-foreground">Rostering:</strong> For shift changes, availability, or swaps</li>
            <li><strong className="text-card-foreground">Coordinator:</strong> For client concerns, care plan questions</li>
            <li><strong className="text-card-foreground">HR / Admin:</strong> For payroll, leave, compliance documents</li>
            <li><strong className="text-card-foreground">Emergency:</strong> Call 000 for life-threatening situations</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

function PoliciesStep({ policies, acknowledgements, onAcknowledge, isPending }: {
  policies: any[];
  acknowledgements: string[];
  onAcknowledge: (id: string) => void;
  isPending: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <SectionCard title="Organisational Policies">
        <p className="text-sm text-muted-foreground">
          Read and acknowledge each policy below. You must acknowledge all policies before accepting service requests.
        </p>
      </SectionCard>
      {policies.length === 0 ? (
        <div className="rounded-xl bg-card p-8 shadow-card border border-border/50 text-center">
          <p className="text-sm text-muted-foreground">No policies published yet.</p>
        </div>
      ) : (
        policies.map((p: any) => {
          const acked = acknowledgements.includes(p.id);
          const expanded = expandedId === p.id;
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl bg-card p-5 shadow-card border ${acked ? "border-success/30" : "border-border/50"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${acked ? "bg-success/10" : "bg-primary/10"}`}>
                    {acked ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Shield className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-card-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{p.policy_category.replace(/_/g, " ")} · v{p.version}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setExpandedId(expanded ? null : p.id)}
                    className="h-7 px-2.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {expanded ? "Hide" : "Read"}
                  </button>
                  {!acked && (
                    <button onClick={() => onAcknowledge(p.id)} disabled={isPending}
                      className="h-7 px-3 rounded bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                      Acknowledge
                    </button>
                  )}
                  {acked && <span className="text-xs text-success font-medium">✓ Acknowledged</span>}
                </div>
              </div>
              {expanded && p.content && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{p.content}</p>
                </motion.div>
              )}
            </motion.div>
          );
        })
      )}
    </div>
  );
}

function SystemStep() {
  const modules = [
    { title: "Shift Check-In", desc: "When you arrive at a client's home, use the Check-In page to record your location and start time. Check out when you leave. GPS is captured automatically for compliance." },
    { title: "Timesheets", desc: "Your shifts appear automatically from roster entries. Review your hours weekly and flag any discrepancies to your coordinator before the approval deadline." },
    { title: "Case Notes", desc: "After every shift, write a case note describing the support you provided, any observations, and client mood/wellbeing. These are legal documents — be factual and professional. Case notes are immutable after submission." },
    { title: "Roster", desc: "View your upcoming shifts on the Roster page. Your coordinator will assign shifts. If you need to change availability, contact rostering as early as possible." },
    { title: "Incidents", desc: "Use the Incidents page to report any accidents, near-misses, behavioural events, medication errors, or safeguarding concerns. Include as much detail as possible. Incident reports are immutable." },
    { title: "AI Assistant", desc: "Click the chat bubble in the bottom-right corner to ask questions about policies, procedures, or how to use the system. It's available 24/7." },
  ];
  return (
    <div className="space-y-4">
      <SectionCard title="System Walkthrough">
        <p className="text-sm text-muted-foreground">Here's how to use the key features of the Carters Care platform. Each module is accessible from the sidebar menu.</p>
      </SectionCard>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((m) => (
          <SectionCard key={m.title} title={m.title}>
            <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}

function ChecklistStep({ tasks, loading, staffId }: { tasks: any[]; loading: boolean; staffId: string | null }) {
  if (!staffId) {
    return (
      <div className="rounded-xl bg-card p-12 shadow-card border border-border/50 text-center">
        <p className="text-muted-foreground text-sm">Your account is not linked to a staff record. Contact your administrator.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const completed = tasks.filter((t: any) => t.status === "completed" || t.status === "verified").length;

  return (
    <div className="space-y-4">
      <SectionCard title="Onboarding Checklist">
        <p className="text-sm text-muted-foreground">Complete all items below before your first shift. Your coordinator will verify documents.</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full transition-all ${completed === tasks.length ? "bg-success" : "bg-primary"}`}
              style={{ width: `${tasks.length > 0 ? (completed / tasks.length) * 100 : 0}%` }} />
          </div>
          <span className="text-xs text-muted-foreground font-medium">{completed}/{tasks.length}</span>
        </div>
      </SectionCard>

      {tasks.length === 0 ? (
        <div className="rounded-xl bg-card p-8 shadow-card border border-border/50 text-center">
          <p className="text-sm text-muted-foreground">No onboarding tasks assigned yet. Contact your administrator.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((t: any, i: number) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`rounded-xl bg-card p-4 shadow-card border flex items-center gap-3 ${
                t.status === "verified" ? "border-success/30" : t.status === "completed" ? "border-primary/30" : "border-border/50"
              }`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                t.status === "verified" ? "bg-success/10 text-success" :
                t.status === "completed" ? "bg-primary/10 text-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                {t.status === "verified" || t.status === "completed" ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground">{t.task_name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">
                  {t.task_type} · {t.status === "verified" ? "Verified ✓" : t.status === "completed" ? "Awaiting verification" : "Pending"}
                  {t.completed_at && ` · ${format(new Date(t.completed_at), "d MMM yyyy")}`}
                </p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                t.status === "verified" ? "bg-success/10 text-success" :
                t.status === "completed" ? "bg-warning/10 text-warning" :
                "bg-muted text-muted-foreground"
              }`}>
                {t.status === "verified" ? "Verified" : t.status === "completed" ? "Review" : "Todo"}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
