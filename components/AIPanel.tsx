import React, { useState, useEffect, useRef } from 'react';
import { ThemeMode, Chapter, AIChatMessage } from '../types';
import { summarizeChapter, chatWithBook } from '../services/geminiService';
import { Sparkles, MessageSquare, X, Send, Loader2, BookText } from 'lucide-react';

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: Chapter | undefined;
  theme: ThemeMode;
}

const AIPanel: React.FC<AIPanelProps> = ({ isOpen, onClose, chapter, theme }) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset chat when chapter changes, or keep it? 
  // Let's add a system message when chapter changes.
  useEffect(() => {
    if (chapter) {
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: `我已阅读 "${chapter.title}"。你可以让我总结本章，或者询问关于剧情的任何问题。`,
          timestamp: Date.now()
        }
      ]);
    }
  }, [chapter?.title]); // Only trigger on title change

  const handleSummarize = async () => {
    if (!chapter) return;
    setIsLoading(true);
    try {
      const summary = await summarizeChapter(chapter.title, chapter.content);
      setMessages(prev => [...prev, { role: 'model', text: `📝 **本章摘要**: \n${summary}`, timestamp: Date.now() }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: '抱歉，摘要生成失败。', timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !chapter) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg, timestamp: Date.now() }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const response = await chatWithBook(history, chapter.content, userMsg);
      setMessages(prev => [...prev, { role: 'model', text: response, timestamp: Date.now() }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: '抱歉，连接AI时出现错误。', timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Styles
  const bgClass = theme === ThemeMode.DARK ? 'bg-neutral-900 border-neutral-800' : theme === ThemeMode.SEPIA ? 'bg-[#eaddcf] border-[#d3c4b1]' : 'bg-white border-gray-200';
  const textClass = theme === ThemeMode.DARK ? 'text-gray-300' : theme === ThemeMode.SEPIA ? 'text-[#5b4636]' : 'text-gray-800';
  const inputBg = theme === ThemeMode.DARK ? 'bg-neutral-800 text-white' : theme === ThemeMode.SEPIA ? 'bg-[#d3c4b1]/50 text-[#3e2f24]' : 'bg-gray-100 text-gray-900';

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-y-0 right-0 z-40 w-96 shadow-2xl transform transition-transform duration-300 flex flex-col ${bgClass} ${textClass}`}>
      {/* Header */}
      <div className="p-4 border-b border-opacity-20 flex justify-between items-center bg-opacity-50">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Sparkles size={18} className="text-yellow-500" />
          AI 助手
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-black/10 rounded">
          <X size={20} />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-opacity-10 flex gap-2 overflow-x-auto">
        <button 
          onClick={handleSummarize}
          disabled={isLoading || !chapter}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 whitespace-nowrap"
        >
          <BookText size={14} />
          总结本章
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : (theme === ThemeMode.DARK ? 'bg-neutral-800' : 'bg-black/5')
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className={`rounded-lg p-3 ${theme === ThemeMode.DARK ? 'bg-neutral-800' : 'bg-black/5'}`}>
              <Loader2 size={16} className="animate-spin opacity-50" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-opacity-20">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={chapter ? "询问关于本章的问题..." : "请先选择章节"}
            disabled={isLoading || !chapter}
            className={`flex-1 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${inputBg}`}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim() || !chapter}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIPanel;