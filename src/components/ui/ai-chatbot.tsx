'use client';
import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'How many assets are available?',
  'Show me a summary of asset statuses',
  'Which assets are under repair?',
  'How many assets are currently issued?',
];

function MessageBubble({ msg }: { msg: Message }) {
  const isBot = msg.role === 'assistant';
  return (
    <div className={`flex gap-2 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isBot ? 'bg-blue-100' : 'bg-gray-200'}`}>
        {isBot ? <Bot className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4 text-gray-600" />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isBot
            ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
            : 'bg-blue-600 text-white rounded-tr-sm'
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

export function AiChatBot() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m your IT inventory assistant. I have live access to your asset data. Ask me anything about your inventory!' },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, open, minimized]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');

    const updated: Message[] = [...messages, { role: 'user', content }];
    setMessages(updated);
    setLoading(true);

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });
      const d = await r.json();
      setMessages(m => [...m, {
        role: 'assistant',
        content: d.reply || d.error || 'Something went wrong. Please try again.',
      }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          aria-label="Open AI assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all ${
            minimized ? 'h-14' : 'h-[520px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-600 rounded-t-2xl shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Inventory Assistant</p>
                <p className="text-xs text-blue-200">Powered by Gemini</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(m => !m)}
                className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((msg, i) => (
                  <MessageBubble key={i} msg={msg} />
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Suggestions — only shown before first user message */}
              {messages.length === 1 && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5 bg-gray-50">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-xs bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-600 rounded-full px-3 py-1 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-gray-100 bg-white rounded-b-2xl">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                    placeholder="Ask about your inventory..."
                    className="flex-1 text-sm bg-gray-100 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                    disabled={loading}
                  />
                  <button
                    onClick={() => send()}
                    disabled={!input.trim() || loading}
                    className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
