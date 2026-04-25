import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2, User, Maximize2, Minimize2, Sparkles, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import maureenImg from "@/assets/maureen.png";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || import.meta.env.VITE_SUPABASE_URL + '/functions/v1'}/staff-chat`;

// Role-based quick actions
const WORKER_SUGGESTIONS = [
  "How do I check in for my shift?",
  "How do I submit my timesheet?",
  "How do I write a client note?",
  "What if there's an incident?",
];

const ADMIN_SUGGESTIONS = [
  "How do I approve timesheets?",
  "How do I add a new staff member?",
  "How do I generate an invoice?",
  "How do I manage compliance?",
];

// Helpful hints that rotate
const HELPFUL_HINTS = [
  "💡 Need help? I'm here!",
  "📋 Ask about timesheets",
  "🔔 Got questions? Tap me!",
  "✨ I can help with compliance",
  "📝 Ask about client notes",
];

// Quick help responses for common questions (role-aware)
const QUICK_HELP: Record<string, { worker: string; admin: string; links?: { text: string; url: string }[] }> = {
  "check in": {
    worker: `**Checking in for your shift:**\n\n1. Go to **My Roster** from the sidebar\n2. Find today's shift\n3. Click the **Check In** button\n4. Confirm your location if prompted\n\n✅ You're checked in! Remember to check out when done.`,
    admin: `**Staff Check-ins:**\n\n1. Go to **Roster** to see all shifts\n2. Active check-ins show in the dashboard\n3. Click on a shift to see check-in details\n\n📊 View real-time check-in status from the Dashboard.`,
    links: [{ text: "Go to My Roster", url: "/my-roster" }, { text: "View Dashboard", url: "/" }]
  },
  "timesheet": {
    worker: `**Submitting your timesheet:**\n\n1. Go to **My Timesheets**\n2. Review your hours for the period\n3. Click **Submit for Approval**\n4. Wait for admin approval\n\n💡 Timesheets are auto-generated from your check-ins!`,
    admin: `**Approving timesheets:**\n\n1. Go to **Timesheets**\n2. Filter by "Pending" or "Submitted"\n3. Select timesheets to approve\n4. Click **Approve Selected** or review individually\n\n💰 After approval, you can generate invoices.`,
    links: [{ text: "My Timesheets", url: "/my-timesheets" }, { text: "All Timesheets", url: "/timesheets" }]
  },
  "client note": {
    worker: `**Writing a client note:**\n\n1. Go to **Client Notes** in Daily Workflow\n2. Select the client\n3. Click **Add Note**\n4. Fill in the details and save\n\n📝 Notes help track client progress and care.`,
    admin: `**Managing client notes:**\n\n1. Go to **Client Notes**\n2. Filter by client, date, or staff\n3. Review and approve notes as needed\n\n📋 Export notes for reporting.`,
    links: [{ text: "Client Notes", url: "/clients" }]
  },
  "incident": {
    worker: `**Reporting an incident:**\n\n1. Go to **Incidents** in Daily Workflow\n2. Click **Report Incident**\n3. Select type: Client or Work incident\n4. Fill in all required details\n5. Submit immediately\n\n⚠️ Report all incidents as soon as possible!`,
    admin: `**Managing incidents:**\n\n1. Go to **Incidents**\n2. Review open incidents (shown in red)\n3. Investigate and update status\n4. Close when resolved\n\n📊 Dashboard shows incident alerts.`,
    links: [{ text: "Report Incident", url: "/incidents" }]
  },
  "invoice": {
    worker: `**Invoices:**\n\nInvoices are managed by administrators. Once your timesheet is approved, it can be included in an invoice.\n\n✅ Keep your timesheets up to date!`,
    admin: `**Generating invoices:**\n\n1. Go to **Invoices** in Admin\n2. Click **Generate Invoice**\n3. Select approved timesheets\n4. Set hourly rate\n5. Download CSV invoice\n\n💡 Only approved timesheets can be invoiced.`,
    links: [{ text: "Invoices", url: "/invoices" }, { text: "Timesheets", url: "/timesheets" }]
  },
  "staff": {
    worker: `**Your profile:**\n\nContact your administrator to update your profile details or view your compliance documents in **My Tasks**.`,
    admin: `**Managing staff:**\n\n1. Go to **Staff** in Admin\n2. Click **Add Staff** or click a row to edit\n3. Manage HR docs in **HR & Docs**\n\n📋 Track compliance and certifications.`,
    links: [{ text: "Staff List", url: "/staff" }, { text: "HR & Docs", url: "/staff/hr" }]
  },
  "compliance": {
    worker: `**Your compliance:**\n\nCheck **My Tasks** to see your certifications and expiry dates. Upload documents when requested by admin.`,
    admin: `**Managing compliance:**\n\n1. Go to **HR & Docs**\n2. Expand a staff member\n3. Upload required documents\n4. Track expiry dates\n\n⚠️ Dashboard alerts show expiring documents.`,
    links: [{ text: "HR & Docs", url: "/staff/hr" }]
  },
  "roster": {
    worker: `**Viewing your roster:**\n\n1. Go to **My Roster**\n2. See your upcoming shifts\n3. Check shift details (time, client, location)\n\n📅 Plan ahead with your schedule!`,
    admin: `**Managing the roster:**\n\n1. Go to **Roster**\n2. View all scheduled shifts\n3. Assign staff to shifts\n4. Manage recurring schedules\n\n📊 Dashboard shows active shifts.`,
    links: [{ text: "My Roster", url: "/my-roster" }, { text: "Full Roster", url: "/roster" }]
  },
  "help": {
    worker: `**I'm Maureen, your care assistant!**\n\nI can help you with:\n- 📅 **Roster** - View your shifts\n- ⏰ **Timesheets** - Submit hours\n- 📝 **Notes** - Write client notes\n- ⚠️ **Incidents** - Report issues\n\nJust ask me anything!`,
    admin: `**I'm Maureen, your care assistant!**\n\nAs an admin, I can help with:\n- 👥 **Staff** - Manage team\n- ✅ **Approvals** - Timesheets & docs\n- 💰 **Invoices** - Generate bills\n- 📊 **Reports** - Track everything\n\nJust ask me anything!`,
    links: []
  }
};

