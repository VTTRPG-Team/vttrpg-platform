'use client'
import { useState, useRef, useEffect } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { ai_gm } from '@/app/ai-gm/ai_gm'
import { Send } from 'lucide-react'

export default function ChatInterface() {
  const { activeTab, setActiveTab } = useGameStore()
  
  const { messages, loading, currentAiText, askGemini, sendPartyMessage, currentUserId } = ai_gm(); 
  
  const [inputText, setInputText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentAiText, activeTab]); // เพิ่ม activeTab เพื่อให้สลับหน้าแล้วเลื่อนลงสุดเสมอ

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (activeTab === 'AI_GM' && loading) return; // ห้ามพิมพ์แทรกตอน AI คิด

    if (activeTab === 'PARTY') {
       // ส่งเข้าห้อง Party (ไม่เรียก AI)
       sendPartyMessage(inputText);
    } else {
       // ส่งหา AI
       askGemini(inputText);
    }
    setInputText('');
  }

  const displayMessages = messages.filter(msg => {
      // ถ้าอยู่แท็บไหน ให้โชว์เฉพาะข้อความที่มี channel ตรงกับแท็บนั้น
      if (activeTab === 'PARTY') return msg.channel === 'PARTY';
      if (activeTab === 'AI_GM') return msg.channel === 'AI';
      return false;
  });

  return (
    <div className="flex flex-col h-full bg-neutral-900/95 backdrop-blur-md border-r border-white/10 w-96 shadow-2xl font-sans">
      
      {/* TABS */}
      <div className="flex border-b border-white/10">
        <button onClick={() => setActiveTab('PARTY')} className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'PARTY' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>👥 Party</button>
        <button onClick={() => setActiveTab('AI_GM')} className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'AI_GM' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>🤖 AI Action</button>
      </div>

      {/* MESSAGE LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {displayMessages.map((msg, i) => {
          const isMe = msg.userId === currentUserId;
          const isAI = msg.type === 'AI';
          
          return (
            <div 
              key={i} 
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`} //ถ้าเป็นเราชิดขวา คนอื่นชิดซ้าย
            >
              {/* ชื่อคนส่ง (ถ้าเป็นเราไม่ต้องโชว์ชื่อ หรือโชว์เป็น Me ก็ได้) */}
              <span className="text-[10px] text-gray-500 mb-1">
                {isMe ? 'You' : msg.sender}
              </span>

              {/* กล่องข้อความ */}
              <div className={`px-3 py-2 rounded-lg max-w-[95%] text-sm whitespace-pre-wrap ${
                isAI ? 'bg-purple-900/50 text-purple-100 border border-purple-500/30' : // สี AI
                isMe ? 'bg-blue-600 text-white' : //สีเรา (ฟ้า)
                'bg-neutral-700 text-gray-200'    //สีเพื่อน (เทา)
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        
        {/* Real-time Typing (เฉพาะแท็บ AI) */}
        {activeTab === 'AI_GM' && loading && currentAiText && (
           <div className="flex flex-col items-start">
             <span className="text-[10px] text-purple-400 mb-1">AI GM</span>
             <div className="px-3 py-2 rounded-lg max-w-[95%] text-sm bg-purple-900/50 text-purple-100 border border-purple-500/30 whitespace-pre-wrap">
               {currentAiText}<span className="animate-pulse">|</span>
             </div>
           </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-3 border-t border-white/10 bg-neutral-800/80">
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading && activeTab === 'AI_GM'}
            placeholder={activeTab === 'PARTY' ? "Chat with party..." : (loading ? "AI is thinking..." : "Type action...")}
            className="flex-1 bg-black/50 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" disabled={!inputText.trim() || (loading && activeTab === 'AI_GM')} className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 disabled:opacity-50">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}