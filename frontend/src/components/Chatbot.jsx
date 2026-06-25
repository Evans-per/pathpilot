import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { MessageSquare, X, Send, Sparkles, AlertCircle } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hi there! I'm your PathPilot AI Assistant. 🚀 Ask me to explain a roadmap topic, suggest your next study steps, or help debug a concept!"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  // Auto Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setInputValue('');
    setError(null);

    // Add user message to state
    const userMsg = { id: Date.now(), sender: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Send chat history and current message
      const historyPayload = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await api.post('/chat', {
        message: userText,
        history: historyPayload
      });

      if (res.data && res.data.reply) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'bot',
          text: res.data.reply
        }]);
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      setError('Connection issues. Let me retry.');
      // Add error message to chat
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: '⚠️ Sorry, I had trouble communicating with the server. Please verify your connection or try again shortly.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-6 z-50 md:bottom-6">
      {/* Floating Button Toggle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-xl shadow-accent/30 hover:bg-accent-dark hover:scale-105 transition-all duration-300"
          aria-label="Open Chatbot"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="flex h-[500px] w-[360px] flex-col rounded-2xl bg-white shadow-2xl border border-slate-200/80 dark:bg-slate-900 dark:border-darkbg-border animate-slide-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-accent p-4 text-white dark:bg-slate-950">
            <div className="flex items-center space-x-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <Sparkles className="h-4.5 w-4.5" />
              </span>
              <div>
                <h3 className="font-bold text-sm">Learning Assistant</h3>
                <p className="text-[10px] text-blue-200">Online & Ready</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-900/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-accent text-white rounded-br-none'
                      : 'bg-white text-slate-700 dark:bg-darkbg-card dark:text-slate-300 border border-slate-200/40 dark:border-darkbg-border rounded-bl-none'
                  }`}
                >
                  {/* Handle line breaks and simple lists / headers */}
                  <div className="whitespace-pre-line space-y-1.5">
                    {msg.text.split('\n').map((line, idx) => {
                      if (line.startsWith('### ')) {
                        return <h4 key={idx} className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-1">{line.replace('### ', '')}</h4>;
                      }
                      if (line.match(/^\d+\.\s/)) {
                        return <div key={idx} className="pl-4 -indent-4">{line}</div>;
                      }
                      if (line.startsWith('- ')) {
                        return <div key={idx} className="pl-4 -indent-4">• {line.substring(2)}</div>;
                      }
                      return <p key={idx}>{line}</p>;
                    })}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Loader */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-1.5 rounded-2xl bg-white px-4 py-3 dark:bg-darkbg-card border border-slate-200/40 dark:border-darkbg-border rounded-bl-none shadow-sm">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center border-t border-slate-200/80 bg-white p-3.5 dark:border-darkbg-border dark:bg-slate-900"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs focus:border-accent focus:outline-none dark:border-slate-800 dark:bg-darkbg dark:text-white"
              disabled={loading}
            />
            <button
              type="submit"
              className="ml-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-accent/15 hover:bg-accent-dark transition-colors"
              disabled={loading || !inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