// Find matching quick help based on user query
function findQuickHelp(query: string): { response: string; links?: { text: string; url: string }[] } | null {
  const q = query.toLowerCase();
  for (const [key, value] of Object.entries(QUICK_HELP)) {
    if (q.includes(key)) {
      return { response: value.worker, links: value.links }; // Default to worker, will be overridden
    }
  }
  return null;
}

export function AIChatbot({ hasImportantAction = false, urgentMessage = "" }: { hasImportantAction?: boolean; urgentMessage?: string }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [quickLinks, setQuickLinks] = useState<{ text: string; url: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Determine user role - check if admin
  const isAdmin = user?.user_metadata?.role === "admin" || user?.email?.includes("admin");
  const suggestions = isAdmin ? ADMIN_SUGGESTIONS : WORKER_SUGGESTIONS;

  // Aura only glows when there's urgent notification AND user hasn't acknowledged
  const showUrgentGlow = hasImportantAction && !hasAcknowledged;

  // When user opens chat with urgent notification, mark as acknowledged
  useEffect(() => {
    if (open && hasImportantAction && !hasAcknowledged) {
      // Show the urgent message first when opening
      if (urgentMessage && messages.length === 0) {
        setMessages([{ 
          role: "assistant", 
          content: `⚠️ **Attention Required**\n\n${urgentMessage}\n\n---\n\nOnce you've reviewed this, I'm here to help with anything else!`
        }]);
      }
      // Mark as acknowledged after a brief delay (user has seen it)
      const timer = setTimeout(() => {
        setHasAcknowledged(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [open, hasImportantAction, hasAcknowledged, urgentMessage, messages.length]);

  // Reset acknowledged state ONLY when the urgent notification changes (new notification)
  useEffect(() => {
    if (!hasImportantAction) {
      setHasAcknowledged(false);
    }
  }, [hasImportantAction]);

  // Rotate helpful hints
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHint((prev) => (prev + 1) % HELPFUL_HINTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Hide hint after user has seen a few
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 30000); // Hide after 30 seconds
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        if (expanded) {
          setExpanded(false);
        } else {
          setOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, expanded]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setQuickLinks([]);

    // First, try to find a quick help response (instant, no API needed)
    const q = text.toLowerCase();
    let quickHelpFound = false;

    for (const [key, value] of Object.entries(QUICK_HELP)) {
      if (q.includes(key)) {
        const response = isAdmin ? value.admin : value.worker;
        // Simulate typing effect for quick responses
        await new Promise(resolve => setTimeout(resolve, 300));
        setMessages(prev => [...prev, { role: "assistant", content: response }]);
        if (value.links && value.links.length > 0) {
          setQuickLinks(value.links);
        }
        setIsLoading(false);
        quickHelpFound = true;
        break;
      }
    }

    // If no quick help found, provide a helpful fallback
    if (!quickHelpFound) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const fallbackResponse = isAdmin 
        ? `I'm here to help! Here are some things I can assist with:\n\n**Quick Actions:**\n- "How do I approve timesheets?"\n- "How do I add staff?"\n- "How do I generate an invoice?"\n- "How do I manage compliance?"\n\n**Or try:**\n- Check the **Dashboard** for alerts\n- Go to **Staff** to manage your team\n- View **Reports** for insights\n\n💡 Just ask me about any topic!`
        : `I'm here to help! Here are some things I can assist with:\n\n**Quick Actions:**\n- "How do I check in?"\n- "How do I submit my timesheet?"\n- "How do I write a client note?"\n- "What if there's an incident?"\n\n**Or try:**\n- Check **My Roster** for your shifts\n- Go to **My Timesheets** to see hours\n\n💡 Just ask me about any topic!`;
      
      setMessages(prev => [...prev, { role: "assistant", content: fallbackResponse }]);
      setIsLoading(false);
    }
  }, [messages, isLoading, isAdmin]);

  // Dynamic sizing classes based on expanded state and screen size
  const getPanelClasses = () => {
    if (expanded) {
      // Full screen on mobile, large panel on desktop
      return "fixed inset-4 sm:inset-6 md:inset-8 lg:bottom-6 lg:right-6 lg:left-auto lg:top-auto lg:w-[600px] lg:h-[700px] xl:w-[700px] xl:h-[800px]";
    }
    // Default responsive sizes
    return "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] md:w-[480px] lg:w-[520px] h-[70vh] sm:h-[580px] md:h-[620px] lg:h-[680px] max-h-[calc(100vh-2rem)]";
  };

  return (
    <>
      {/* Floating trigger - Maureen's Photo - LARGER & MORE PROMINENT */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 group"
            data-testid="maureen-chat-trigger"
          >
            <div className="relative">
              {/* Glowing aura ring - pulses when important action required, stops after checked */}
              <motion.div 
                className={`absolute -inset-3 rounded-full ${showUrgentGlow ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400' : 'bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400'}`}
                animate={showUrgentGlow ? {
                  scale: [1, 1.15, 1],
                  opacity: [0.6, 0.9, 0.6],
                } : {
                  scale: [1, 1.08, 1],
                  opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                  duration: showUrgentGlow ? 1.2 : 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Secondary glow ring */}
              <motion.div 
                className={`absolute -inset-1.5 rounded-full ${showUrgentGlow ? 'bg-amber-300' : 'bg-purple-300'}`}
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.5, 0.7, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.2,
                }}
              />
              
              {/* Photo container - MUCH LARGER */}
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32 rounded-full overflow-hidden shadow-2xl border-4 border-white hover:scale-105 transition-transform bg-white">
                <img 
                  src={maureenImg} 
                  alt="Ask Maureen" 
                  className="h-full w-full object-cover"
                />
              </div>
              
              {/* Online indicator - larger */}
              <div className={`absolute bottom-1 right-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full border-3 border-white shadow-md ${showUrgentGlow ? 'bg-amber-400' : 'bg-emerald-400'}`}>
                {showUrgentGlow && (
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
              </div>
              
              {/* Helpful hint bubble - rotates through hints */}
              <AnimatePresence>
                {showHint && (
                  <motion.div 
                    initial={{ opacity: 0, x: 10, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 10, scale: 0.9 }}
                    className="absolute bottom-full right-0 mb-3 sm:right-auto sm:left-full sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:ml-3 sm:mb-0"
                  >
                    <motion.div 
                      key={currentHint}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className={`px-4 py-2.5 ${showUrgentGlow ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-purple-600 to-violet-600'} text-white text-sm font-medium rounded-2xl shadow-xl whitespace-nowrap`}
                    >
                      {showUrgentGlow ? "⚠️ Action required!" : HELPFUL_HINTS[currentHint]}
                      {/* Arrow pointer */}
                      <div className={`absolute top-full right-6 sm:top-1/2 sm:right-full sm:-translate-y-1/2 sm:mr-0 border-8 border-transparent`} 
                        style={{ 
                          borderTopColor: showUrgentGlow ? '#f59e0b' : '#9333ea',
                          borderRightColor: 'transparent',
                        }}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* "Ask Maureen" label - always visible */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-800 text-white text-xs font-semibold rounded-full shadow-lg whitespace-nowrap">
                Ask Maureen
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel - responsive sizing */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`${getPanelClasses()} z-50 rounded-2xl sm:rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col overflow-hidden`}
            data-testid="maureen-chat-panel"
          >
            {/* Header with Maureen's photo */}
            <div className="relative shrink-0">
              <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #a78bfa, #8b5cf6, #60a5fa)" }} />
              <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Maureen's photo - responsive */}
                  <div className="relative">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-full overflow-hidden shadow-sm border-2 border-purple-100">
                      <img 
                        src={maureenImg} 
                        alt="Maureen" 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full bg-emerald-400 border-2 border-white" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base lg:text-lg font-bold text-slate-800">Maureen</p>
                    <p className="text-[10px] sm:text-xs text-slate-400">Your Care Assistant</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Expand/Collapse button - hidden on very small screens */}
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="hidden sm:flex h-8 w-8 rounded-xl items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    title={expanded ? "Minimize" : "Maximize"}
                    data-testid="maureen-chat-expand"
                  >
                    {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    data-testid="maureen-chat-close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages - flex-grow to fill available space */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 scrollbar-thin">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden shrink-0 mt-0.5 shadow-sm border border-purple-100">
                      <img src={maureenImg} alt="Maureen" className="h-full w-full object-cover" />
                    </div>
                    <div className="rounded-2xl rounded-tl-none bg-slate-100 px-3 sm:px-4 py-2.5 text-sm sm:text-base text-slate-700 max-w-[85%]">
                      G'day! I'm Maureen, your care assistant. {isAdmin ? "As an admin, I can help you manage staff, approvals, and invoices." : "I can help you with your shifts, timesheets, and client notes."} Just ask! 👋
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-10 sm:pl-11">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-600 hover:bg-purple-100 transition-colors font-medium"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex items-start gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  {m.role === "user" ? (
                    <div
                      className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
                    >
                      <User className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden shrink-0 mt-0.5 shadow-sm border border-purple-100">
                      <img src={maureenImg} alt="Maureen" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className={`rounded-2xl px-3 sm:px-4 py-2.5 text-sm sm:text-base max-w-[85%] ${
                    m.role === "user"
                      ? "rounded-tr-none text-white"
                      : "rounded-tl-none bg-slate-100 text-slate-700"
                  }`}
                  style={m.role === "user" ? { background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" } : {}}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm sm:prose max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_strong]:text-purple-700">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}

              {/* Quick Links after response */}
              {quickLinks.length > 0 && (
                <div className="flex flex-wrap gap-2 pl-10 sm:pl-11 mt-2">
                  {quickLinks.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      onClick={(e) => {
                        e.preventDefault();
                        setOpen(false);
                        window.location.href = link.url;
                      }}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 text-white hover:from-purple-600 hover:to-violet-600 transition-all font-medium shadow-sm"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {link.text}
                    </a>
                  ))}
                </div>
              )}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-start gap-2">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden shrink-0 shadow-sm border border-purple-100">
                    <img src={maureenImg} alt="Maureen" className="h-full w-full object-cover" />
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-slate-100 px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0.15s" }} />
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0.3s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input - responsive padding */}
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="shrink-0 p-2 sm:p-3 border-t border-slate-100 flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Maureen anything..."
                disabled={isLoading}
                maxLength={1000}
                className="flex-1 h-10 sm:h-11 lg:h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 sm:px-4 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 transition-all disabled:opacity-50"
                data-testid="maureen-chat-input"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 rounded-xl text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
                style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
                data-testid="maureen-chat-send"
              >
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
