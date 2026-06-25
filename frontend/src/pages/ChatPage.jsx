import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Send, 
  Sparkles, 
  Brain, 
  HelpCircle, 
  Wrench, 
  Code,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

const ChatPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Hello ${user?.name || 'Student'}! 👋 I am your dedicated AI Learning Assistant. 

I have full context of your personalized roadmap, active weekly topics, and completed practice tasks.

How can I help you today? Here is what you can ask me:
- 💡 *"Explain the difference between SQL and NoSQL in simple terms"*
- 💻 *"Can you help me write and debug a basic React hook component?"*
- 🚀 *"What should my next study steps be for this week?"*`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSubmit = async (e, textToSend) => {
    if (e) e.preventDefault();
    const queryText = textToSend || inputValue;
    if (!queryText.trim()) return;

    setInputValue('');
    setError(null);
    setLoading(true);

    const userMsg = { id: Date.now(), sender: 'user', text: queryText };
    setMessages(prev => [...prev, userMsg]);

    try {
      const historyPayload = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await api.post('/chat', {
        message: queryText,
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
      console.error('Chat page error:', err);
      setError('Connection dropped. Please retry.');
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: '⚠️ Connection issues. Could not retrieve response from PathPilot AI. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestionText) => {
    handleSubmit(null, suggestionText);
  };

  const suggestions = [
    { text: 'Explain this week\'s concepts', icon: Brain },
    { text: 'Help me debug some code', icon: Code },
    { text: 'Suggest my next study task', icon: Lightbulb },
    { text: 'Explain variables and state', icon: HelpCircle }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] rounded-2xl bg-white border border-slate-200/60 dark:bg-darkbg-card dark:border-darkbg-border overflow-hidden shadow-sm animate-slide-in">
      
      {/* Page Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 dark:bg-slate-950 dark:border-darkbg-border flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-accent/15">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-sm font-bold text-slate-800 dark:text-white">AI Doubt Solver</h1>
            <p className="text-[10px] text-slate-400">Contextual Learning Assistant</p>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20 dark:bg-slate-900/10">
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              
              {/* Profile icon */}
              <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs uppercase ${
                msg.sender === 'user'
                  ? 'bg-accent text-white'
                  : 'bg-indigo-50 text-accent dark:bg-indigo-950/40 dark:text-blue-400 border border-indigo-100 dark:border-indigo-900/30'
              }`}>
                {msg.sender === 'user' ? user?.name.charAt(0) : <Sparkles className="h-4 w-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-accent text-white rounded-tr-none'
                    : 'bg-white text-slate-700 dark:bg-darkbg-card dark:text-slate-350 border border-slate-200/50 dark:border-darkbg-border rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-line space-y-2">
                  {msg.text.split('\n').map((line, idx) => {
                    if (line.startsWith('### ')) {
                      return <h4 key={idx} className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mt-2">{line.replace('### ', '')}</h4>;
                    }
                    if (line.startsWith('- ')) {
                      return <div key={idx} className="pl-4 -indent-4 font-medium">• {line.substring(2)}</div>;
                    }
                    if (line.match(/^\d+\.\s/)) {
                      return <div key={idx} className="pl-4 -indent-4 font-medium">{line}</div>;
                    }
                    return <p key={idx}>{line}</p>;
                  })}
                </div>
              </div>

            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-50 text-accent dark:bg-indigo-950/40 dark:text-blue-400 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex items-center space-x-1.5 rounded-2xl bg-white px-4 py-3.5 dark:bg-darkbg-card border border-slate-200/50 dark:border-darkbg-border rounded-tl-none shadow-sm">
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested doubt topics (only displays when input is empty and not loading) */}
      {messages.length === 1 && !loading && (
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Need help? Try asking:</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {suggestions.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={idx}
                  onClick={() => handleSuggestionClick(s.text)}
                  className="rounded-xl border border-slate-200 p-3 bg-white hover:border-accent hover:text-accent cursor-pointer transition-all dark:border-slate-850 dark:bg-darkbg-card dark:hover:border-blue-900/40 flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-400 dark:hover:text-blue-400"
                >
                  <Icon className="h-4.5 w-4.5 flex-shrink-0 text-slate-400 dark:text-slate-600" />
                  <span className="font-semibold leading-tight">{s.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Box Footer */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-200/80 bg-white p-4 dark:border-darkbg-border dark:bg-slate-950 flex items-center"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a technical doubt, request summaries, or ask for guidance..."
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold focus:border-accent focus:outline-none dark:border-slate-800 dark:bg-darkbg dark:text-white"
          disabled={loading}
        />
        <button
          type="submit"
          className="ml-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-accent/15 hover:bg-accent-dark transition-colors"
          disabled={loading || !inputValue.trim()}
        >
          <Send className="h-4.5 w-4.5" />
        </button>
      </form>

    </div>
  );
};

export default ChatPage;
