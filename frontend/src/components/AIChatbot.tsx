import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2, User, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import maureenImg from "@/assets/maureen.png";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || import.meta.env.VITE_SUPABASE_URL + '/functions/v1'}/staff-chat`;

const SUGGESTIONS = [
  "How do I report an incident?",
  "What are NDIS Practice Standards?",
  "Shift check-in process?",
  "When do compliance docs expire?",
];

export function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    let assistantSoFar = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please log in to use the assistant");

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${resp.status})`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Sorry, something went wrong: ${e.message}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

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
      {/* Floating trigger - Maureen's Photo */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 group"
            data-testid="maureen-chat-trigger"
          >
            <div className="relative">
              {/* Photo - larger on desktop */}
              <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-18 md:w-18 lg:h-20 lg:w-20 rounded-full overflow-hidden shadow-xl border-4 border-white hover:scale-105 transition-transform">
                <img 
                  src={maureenImg} 
                  alt="Ask Maureen" 
                  className="h-full w-full object-cover"
                />
              </div>
              {/* Online indicator */}
              <div className="absolute bottom-0 right-0 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-emerald-400 border-2 border-white" />
              {/* Tooltip on hover - hidden on mobile */}
              <div className="hidden sm:block absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                Ask Maureen
                <div className="absolute top-full right-4 border-4 border-transparent border-t-slate-800" />
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
                      G'day! I'm Maureen, your Carters Care assistant. Ask me about policies, procedures, incident reporting, compliance, or anything else work-related. 👋
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-10 sm:pl-11">
                    {SUGGESTIONS.map((s) => (
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
                      <div className="prose prose-sm sm:prose max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}

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
