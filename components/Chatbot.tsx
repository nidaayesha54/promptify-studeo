import React, { useState, useRef, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { createChatSession } from '../services/geminiService';
import type { ChatMessage } from '../types';

const Chatbot: React.FC = () => {
  const chatRef = useRef<Chat | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current = createChatSession();
    setHistory([
        { role: 'model', text: 'Hello! How can I help you today?' }
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !chatRef.current || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: userInput };
    setHistory((prev) => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    const modelResponsePlaceholder: ChatMessage = { role: 'model', text: '' };
    setHistory((prev) => [...prev, modelResponsePlaceholder]);

    try {
      const stream = await chatRef.current.sendMessageStream({ message: userMessage.text });
      let fullResponse = '';
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        fullResponse += chunkText;
        setHistory((prev) => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1].text = fullResponse;
          return newHistory;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setHistory((prev) => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].text = 'Sorry, something went wrong. Please try again.';
        return newHistory;
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl flex flex-col h-[70vh]">
      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {history.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
              <p className="whitespace-pre-wrap">{msg.text || '...'}</p>
            </div>
          </div>
        ))}
         {isLoading && history[history.length-1]?.role === 'user' && (
           <div className="flex items-end gap-2 justify-start">
             <div className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl bg-slate-700 text-slate-200 rounded-bl-none">
              <div className="flex items-center justify-center gap-1">
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce"></span>
              </div>
             </div>
           </div>
         )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-700">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow bg-slate-700 text-slate-200 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !userInput.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors duration-200"
          >
            <PaperAirplaneIcon />
          </button>
        </form>
      </div>
    </div>
  );
};

const PaperAirplaneIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
  </svg>
);

export default Chatbot;
