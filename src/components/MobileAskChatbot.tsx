import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  MapPin,
  Copy,
  Check,
  RotateCcw,
  Loader2,
  ArrowRight,
  Phone
} from 'lucide-react';
import { useTimeContext } from '../context/TimeContext';
import { processCampusAiQuery } from '../data/campusAiEngine';
import type { CampusAiContext, CampusAiResult } from '../data/campusAiEngine';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  result?: CampusAiResult;
  timestamp: number;
}

const QUICK_PROMPTS = [
  'Where is Dr. Yogish H K?',
  'Which library is least crowded?',
  'Where is AB-403?',
  'Show ISE faculty',
  'What clubs are available?',
  'Where is LHC-204?'
];

export const MobileAskChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const { simulatedTime } = useTimeContext();
  const navigate = useNavigate();

  const aiContextRef = useRef<CampusAiContext>({ history: [] });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // Auto scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isProcessing]);

  // Lock body scroll when mobile chat panel is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Focus input field when opened
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);

      return () => {
        document.body.style.overflow = originalOverflow;
        clearTimeout(timer);
      };
    } else {
      // Return focus to trigger button when closed
      triggerButtonRef.current?.focus();
    }
  }, [isOpen]);

  // Keyboard accessibility: Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleClearConversation = () => {
    setMessages([]);
    aiContextRef.current = { history: [] };
    setInputQuery('');
    inputRef.current?.focus();
  };

  const handleSendQuery = async (queryText: string) => {
    const text = queryText.trim();
    if (!text || isProcessing) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    try {
      const result = await processCampusAiQuery(text, simulatedTime, aiContextRef.current);
      if (result.contextUpdated) {
        aiContextRef.current = result.contextUpdated;
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: result.responseText,
        result,
        timestamp: Date.now()
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('[MobileAskChatbot] Query error:', err);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text: "I couldn't process that query right now. Please try again.",
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewOnMap = (targetId?: string) => {
    setIsOpen(false);
    if (targetId) {
      navigate(`/map?building=${targetId}`);
    } else {
      navigate('/map');
    }
  };

  return (
    <>
      {/* 1. Floating Action Button (Mobile & Tablet Viewports Only, Hidden on Desktop) */}
      {!isOpen && (
        <aside aria-label="Campus Chatbot Trigger" className="fixed bottom-6 right-4 sm:bottom-8 sm:right-6 z-40 lg:hidden pointer-events-auto">
          <button
            ref={triggerButtonRef}
            onClick={() => setIsOpen(true)}
            aria-label="Ask Campus"
            title="Ask Campus • AI Assistant"
            className="group flex items-center gap-2.5 px-4 py-3 bg-[#DC2626] hover:bg-[#B91C1C] active:scale-95 text-white shadow-xl shadow-red-900/30 border border-white/20 rounded-full font-mono text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:ring-offset-2 dark:focus:ring-offset-[#0E0F12]"
            style={{
              marginBottom: 'env(safe-area-inset-bottom, 0px)',
              marginRight: 'env(safe-area-inset-right, 0px)'
            }}
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
            <span className="font-syne font-extrabold tracking-tight">Ask Campus</span>
          </button>
        </aside>
      )}

      {/* 2. Slide-up Fullscreen Mobile Chatbot Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Ask Campus Assistant"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-0 z-[100] flex flex-col bg-[#F5F4EF] dark:bg-[#0E0F12] text-[#111111] dark:text-[#F3F3EE] lg:hidden overflow-hidden"
          >
            {/* Header */}
            <header className="shrink-0 flex items-center justify-between px-4 py-3.5 bg-[#F5F4EF]/95 dark:bg-[#0E0F12]/95 backdrop-blur-md border-b border-black/10 dark:border-white/10 select-none">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0A0A0A] border border-black/15 dark:border-white/15 flex items-center justify-center text-[#DC2626]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-syne font-extrabold text-sm uppercase tracking-tight text-[#111111] dark:text-[#F3F3EE]">
                      ASK CAMPUS
                    </h2>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="font-mono text-[10px] text-[#666660] dark:text-gray-400 tracking-wider uppercase">
                    AI ASSISTANT // REAL-TIME
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {messages.length > 0 && (
                  <button
                    onClick={handleClearConversation}
                    aria-label="Reset conversation"
                    title="Reset conversation"
                    className="p-2 text-[#666660] dark:text-gray-400 hover:text-[#DC2626] dark:hover:text-[#DC2626] rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close Ask Campus chatbot"
                  title="Close"
                  className="p-2 text-[#111111] dark:text-[#F3F3EE] hover:text-[#DC2626] dark:hover:text-[#DC2626] rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Scrollable Messages Container */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Initial State / Welcome Prompt */}
              {messages.length === 0 && (
                <div className="space-y-6 pt-2 pb-4">
                  <div className="p-4 rounded-xl bg-white dark:bg-[#16181D] border border-black/10 dark:border-white/10 shadow-xs space-y-2.5">
                    <div className="flex items-center gap-2 text-[#DC2626] font-mono text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>HOW CAN I HELP YOU?</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#444440] dark:text-gray-300 leading-relaxed font-sans">
                      Ask about faculty cabins & schedules, classroom locations, library occupancy, clubs, issues, or emergency contacts across Ramaiah Institute of Technology.
                    </p>
                  </div>

                  {/* Quick Starter Chips */}
                  <div className="space-y-2">
                    <span className="font-mono text-[11px] text-[#666660] dark:text-gray-400 font-bold uppercase tracking-wider block">
                      SUGGESTED QUERIES:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => handleSendQuery(prompt)}
                          className="px-3 py-1.5 bg-white dark:bg-[#16181D] hover:bg-[#DC2626]/10 dark:hover:bg-[#DC2626]/20 border border-black/10 dark:border-white/10 hover:border-[#DC2626] rounded-full text-xs text-[#111111] dark:text-[#F3F3EE] transition-all text-left cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{prompt}</span>
                          <ArrowRight className="w-3 h-3 text-[#DC2626] shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Render Chat Messages */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* User Message */}
                  {msg.role === 'user' && (
                    <div className="bg-[#DC2626] text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-xs sm:text-sm font-sans shadow-sm max-w-[85%] leading-relaxed">
                      {msg.text}
                    </div>
                  )}

                  {/* Assistant Message */}
                  {msg.role === 'assistant' && (
                    <div className="bg-white dark:bg-[#16181D] border border-black/10 dark:border-white/10 rounded-2xl rounded-tl-xs p-3.5 sm:p-4 text-xs sm:text-sm font-sans shadow-xs max-w-[92%] space-y-3 leading-relaxed">
                      {/* Message Text formatted */}
                      <div className="whitespace-pre-wrap text-[#111111] dark:text-[#F3F3EE] space-y-1">
                        {msg.text.split('\n').map((line, idx) => {
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return (
                              <div key={idx} className="font-bold text-[#111111] dark:text-white text-sm sm:text-base">
                                {line.replace(/\*\*/g, '')}
                              </div>
                            );
                          }
                          if (line.startsWith('• ') || line.startsWith('- ')) {
                            return (
                              <div key={idx} className="pl-2 flex items-start gap-1.5 text-xs sm:text-sm">
                                <span className="text-[#DC2626] font-bold">•</span>
                                <span>{line.replace(/^[•-]\s+/, '').replace(/\*\*(.*?)\*\*/g, '$1')}</span>
                              </div>
                            );
                          }
                          return (
                            <div key={idx} className="text-xs sm:text-sm">
                              {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                            </div>
                          );
                        })}
                      </div>

                      {/* Context Action Buttons */}
                      {msg.result && (
                        <div className="pt-2 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center gap-2">
                          {/* 1. View on Map Action */}
                          {msg.result.actionTargetId && (
                            <button
                              onClick={() => handleViewOnMap(msg.result?.actionTargetId)}
                              className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-lg text-[11px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>VIEW ON MAP →</span>
                            </button>
                          )}

                          {/* 2. Copy Email Action */}
                          {msg.result.matchedFaculty?.email && (
                            <button
                              onClick={() => handleCopy(msg.result?.matchedFaculty?.email || '')}
                              className="px-2.5 py-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 rounded-lg text-[11px] font-mono text-[#111111] dark:text-[#F3F3EE] flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              {copiedEmail === msg.result.matchedFaculty.email ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-500 font-bold">COPIED</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-[#DC2626]" />
                                  <span>COPY EMAIL</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* 3. Emergency Contacts Call Button */}
                          {msg.result.matchedEmergencyContacts && msg.result.matchedEmergencyContacts.length > 0 && (
                            <a
                              href={`tel:${msg.result.matchedEmergencyContacts[0].phone}`}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-xs"
                            >
                              <Phone className="w-3 h-3" />
                              <span>CALL {msg.result.matchedEmergencyContacts[0].phone}</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Thinking / Searching indicator */}
              {isProcessing && (
                <div className="flex items-start">
                  <div className="bg-white dark:bg-[#16181D] border border-black/10 dark:border-white/10 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#DC2626]" />
                    <span className="font-mono text-xs text-[#666660] dark:text-gray-400 font-bold uppercase tracking-wider">
                      Searching campus database...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuery(inputQuery);
              }}
              className="shrink-0 p-3 sm:p-4 bg-[#F5F4EF] dark:bg-[#0E0F12] border-t border-black/10 dark:border-white/10"
              style={{
                paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))'
              }}
            >
              <div className="flex items-center gap-2 bg-white dark:bg-[#16181D] border border-black/15 dark:border-white/15 focus-within:border-[#DC2626] dark:focus-within:border-[#DC2626] rounded-full px-3.5 py-1.5 shadow-xs transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask something about campus..."
                  className="flex-1 bg-transparent text-xs sm:text-sm text-[#111111] dark:text-[#F3F3EE] placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none px-1 py-1 font-sans"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isProcessing}
                  aria-label="Send query"
                  className="w-8 h-8 rounded-full bg-[#DC2626] disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shrink-0 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
