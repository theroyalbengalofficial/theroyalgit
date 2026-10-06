import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2, Bot, User, Minimize2, ExternalLink } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: "Greetings. I am your Royal Bengal Concierge. How may I assist your style, shirt sizing, or collection hunt today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build conversation history for context (exclude welcome message)
      const history = newMessages
        .filter((m) => m.id !== 'welcome-1')
        .slice(-8)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmed,
          history: history.slice(0, -1), // previous turns
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      const reply = data.reply || "Thank you for inquiring. Please feel free to explore our tailored hunts.";

      setMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `model-err-${Date.now()}`,
          role: 'model',
          text: "Forgive me, our styling connection encountered a brief delay. Please try asking again in a moment.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "Recommend a shirt for business",
    "What is Boardroom Hunt?",
    "Tell me about Egyptian cotton",
    "How does 2-hour delivery work?",
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Floating Chat Window */}
      {isOpen && (
        <div className="w-[90vw] sm:w-[380px] md:w-[420px] h-[520px] max-h-[80vh] bg-neutral-950/95 backdrop-blur-xl border border-[#F25C05]/60 rounded-2xl shadow-[0_15px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(242,92,5,0.25)] flex flex-col overflow-hidden mb-3.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-black via-neutral-900 to-black border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#F25C05]/20 border border-[#F25C05] flex items-center justify-center text-[#F25C05] shadow-[0_0_12px_rgba(242,92,5,0.4)]">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white flex items-center gap-1.5">
                  <span>Bengal Concierge</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                </h3>
                <p className="text-[10px] text-neutral-400 font-light tracking-wider">AI Executive Styling Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Minimize Concierge"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-[#F25C05] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-6 h-6 rounded-full bg-[#F25C05]/20 border border-[#F25C05]/60 flex items-center justify-center text-[#F25C05] shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-xl px-3.5 py-2.5 shadow-md ${
                    msg.role === 'user'
                      ? 'bg-[#F25C05] text-white rounded-br-none'
                      : 'bg-neutral-900/90 text-neutral-200 border border-white/10 rounded-bl-none whitespace-pre-wrap leading-relaxed'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right font-mono ${
                      msg.role === 'user' ? 'text-white/70' : 'text-neutral-500'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-center text-neutral-400 text-xs italic bg-neutral-900/50 p-2.5 rounded-xl border border-white/5 w-fit">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F25C05]" />
                <span>Concierge is curating recommendations...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompt suggestions (shown if short thread) */}
          {messages.length <= 3 && !isLoading && (
            <div className="px-3 py-1.5 bg-black/60 border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputMessage(prompt);
                    setTimeout(() => handleSendMessage(), 50);
                  }}
                  className="px-2.5 py-1 text-[10px] tracking-wider bg-white/5 hover:bg-[#F25C05]/20 hover:border-[#F25C05]/60 border border-white/10 text-neutral-300 rounded-full whitespace-nowrap transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-black border-t border-white/10 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about fits, fabrics, collections..."
              disabled={isLoading}
              className="flex-1 bg-neutral-900 border border-white/15 focus:border-[#F25C05] text-white text-xs px-3 py-2.5 rounded-xl focus:outline-none placeholder:text-neutral-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 bg-[#F25C05] hover:bg-[#ff6811] disabled:opacity-40 disabled:hover:bg-[#F25C05] text-white rounded-xl transition-all shadow-[0_0_15px_rgba(242,92,5,0.4)] cursor-pointer shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 px-4 py-3 bg-black/90 hover:bg-neutral-950 text-white rounded-full border border-[#F25C05] shadow-[0_4px_25px_rgba(242,92,5,0.45)] hover:shadow-[0_6px_35px_rgba(242,92,5,0.65)] transition-all duration-300 cursor-pointer active:scale-95"
        aria-label="Toggle AI Concierge"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-[#F25C05] flex items-center justify-center text-white shadow-md">
            {isOpen ? <X className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
          </div>
          {!isOpen && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full" />
          )}
        </div>

        <div className="text-left hidden sm:block">
          <span className="block text-[11px] font-bold tracking-[0.18em] uppercase text-white group-hover:text-[#F25C05] transition-colors">
            {isOpen ? 'Close Concierge' : 'AI Concierge'}
          </span>
          <span className="block text-[9px] text-neutral-400 font-light tracking-wider">
            {isOpen ? 'Minimize assistant' : 'Ask Styling & Fits'}
          </span>
        </div>

        {!isOpen && (
          <Sparkles className="w-3.5 h-3.5 text-[#F25C05] animate-pulse hidden sm:block" />
        )}
      </button>
    </div>
  );
};

export default AIChatbot;
