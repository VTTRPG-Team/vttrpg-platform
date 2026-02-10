'use client';
import { useState } from 'react';
import { Send, Map, Users, Dice5 } from 'lucide-react'; // ไอคอน

export default function GameRoom({ params }: { params: { id: string } }) {
  // Mockup Data (เอาไว้เทสก่อนต่อ backend)
  const [messages, setMessages] = useState([
    { sender: 'AI GM', text: 'ยินดีต้อนรับสู่ดันเจี้ยน! คุณเห็นประตูไม้เก่าๆ อยู่ตรงหน้า...' },
  ]);
  const [input, setInput] = useState('');

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      
      {/* --- ส่วนที่ 1 (ซ้าย): พื้นที่กระดาน & ผู้เล่น (Board Area) --- */}
      <div className="flex-1 flex flex-col relative border-r border-slate-700">
        
        {/* Top Bar: ชื่อห้อง & เมนู */}
        <div className="h-14 bg-slate-800 flex items-center px-4 justify-between border-b border-slate-700">
          <h2 className="font-bold flex items-center gap-2"><Map size={18}/> Room: {params.id}</h2>
          <div className="flex gap-2">
            <button className="p-2 bg-slate-700 rounded hover:bg-slate-600"><Users size={18}/></button>
          </div>
        </div>

        {/* Game Board (Canvas จะอยู่ตรงนี้) */}
        <div className="flex-1 bg-slate-950 relative grid place-items-center bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px]">
          <span className="text-slate-500">
            [ พื้นที่สำหรับวาง Map & Token ] <br/>
          </span>
          
          {/* Dice Box ลอยอยู่มุมซ้ายล่าง */}
          <div className="absolute bottom-4 left-4 p-4 bg-slate-800/90 rounded-lg border border-slate-600 backdrop-blur">
            <div className="flex items-center gap-2 text-yellow-400 font-bold">
               <Dice5 /> ทอยเต๋า: 18
            </div>
          </div>
        </div>
      </div>

      {/* --- ส่วนที่ 2 (ขวา): แชท & AI (Sidebar) --- */}
      <div className="w-96 flex flex-col bg-slate-800">
        <div className="p-3 bg-purple-900/30 border-b border-purple-500/30">
          <h3 className="text-purple-300 font-semibold text-sm">Game Log & Chat</h3>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`p-2 rounded text-sm ${msg.sender === 'AI GM' ? 'bg-purple-900/40 border border-purple-700' : 'bg-slate-700'}`}>
              <strong className="block text-xs opacity-70 mb-1 text-purple-200">{msg.sender}</strong>
              {msg.text}
            </div>
          ))}
        </div>

        {/* Input Box */}
        <div className="p-3 border-t border-slate-700 bg-slate-900">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="พิมพ์สิ่งที่จะทำ..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
            <button className="p-2 bg-purple-600 rounded hover:bg-purple-500">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}