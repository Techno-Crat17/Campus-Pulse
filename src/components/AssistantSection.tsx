import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, MapPin, UserCheck, AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import { BUILDINGS_DATA, FACULTY_DATA, SAMPLE_SUGGESTIONS } from '../data/campusData';
import type { Building, Faculty } from '../data/campusData';

interface AssistantSectionProps {
  onNavigateToMapWithBuilding?: (buildingId: string) => void;
  onNavigateToReportIssue?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  relatedBuilding?: Building;
  relatedFaculty?: Faculty;
  actionButtons?: {
    label: string;
    action: () => void;
    icon?: React.ReactNode;
  }[];
}

export const AssistantSection: React.FC<AssistantSectionProps> = ({
  onNavigateToMapWithBuilding,
  onNavigateToReportIssue
}) => {
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `Welcome to Campus Pulse AI Intelligence. Ask me anything about real-time study spots, occupancy levels, building locations, faculty office hours, or facility reports.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const processUserQuery = (userQueryText: string) => {
    const text = userQueryText.trim();
    if (!text) return;

    const userMsgId = 'msg-' + Date.now();
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let responseText = '';
      let targetBuilding: Building | undefined;
      let targetFaculty: Faculty | undefined;
      let actionButtons: ChatMessage['actionButtons'] = [];

      if (lower.includes('study') || lower.includes('where can i study') || lower.includes('quiet')) {
        targetBuilding = BUILDINGS_DATA.find((b) => b.id === 'ise-lab-2') || BUILDINGS_DATA[0];
        responseText = `ISE Lab 2 is currently 20% occupied and approximately 3 minutes away (Quiet soundscape). The Main Library is currently 85% occupied (Crowded). Computer Lab 3 is 42% occupied.`;
        actionButtons = [
          {
            label: 'VIEW ON MAP',
            icon: <MapPin className="w-3.5 h-3.5" />,
            action: () => onNavigateToMapWithBuilding?.('ise-lab-2')
          }
        ];
      } else if (lower.includes('library') || lower.includes('crowded')) {
        const lib = BUILDINGS_DATA.find((b) => b.id === 'library');
        targetBuilding = lib;
        responseText = `The Main Library is currently 85% occupied (Crowded). 1st-3rd floors are nearly full, but the 4th Floor Thesis Alcoves still have 8 available quiet pods. Alternatively, ISE Lab 2 is only 20% occupied and 3 minutes away.`;
        actionButtons = [
          {
            label: 'VIEW ON MAP',
            icon: <MapPin className="w-3.5 h-3.5" />,
            action: () => onNavigateToMapWithBuilding?.('library')
          },
          {
            label: 'RECOMMEND ALTERNATIVE',
            icon: <Sparkles className="w-3.5 h-3.5" />,
            action: () => onNavigateToMapWithBuilding?.('ise-lab-2')
          }
        ];
      } else if (lower.includes('ise lab 2') || lower.includes('ise lab')) {
        targetBuilding = BUILDINGS_DATA.find((b) => b.id === 'ise-lab-2');
        responseText = `ISE Lab 2 is located on the 2nd Floor of the Innovation Block. Current live status: 20% occupied (8 out of 40 workstations taken). Walk time: ~3 minutes (220 meters). Note: 1 issue reported for overhead projector HDMI console.`;
        actionButtons = [
          {
            label: 'VIEW ON MAP',
            icon: <MapPin className="w-3.5 h-3.5" />,
            action: () => onNavigateToMapWithBuilding?.('ise-lab-2')
          }
        ];
      } else if (lower.includes('xyz') || lower.includes('professor') || lower.includes('faculty')) {
        targetFaculty = FACULTY_DATA.find((f) => f.id === 'fac-1');
        responseText = `Dr. XYZ (Dept of Information Science) is currently AVAILABLE in Room B-204 (Faculty Block B). Available until 4:30 PM. Office hours: 2:00 PM - 5:00 PM.`;
        actionButtons = [
          {
            label: 'VIEW ON MAP',
            icon: <MapPin className="w-3.5 h-3.5" />,
            action: () => onNavigateToMapWithBuilding?.('faculty-block-b')
          },
          {
            label: 'VIEW FACULTY PROFILE',
            icon: <UserCheck className="w-3.5 h-3.5" />,
            action: () => onNavigateToMapWithBuilding?.('faculty-block-b')
          }
        ];
      } else if (lower.includes('issue') || lower.includes('broken') || lower.includes('report')) {
        responseText = `You can instantly submit photo & location reports for broken projectors, AC leaks, or Wi-Fi drops. Tech teams receive live alerts. Would you like to launch the issue reporter now?`;
        actionButtons = [
          {
            label: 'REPORT AN ISSUE NOW',
            icon: <AlertTriangle className="w-3.5 h-3.5" />,
            action: () => onNavigateToReportIssue?.()
          }
        ];
      } else {
        responseText = `Based on live campus telemetry: Average campus occupancy is 52%. ISE Lab 2 (20% busy) and Computer Lab 3 (42% busy) are recommended for study right now. Faculty Block B has 2 professors currently available for consultation.`;
        actionButtons = [
          {
            label: 'EXPLORE LIVE MAP',
            icon: <MapPin className="w-3.5 h-3.5" />,
            action: () => onNavigateToMapWithBuilding?.('ise-lab-2')
          }
        ];
      }

      const assistantMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        relatedBuilding: targetBuilding,
        relatedFaculty: targetFaculty,
        actionButtons
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 font-mono text-xs text-blue-400 uppercase tracking-widest px-3 py-1 border border-blue-500/20 bg-blue-950/20">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>REAL-TIME AI CONVERSATIONAL OPERATING SYSTEM</span>
        </div>
        <h2 className="font-syne text-5xl sm:text-7xl font-extrabold uppercase tracking-tighter text-white">
          ASK YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">CAMPUS.</span>
        </h2>
        <p className="text-slate-400 text-sm max-w-xl font-light">
          Query live occupancy, quiet study spots, faculty office locations, or report broken equipment in plain English.
        </p>
      </div>

      {/* Main Chat Container */}
      <div className="glass-panel border-white/10 overflow-hidden flex flex-col h-[600px] shadow-2xl relative">
        
        {/* Chat Header Bar */}
        <div className="px-6 py-4 border-b border-white/10 bg-[#070b19] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-400/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="font-syne font-bold text-sm text-white flex items-center gap-2">
                CAMPUS PULSE INTELLIGENCE
                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                  ONLINE
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                CONTEXT ENGINE: Real-Time Sensor Stream #449
              </div>
            </div>
          </div>
          <button 
            onClick={() => setMessages([messages[0]])}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 text-xs font-mono flex items-center gap-1"
            title="Reset Conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RESET</span>
          </button>
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#040711]/90 bg-dots-pattern">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="text-[10px] font-mono text-slate-500 mb-1 px-1">
                {msg.sender === 'user' ? 'YOU' : 'CAMPUS PULSE AI'} • {msg.timestamp}
              </div>

              <div
                className={`max-w-2xl p-5 border text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600/20 border-blue-500/50 text-white rounded-none shadow-[0_0_15px_rgba(0,102,255,0.15)] font-sans'
                    : 'bg-[#0a1022] border-white/15 text-slate-200 rounded-none shadow-xl font-mono'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {msg.relatedBuilding && (
                  <div className="mt-4 p-3 bg-black/40 border border-cyan-500/30 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-syne font-bold text-white text-sm">
                        {msg.relatedBuilding.name}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {msg.relatedBuilding.floor} • {msg.relatedBuilding.noiseLevel} Soundscape
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold font-mono">
                        {msg.relatedBuilding.occupancy}% OCCUPIED
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {msg.relatedBuilding.walkTimeMinutes} MIN WALK ({msg.relatedBuilding.distanceMeters}m)
                      </div>
                    </div>
                  </div>
                )}

                {msg.actionButtons && msg.actionButtons.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                    {msg.actionButtons.map((btn, idx) => (
                      <button
                        key={idx}
                        onClick={btn.action}
                        className="px-3 py-1.5 bg-blue-600/30 border border-cyan-400/50 hover:bg-blue-600 hover:border-cyan-300 text-cyan-300 hover:text-white text-xs font-mono tracking-wider flex items-center gap-2 transition-all"
                      >
                        {btn.icon}
                        <span>{btn.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-[#0a1022] border border-cyan-500/30 p-4 max-w-xs">
              <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
              <span>Analysing campus telemetry sensors...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#070c1e] flex items-center gap-2 overflow-x-auto text-xs font-mono scrollbar-none">
          <span className="text-slate-500 uppercase flex items-center gap-1 shrink-0 text-[10px]">
            <Zap className="w-3 h-3 text-cyan-400" /> TRY:
          </span>
          {SAMPLE_SUGGESTIONS.map((sug, i) => (
            <button
              key={i}
              onClick={() => processUserQuery(sug)}
              className="shrink-0 px-3 py-1 bg-white/5 border border-white/10 hover:border-cyan-400/50 hover:text-cyan-300 text-slate-300 text-xs transition-colors"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            processUserQuery(query);
          }}
          className="p-4 bg-[#060913] border-t border-white/15 flex items-center gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='“Where can I study right now?”'
              className="w-full bg-[#0b1021] border border-white/20 px-5 py-4 text-base sm:text-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-sans tracking-wide transition-all"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 hidden sm:block">
              PRESS ENTER ↵
            </div>
          </div>

          <button
            type="submit"
            disabled={!query.trim() || isTyping}
            className="px-6 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-mono font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(0,102,255,0.3)] shrink-0"
          >
            <span>SEND</span>
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </section>
  );
};
