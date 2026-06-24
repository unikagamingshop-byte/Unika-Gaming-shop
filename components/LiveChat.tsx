
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { ChatMessage } from '../types';

const LiveChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [leadInfo, setLeadInfo] = useState({ name: '', email: '' });
  const location = useLocation();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      const u = dataService.getCurrentUser();
      if (u) {
        setLeadInfo({ name: u.name, email: u.email });
        setIsFormSubmitted(true);
      }
    }
  }, [location, isOpen]);

  // Heartbeat Polling: Pulls admin replies from Google Sheets every 2 seconds
  useEffect(() => {
    const fetchHistory = async () => {
      if (!isFormSubmitted || !isOpen) return;
      
      // Force sync with server
      const success = await dataService.fetchInitialData();
      if (!success) return;
      
      const history = dataService.getChats();
      const userEmail = leadInfo.email.toLowerCase().trim();
      
      // Filter for messages belonging to THIS user (including admin replies sent to them)
      const filtered = history.filter(h => h.userId.toLowerCase().trim() === userEmail);
      
      // Only update state if there are actually new messages
      if (filtered.length !== messages.length) {
        setMessages(filtered);
      }
    };

    if (isOpen && isFormSubmitted) {
      fetchHistory();
      const interval = setInterval(fetchHistory, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen, isFormSubmitted, leadInfo.email, messages.length]);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-ai-chat', handleOpenChat);
    return () => window.removeEventListener('open-ai-chat', handleOpenChat);
  }, []);

  // Automatic scrolling to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping, isFormSubmitted]);

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (leadInfo.name && leadInfo.email) {
      setIsFormSubmitted(true);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessageText = input;
    setInput('');
    
    const userMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      userId: leadInfo.email,
      userName: leadInfo.name,
      role: 'user',
      text: userMessageText,
      timestamp: new Date().toISOString()
    };

    // Optimistic update for UI speed
    setMessages(prev => [...prev, userMsg]);
    await dataService.saveChatMessage(userMsg);
    
    // Show typing for bot acknowledgement
    setIsTyping(true);

    setTimeout(async () => {
      const botResponse: ChatMessage = {
        id: `bot-${Date.now()}`,
        userId: leadInfo.email,
        userName: 'Support Bot',
        role: 'bot',
        text: `Thanks for your message, ${leadInfo.name.split(' ')[0]}! Our agents have been notified. We usually reply within 2 minutes. For urgent issues, call 01410537867.`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botResponse]);
      await dataService.saveChatMessage(botResponse);
      setIsTyping(false);
    }, 2000); 
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[550px] bg-slate-900 border border-slate-800 rounded-[32px] shadow-3xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-indigo-600 p-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994-.586.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-indigo-600 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-white font-black text-sm tracking-tight">Unika Live Support</h3>
                <p className="text-indigo-100 text-[9px] uppercase font-black tracking-widest flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></span>
                  Avg. Response 2s
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 text-white/80 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {!isFormSubmitted ? (
            <div className="flex-grow flex flex-col items-center justify-center p-10 space-y-8 text-center">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-[24px] flex items-center justify-center text-indigo-400">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
              </div>
              <div className="space-y-2">
                <h4 className="text-white font-black text-xl">Start Support Chat</h4>
                <p className="text-slate-500 text-sm font-medium">Please verify your identity to connect with an agent.</p>
              </div>
              <form onSubmit={handleLeadSubmit} className="w-full space-y-4">
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={leadInfo.name}
                  onChange={(e) => setLeadInfo({ ...leadInfo, name: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <input
                  type="email"
                  required
                  placeholder="Your Email"
                  value={leadInfo.email}
                  onChange={(e) => setLeadInfo({ ...leadInfo, email: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                >
                  CONNECT NOW
                </button>
              </form>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-6 scroll-smooth bg-slate-950/20">
                <div className="flex justify-start">
                  <div className="max-w-[85%] px-5 py-4 rounded-3xl text-sm leading-relaxed bg-slate-800 text-slate-200 rounded-tl-none border border-slate-800 shadow-lg">
                    👋 Hello! Welcome to Unika Support. How can we help you today?
                  </div>
                </div>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-5 py-4 rounded-3xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-xl' 
                        : msg.role === 'admin'
                          ? 'bg-emerald-600 text-white rounded-tl-none shadow-xl'
                          : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-800'
                    }`}>
                      {msg.text}
                      <p className="text-[8px] mt-2 opacity-50 font-black uppercase tracking-widest text-right">
                        {msg.role === 'user' ? 'You' : msg.role === 'admin' ? 'Agent' : 'System'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 text-slate-200 px-5 py-4 rounded-3xl rounded-tl-none border border-slate-800 shadow-sm">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-900 border-t border-slate-800 shrink-0">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Describe your issue..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-5 pr-14 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-700"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="absolute right-2 top-2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-indigo-500/20 active:scale-90"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-3xl transition-all transform hover:scale-110 active:scale-90 relative ${
          isOpen ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white'
        }`}
      >
        {isOpen ? (
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-[3px] border-slate-950 rounded-full animate-pulse shadow-lg"></span>
          </>
        )}
      </button>
    </div>
  );
};

export default LiveChat;
