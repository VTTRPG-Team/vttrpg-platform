'use client'
import { useState, useRef, useEffect } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { ai_gm } from '@/app/ai-gm/ai_gm'
import { Send, Volume2 } from 'lucide-react' // เพิ่ม Volume2 สำหรับไอคอนเสียง
import { useTextToSpeech } from '@/hooks/useTextToSpeech' // อย่าลืมสร้างไฟล์ Hook นี้นะครับ

export default function ChatInterface() {
  const { activeTab, setActiveTab, diceState, clearPendingSubmit } = useGameStore()
  
  // เรียกใช้ Hook เสียง
  const { speak } = useTextToSpeech();

  const { messages, loading, currentAiText, sendAiAction, sendPartyMessage, currentUserId, waitingFor, hasSubmittedAction, isGameStarted } = ai_gm(); 
  
  const [inputText, setInputText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentAiText, activeTab]); 

  // 🌟 พอลูกเต๋าทอยเสร็จ ให้มันโยนข้อความเข้า AI ให้เลยอัตโนมัติ!
  useEffect(() => {
    if (diceState.pendingSubmit) {
        sendAiAction(diceState.pendingSubmit); // โยนเข้าแชท AI
        clearPendingSubmit(); // ล้างค่าทิ้งเพื่อรอรอบหน้า
    }
  }, [diceState.pendingSubmit]); // eslint-disable-line react-hooks/exhaustive-deps

  // 🌟 ล็อคปุ่มเฉพาะตอน AI คิด หรือ ตอนตัวเองส่ง Action ไปแล้ว
  const isAiBusy = loading || (!isGameStarted && messages.length === 0);
  const isInputDisabled = (activeTab === 'AI_GM') && (isAiBusy || hasSubmittedAction);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isInputDisabled) return; 

    if (activeTab === 'PARTY') sendPartyMessage(inputText);
    else sendAiAction(inputText);
    
    setInputText('');
  }

  // Filter ข้อความตาม Tab
  const displayMessages = messages.filter(msg => {
      if (activeTab === 'PARTY') return msg.channel === 'PARTY';
      if (activeTab === 'AI_GM') return msg.channel === 'AI';
      return false;
  });

  return (
    <div className="flex flex-col h-full bg-neutral-900/95 backdrop-blur-md border-r border-white/10 w-96 shadow-2xl font-sans">
      
      {/* --- TAB HEADERS --- */}
      <div className="flex border-b border-white/10 shrink-0">
        <button onClick={() => setActiveTab('PARTY')} className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'PARTY' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>👥 Party</button>
        <button onClick={() => setActiveTab('AI_GM')} className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'AI_GM' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>🤖 AI Action</button>
      </div>

      {/* --- WAITING BANNER --- */}
      {activeTab === 'AI_GM' && waitingFor.length > 0 && isGameStarted && !isAiBusy && (
        <div className="bg-yellow-900/40 border-b border-yellow-500/30 px-4 py-2 flex items-center gap-2 text-xs font-mono text-yellow-300 shrink-0 shadow-inner">
          <span className="animate-pulse">⏳</span> 
          <span>Waiting for: <span className="font-bold text-white">{waitingFor.join(', ')}</span></span>
        </div>
      )}

      {/* --- MESSAGE LIST AREA --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {displayMessages.map((msg, i) => {
          const isMe = msg.userId === currentUserId;
          const isAI = msg.type === 'AI';
          
          return (
            <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              
              {/* ชื่อคนส่ง */}
              <span className="text-[10px] text-gray-500 mb-1 px-1">{isMe ? 'You' : msg.sender}</span>
              
              {/* Container สำหรับ Bubble + ปุ่มเสียง */}
              <div className={`flex items-end gap-2 max-w-[95%] ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                
                {/* 1. ปุ่มกดฟังเสียง (Speaker Button) */}
                {msg.text && (
                   <button 
                     onClick={() => speak(msg.text, msg.sender)}
                     className="mb-1 p-1.5 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-all shrink-0"
                     title="Read Aloud"
                   >
                     <Volume2 size={14} />
                   </button>
                )}

                {/* 2. กล่องข้อความ (Bubble) */}
                <div className={`px-3 py-2 rounded-lg text-sm whitespace-pre-wrap shadow-md ${
                  isAI ? 'bg-purple-900/50 text-purple-100 border border-purple-500/30' : 
                  isMe ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-gray-200'
                }`}>
                  {msg.text}
                </div>

              </div>
            </div>
          );
        })}
        
        {/* Real-time Streaming AI Text */}
        {activeTab === 'AI_GM' && isAiBusy && currentAiText && (
           <div className="flex flex-col items-start animate-fade-in">
             <span className="text-[10px] text-purple-400 mb-1">AI GM</span>
             <div className="px-3 py-2 rounded-lg max-w-[95%] text-sm bg-purple-900/50 text-purple-100 border border-purple-500/30 whitespace-pre-wrap">
               {currentAiText}<span className="animate-pulse">|</span>
             </div>
           </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* --- INPUT AREA --- */}
      <div className="p-3 border-t border-white/10 bg-neutral-800/80 shrink-0">
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isInputDisabled} 
            placeholder={
              activeTab === 'PARTY' ? "Chat with party..." : 
              !isGameStarted ? "Setting up the world..." :
              isAiBusy ? "AI is processing..." : 
              hasSubmittedAction ? "Action submitted. Waiting for others..." : 
              "Type your action..." 
            }
            className="flex-1 bg-black/50 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
          />
          <button type="submit" disabled={!inputText.trim() || isInputDisabled} className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}