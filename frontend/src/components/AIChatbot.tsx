import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2, User } from "lucide-react";
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
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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
            className="fixed bottom-6 right-6 z-50 group"
            data-testid="maureen-chat-trigger"
          >
            <div className="relative">
              {/* Photo */}
              <div className="h-16 w-16 rounded-full overflow-hidden shadow-xl border-4 border-white hover:scale-105 transition-transform">
                <img 
                  src={maureenImg} 
                  alt="Ask Maureen" 
                  className="h-full w-full object-cover"
                />
              </div>
              {/* Online indicator */}
              <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-400 border-2 border-white" />
              {/* Tooltip on hover */}
              <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                Ask Maureen
                <div className="absolute top-full right-4 border-4 border-transparent border-t-slate-800" />
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2.5rem)] h-[540px] max-h-[calc(100vh-2.5rem)] rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
            data-testid="maureen-chat-panel"
          >
            {/* Header with Maureen's photo */}
            <div className="relative">
              <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #a78bfa, #8b5cf6, #60a5fa)" }} />
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {/* Maureen's photo */}
                  <div className="relative">
                    <div className="h-11 w-11 rounded-full overflow-hidden shadow-sm border-2 border-purple-100">
                      <img 
                        src={maureenImg} 
                        alt="Maureen" 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Maureen</p>
                    <div className="flex items-center gap-1">
                      <p className="text-[10px] text-slate-400">Your Care Assistant</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  data-testid="maureen-chat-close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 mt-0.5 shadow-sm border border-purple-100">
                      <img src={maureenImg} alt="Maureen" className="h-full w-full object-cover" />
                    </div>
                    <div className="rounded-2xl rounded-tl-none bg-slate-100 px-3.5 py-2.5 text-sm text-slate-700 max-w-[80%]">
                      G'day! I'm Maureen, your Carters Care assistant. Ask me about policies, procedures, incident reporting, compliance, or anything else work-related. 👋
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-10">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="text-xs px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-600 hover:bg-purple-100 transition-colors font-medium"
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
                      className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
                    >
                      <User className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 mt-0.5 shadow-sm border border-purple-100">
                      <img src={maureenImg} alt="Maureen" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className={`rounded-2xl px-3.5 py-2.5 text-sm max-w-[80%] ${
                    m.role === "user"
                      ? "rounded-tr-none text-white"
                      : "rounded-tl-none bg-slate-100 text-slate-700"
                  }`}
                  style={m.role === "user" ? { background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" } : {}}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
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
                  <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 shadow-sm border border-purple-100">
                    <img src={maureenImg} alt="Maureen" className="h-full w-full object-cover" />
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-slate-100 px-3.5 py-2.5">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0.15s" }} />
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0.3s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="p-3 border-t border-slate-100 flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Maureen anything..."
                disabled={isLoading}
                maxLength={1000}
                className="flex-1 h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 transition-all disabled:opacity-50"
                data-testid="maureen-chat-input"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="h-10 w-10 rounded-xl text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
                style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
                data-testid="maureen-chat-send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
