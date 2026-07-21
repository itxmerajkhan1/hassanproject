/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  ArrowUp, 
  Sparkles, 
  Phone, 
  Laptop,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

export const AtelierConcierge: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [mode, setMode] = useState<'options' | 'chat'>('options');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Monitor scroll for Back to Top and slide effects
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenWidget = () => {
    setIsOpen(true);
    setMode('options');
    // Seed initial message if chat was empty
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'agent',
          text: `Welcome to MK Private Circle, ${user?.displayName || 'distinguished guest'}. I am your personal digital stylist. How may I guide your boutique experience today?`,
          timestamp: new Date()
        }
      ]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Dynamic, bespoke automated stylist responses
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsTyping(false);

    let replyText = "I have recorded your request. Our central backoffice tailors are reviewing this immediately. May I assist with size charts or custom delivery?";
    const query = userMsg.text.toLowerCase();

    if (query.includes('size') || query.includes('fit') || query.includes('measure')) {
      replyText = "We offer bespoke sizing metrics. All outerwear cashmere garments have an elegant structural margin. If you share your height & chest metrics, I can recommend the absolute perfect fit.";
    } else if (query.includes('track') || query.includes('order') || query.includes('where is')) {
      replyText = "To track active shipments, please head over to our dedicated 'Track Order' route at the top navbar. You will find real-time delivery coordinate charts directly linked with DHL Express.";
    } else if (query.includes('return') || query.includes('refund') || query.includes('exchange')) {
      replyText = "Our atelier offers complimentary 14-day return and exchange labels. You can print them directly from your active Order History inside the Profile section.";
    } else if (query.includes('material') || query.includes('fabric') || query.includes('cashmere') || query.includes('silk')) {
      replyText = "We source 100% genuine Heavy Satin Silk (19mm momme count) and Virgin Australian Cashmere. Each yarn is hand-inspected for weight, drape index, and tensile strength.";
    } else if (query.includes('discount') || query.includes('coupon') || query.includes('sale')) {
      replyText = "At MK Fashion, we focus on heirloom quality. While we rarely discount, joining our newsletter unlocks priority lookbook reservations and early private sales access.";
    }

    const agentMsg: Message = {
      id: `msg-reply-${Date.now()}`,
      sender: 'agent',
      text: replyText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, agentMsg]);
  };

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startWhatsAppChat = () => {
    const text = encodeURIComponent(`Hi MK Fashion, I am browsing your luxury boutique and would love assistance with some product collections.`);
    const url = `https://wa.me/18005556532?text=${text}`;
    window.open(url, '_blank');
    toast.success("Redirecting to MK WhatsApp Concierge...");
  };

  const handleCallAtelier = () => {
    window.location.href = 'tel:18005556532';
    toast.success("Initiating secure line to Central Atelier...");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans pointer-events-none">
      
      {/* Back to Top Capsule */}
      {showBackToTop && (
        <button
          id="btn-back-to-top"
          onClick={handleBackToTop}
          className="p-3 rounded-full bg-white text-neutral-900 border border-neutral-100 shadow-xl hover:bg-neutral-50 transition-all duration-300 pointer-events-auto transform hover:-translate-y-1 active:translate-y-0 cursor-pointer"
          title="Back to Top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* Floating Concierge Action Trigger */}
      {!isOpen && (
        <button
          id="btn-open-concierge"
          onClick={handleOpenWidget}
          className="flex items-center gap-2 px-4 py-3.5 rounded-full bg-neutral-950 text-white shadow-2xl hover:bg-black hover:scale-105 active:scale-95 transition-all duration-300 pointer-events-auto cursor-pointer group"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5 text-white" />
            <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-xs font-semibold tracking-widest uppercase text-white/90 pr-1 select-none">Atelier Concierge</span>
        </button>
      )}

      {/* Concierge Widget Panel */}
      {isOpen && (
        <div className="w-[340px] sm:w-[360px] h-[500px] bg-white border border-neutral-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header Panel */}
          <header className="bg-neutral-950 text-white p-5 flex items-center justify-between border-b border-neutral-900">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  <span className="text-sm font-bold tracking-widest text-white">MK</span>
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-neutral-950"></span>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/95">Atelier Concierge</h4>
                <p className="text-[9px] text-emerald-400 flex items-center gap-1 font-mono">
                  <span>● ONLINE</span>
                  <span className="text-white/40">|</span>
                  <span className="text-white/50">Personal Stylist</span>
                </p>
              </div>
            </div>
            
            <button
              id="btn-close-concierge"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-white/80 hover:text-white" />
            </button>
          </header>

          {/* Body Content */}
          <div className="flex-grow flex flex-col min-h-0 bg-neutral-50/50">
            
            {/* Options Mode */}
            {mode === 'options' && (
              <div className="p-6 space-y-6 flex-grow overflow-y-auto">
                <div className="text-center space-y-2 py-2">
                  <Sparkles className="w-5 h-5 text-neutral-800 mx-auto" />
                  <h3 className="text-sm font-bold text-neutral-900">How may we assist you today?</h3>
                  <p className="text-[11px] text-neutral-500 max-w-xs mx-auto leading-relaxed">
                    Choose an entry path to connect with our central private registry desk. Our average response speed is instant.
                  </p>
                </div>

                <div className="space-y-2.5">
                  
                  {/* WhatsApp Option */}
                  <button
                    id="opt-whatsapp"
                    onClick={startWhatsAppChat}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100/75 border border-emerald-100 transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.63-1.023-5.101-2.885-6.964C16.57 1.928 14.098.903 11.47.903c-5.437 0-9.863 4.418-9.867 9.851-.001 1.73.457 3.412 1.32 4.904l-.997 3.639 3.721-.975zM17.89 15.02c-.322-.162-1.905-.94-2.201-1.047-.297-.108-.514-.162-.73.162-.217.324-.838 1.047-1.027 1.263-.19.216-.379.243-.702.082-.323-.162-1.36-.5-2.59-1.6-.958-.854-1.604-1.91-1.793-2.234-.19-.324-.02-.499.141-.66.146-.145.323-.379.485-.568.162-.189.217-.324.324-.54.108-.217.054-.405-.027-.568-.08-.162-.73-1.756-1.001-2.405-.265-.636-.532-.55-.73-.56-.189-.01-.405-.01-.621-.01-.216 0-.568.08-.865.405-.297.324-1.135 1.108-1.135 2.703 0 1.594 1.162 3.135 1.324 3.351.162.216 2.287 3.493 5.54 4.896.774.333 1.378.533 1.85.683.778.247 1.487.212 2.047.129.624-.093 1.905-.778 2.175-1.493.27-.716.27-1.33.19-1.46-.08-.13-.297-.213-.621-.376z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">WhatsApp Concierge</h4>
                        <p className="text-[10px] text-emerald-700/80 mt-0.5 leading-tight">Instant sizing alterations inquiry & video fittings</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>

                  {/* Direct Live Chat Option */}
                  <button
                    id="opt-livechat"
                    onClick={() => setMode('chat')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-100 transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">Bespoke Live Chat</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5 leading-tight">Interactive chatbot assistant with automated styling tips</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>

                  {/* Call Atelier Option */}
                  <button
                    id="opt-call"
                    onClick={handleCallAtelier}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-100 transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-neutral-700" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">Direct Phone line</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5 leading-tight">Connect via secure toll-free phone line</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>

                </div>

              </div>
            )}

            {/* Chat Mode */}
            {mode === 'chat' && (
              <div className="flex flex-col flex-grow min-h-0">
                
                {/* Back Button */}
                <div className="bg-white border-b border-neutral-100 px-4 py-2.5 flex items-center gap-2">
                  <button
                    id="btn-back-to-options"
                    onClick={() => setMode('options')}
                    className="text-xs text-neutral-500 hover:text-neutral-900 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <span>←</span>
                    <span>Back to Channels</span>
                  </button>
                </div>

                {/* Messages Panel */}
                <div className="flex-grow overflow-y-auto p-4 space-y-3">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-neutral-900 text-white rounded-br-none'
                          : 'bg-zinc-100 text-zinc-800 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[8px] text-neutral-400 font-mono mt-1">
                        {msg.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex flex-col items-start">
                      <div className="p-3.5 rounded-2xl bg-zinc-100 text-zinc-500 rounded-bl-none flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce delay-200"></span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Tray */}
                <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-neutral-100 flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask about size, fabrics, or tracking..."
                    className="flex-grow bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-neutral-300 placeholder:text-neutral-400"
                  />
                  <button
                    type="submit"
                    className="w-10 h-10 rounded-xl bg-neutral-950 hover:bg-black text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

              </div>
            )}

          </div>

          {/* Secure Backoffice SLA Banner */}
          <footer className="bg-neutral-50 border-t border-neutral-100 px-5 py-3 flex items-center justify-between text-[9px] text-neutral-400 font-mono uppercase">
            <span className="flex items-center gap-1">
              <Laptop className="w-3.5 h-3.5 text-neutral-400" />
              Secure SLA Active
            </span>
            <span>Atelier MK Inc.</span>
          </footer>

        </div>
      )}

    </div>
  );
};
