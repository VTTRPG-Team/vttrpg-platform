'use client';

import { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Send, Map, Users, Dice5 } from 'lucide-react';

const API_KEY = "AIzaSyD8LSZbkVBxsAz3YjJDmUczZB97UAw3oak"; 

export default function GameRoom({ params }: { params: { id: string } }) {
  // --- State สำหรับระบบแชท ---
  const [messages, setMessages] = useState<{ sender: string, text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null); // เอาไว้เลื่อนแชทลงล่างสุดอัตโนมัติ

  // --- ฟังก์ชันส่งข้อความหา AI (ดัดแปลงจาก ai_gm.tsx) ---
  const askGemini = async (overridePrompt: string | null = null) => {
    const textToSend = typeof overridePrompt === "string" ? overridePrompt : input;

    if (!textToSend.trim()) return;

    // 1. เพิ่มข้อความของผู้เล่นลงในแชท (ถ้าไม่ใช่ Auto Start)
    if (!overridePrompt) {
      setMessages(prev => [...prev, { sender: 'You', text: input }]);
      setInput(''); // เคลียร์ช่องพิมพ์
    }

    setLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // **สำคัญ:** ถ้าอยากให้ AI จำบริบทเดิมได้ ต้องส่งประวัติการคุยไปด้วย (Chat History)
      // แต่ในตัวอย่างนี้ขอใช้แบบถาม-ตอบ ง่ายๆ ก่อนนะครับ
      const result = await model.generateContent(textToSend);
      const response = await result.response;
      const text = response.text();

      // 2. เพิ่มคำตอบ AI ลงในแชท
      setMessages(prev => [...prev, { sender: 'AI GM', text: text }]);

    } catch (err: any) {
      setMessages(prev => [...prev, { sender: 'System', text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  // --- Auto Start เมื่อเข้าห้อง (เหมือน useEffect ใน ai_gm.tsx) ---
  useEffect(() => {
    const initialPrompt = "Act as a Dungeon Master for a fantasy RPG. Briefly introduce yourself to the player and ask them what their character's name is. There will be total of 4 players so ask them all about their name and preferred role in the party. Keep it concise. Explain dice roll rules briefly.";
    askGemini(initialPrompt);
  }, []);

  // --- เลื่อนแชทลงล่างสุดเสมอเมื่อมีข้อความใหม่ ---
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // --- ฟังก์ชันกด Enter ---
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
        askGemini();
    }
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      {/* --- ส่วนที่ 1 (ซ้าย): พื้นที่กระดาน --- */}
      <div className="flex-1 flex flex-col relative border-r border-slate-700">
        <div className="h-14 bg-slate-800 flex items-center px-4 justify-between border-b border-slate-700">
          <h2 className="font-bold flex items-center gap-2"><Map size={18}/> Room: {params.id}</h2>
          <div className="flex gap-2">
            <button className="p-2 bg-slate-700 rounded hover:bg-slate-600"><Users size={18}/></button>
          </div>
        </div>

        <div className="flex-1 bg-slate-950 relative grid place-items-center bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px]">
          <span className="text-slate-500">[ พื้นที่สำหรับวาง Map & Token ]</span>
          <div className="absolute bottom-4 left-4 p-4 bg-slate-800/90 rounded-lg border border-slate-600 backdrop-blur">
            <div className="flex items-center gap-2 text-yellow-400 font-bold">
               <Dice5 /> ทอยเต๋า: 18
            </div>
          </div>
        </div>
      </div>

      {/* --- ส่วนที่ 2 (ขวา): แชท & AI (Sidebar) --- */}
      <div className="w-96 flex flex-col bg-slate-800 shadow-xl z-10">
        <div className="p-3 bg-purple-900/30 border-b border-purple-500/30 flex justify-between items-center">
          <h3 className="text-purple-300 font-semibold text-sm">Game Log & Chat</h3>
          {loading && <span className="text-xs text-yellow-400 animate-pulse">GM กำลังคิด...</span>}
        </div>

        {/* Chat History Container */}
        <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
        >
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
                <div 
                    className={`max-w-[90%] p-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.sender === 'AI GM' 
                        ? 'bg-purple-900/40 border border-purple-700/50 text-slate-200' 
                        : msg.sender === 'System'
                        ? 'bg-red-900/50 text-red-200 border border-red-700'
                        : 'bg-slate-700 text-white'
                    }`}
                >
                    <strong className={`block text-xs opacity-70 mb-1 ${
                        msg.sender === 'AI GM' ? 'text-purple-300' : 'text-slate-400'
                    }`}>
                        {msg.sender}
                    </strong>
                    {msg.text}
                </div>
            </div>
          ))}
        </div>

        {/* Input Box Area */}
        <div className="p-3 border-t border-slate-700 bg-slate-900">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder={loading ? "รอสักครู่..." : "พิมพ์สิ่งที่จะทำ..."}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
            />
            <button 
                onClick={() => askGemini()}
                disabled={loading || !input.trim()}
                className="p-2 bg-purple-600 rounded-lg hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}