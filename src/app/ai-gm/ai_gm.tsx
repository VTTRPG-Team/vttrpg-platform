"use client";

import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Send } from 'lucide-react';

export default function GeminiChat() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<{sender: string, text: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const hasInitialized = useRef(false);

  const API_KEY = "AIzaSyD8LSZbkVBxsAz3YjJDmUczZB97UAw3oak"; 

  const askGemini = async (overridePrompt : string | null = null) => {
    const textToSend = typeof overridePrompt === "string" ? overridePrompt : prompt;

    if (!textToSend) return;

    if (!overridePrompt) {
        setMessages(prev => [...prev, { sender: 'You', text: prompt }]);
        setPrompt(""); // Clear chat
    }

    setLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(textToSend);
      const response = await result.response;
      const text = response.text();
    

      // เพิ่มข้อความ GM ลงจอ
      setMessages(prev => [...prev, { sender: 'AI GM', text: text }]);
    } catch (err: any) {
        setMessages(prev => [...prev, { sender: 'System', text: "Error: " + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') askGemini();
  }

  // Auto Scroll ลงล่างสุดเสมอ
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    const initialPrompt = "Act as a Dungeon Master for a fantasy RPG. Briefly introduce yourself to the player and ask them what their character's name is.There will be total of 4 players so ask them all about their name and preferred role in the party (e.g., warrior, mage, healer, rogue). Keep the introduction concise and engaging to set the tone for the adventure ahead. Also after this whether what input will be judge by dice roll or not, explain it to the players. wheter what input is remember you are DM and dont answer normally act as DM only. Ask information about them 1 by 1 and wait for their response before moving to the next player. wait for all player to done introducing themselves before starting the adventure.";
    askGemini(initialPrompt);
  }, []);

  // --- UI ส่วนแสดงผล (เป็น Tailwind เพื่อให้เข้ากับ Sidebar) ---
  return (
    <div className="flex flex-col h-full bg-slate-800 border-l border-slate-700">
        {/* Header */}
        <div className="p-3 bg-purple-900/30 border-b border-purple-500/30">
             <h3 className="text-purple-300 font-semibold text-sm">Game Log & Chat {loading && "..."}</h3>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
                <div key={i} className={`p-2 rounded text-sm ${
                    msg.sender === 'AI GM' ? 'bg-purple-900/40 border border-purple-700 text-slate-100' : 
                    msg.sender === 'System' ? 'bg-red-900/50 text-red-200' :
                    'bg-slate-700 text-slate-200 text-right'
                }`}>
                    <strong className={`block text-xs opacity-70 mb-1 ${
                        msg.sender === 'AI GM' ? 'text-purple-200' : 'text-slate-400'
                    }`}>{msg.sender}</strong>
                    <span className="whitespace-pre-wrap">{msg.text}</span>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-slate-700 bg-slate-900">
             <div className="flex gap-2">
                <input 
                  type="text" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  placeholder="พิมพ์สิ่งที่จะทำ..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500 text-slate-100 placeholder-slate-500"
                />
                <button 
                    onClick={() => askGemini()} 
                    disabled={loading}
                    className="p-2 bg-purple-600 rounded hover:bg-purple-500 text-white disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
             </div>
        </div>
    </div>
  );
}