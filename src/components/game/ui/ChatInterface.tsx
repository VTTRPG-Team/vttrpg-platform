'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { ai_gm } from '@/app/ai-gm/ai_gm'
import { Send, Volume2, MessageSquareText, X, History } from 'lucide-react'
import { useTextToSpeech } from '@/hooks/useTextToSpeech'

import { VT323 } from 'next/font/google'
const vt323 = VT323({ subsets: ['latin'], weight: ['400'] });

const PORTRAITS = {
  knight: "/portraits/knight.png", 
  adv1: "/portraits/adv1.png",     
  adv2: "/portraits/adv2.png",     
  magic1: "/portraits/magic1.png", 
  magic2: "/portraits/magic2.png", 
  default: "/portraits/adv1.png" 
};

const getSmartAvatarUrl = (name: string, storyText: string) => {
  const lowerName = name.toLowerCase();
  const lowerText = storyText.toLowerCase();

  if (lowerName.includes('wizard') || lowerName.includes('mage') || lowerName.includes('witch') || 
      lowerText.includes('magic') || lowerText.includes('spell') || lowerText.includes('fireball') || lowerText.includes('mana')) {
      return storyText.length % 2 === 0 ? PORTRAITS.magic1 : PORTRAITS.magic2;
  }
  if (lowerName.includes('knight') || lowerName.includes('guard') || lowerName.includes('paladin') || 
      lowerText.includes('armor') || lowerText.includes('shield') || lowerText.includes('defend')) {
      return PORTRAITS.knight;
  }
  if (lowerName.includes('adventurer') || lowerName.includes('rogue') || lowerName.includes('hero') || 
      lowerText.includes('explore') || lowerText.includes('dungeon') || lowerText.includes('cave') || 
      lowerText.includes('attack') || lowerText.includes('sword') || lowerText.includes('torch')) {
      return storyText.length % 2 === 0 ? PORTRAITS.adv1 : PORTRAITS.adv2;
  }
  return PORTRAITS.default;
}

export default function ChatInterface() {
  const [isPartyOpen, setIsPartyOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [actionInput, setActionInput] = useState('');
  const [partyInput, setPartyInput] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const historyBottomRef = useRef<HTMLDivElement>(null);
  
  const processedStoryRef = useRef<string>('');

  const { diceState, clearPendingSubmit } = useGameStore()
  const { speak } = useTextToSpeech();
  const { messages, loading, currentAiText, sendAiAction, sendPartyMessage, currentUserId, waitingFor, hasSubmittedAction, isGameStarted } = ai_gm();

  const isAiBusy = loading || (!isGameStarted && messages.length === 0);
  
  const partyMessages = messages.filter(msg => msg.channel === 'PARTY');
  const aiMessages = messages.filter(msg => msg.channel === 'AI'); 
  const latestAiMessage = aiMessages.filter(msg => msg.type === 'AI').pop(); 

  const storyText = (isAiBusy && currentAiText) ? currentAiText : (latestAiMessage?.text || "The adventure begins...");
  const speakerName = latestAiMessage?.sender || "Game Master";

  // =========================================================
  // 🧠 ระบบสแกนคำและส่งสัญญาณ FX & AUDIO อัตโนมัติ!
  // =========================================================
  useEffect(() => {
    if (storyText.length < processedStoryRef.current.length) {
      processedStoryRef.current = '';
    }

    const lowerText = storyText.toLowerCase();
    const oldText = processedStoryRef.current.toLowerCase();

    const justAppeared = (words: string[]) => words.some(w => lowerText.includes(w) && !oldText.includes(w));

    // 🌪️ FX สั่นจอ
    if (justAppeared(['earthquake', 'shake', 'roar', 'explosion', 'boom', 'rumble', 'แผ่นดินไหว', 'สั่นสะเทือน', 'คำราม', 'ระเบิด'])) {
      window.dispatchEvent(new CustomEvent('ai-fx', { detail: { action: 'shake' } }));
    }

    // 🌙 FX จอมืด
    if (justAppeared(['darkness', 'shadows', 'night falls', 'pitch black', 'creepy', 'deep cave', 'ความมืด', 'มืดมิด', 'ค่ำคืน', 'น่ากลัว'])) {
      window.dispatchEvent(new CustomEvent('ai-fx', { detail: { action: 'dark_on' } }));
    } 
    // ☀️ FX สว่าง
    else if (justAppeared(['sunlight', 'bright', 'morning', 'torch', 'illuminates', 'สว่าง', 'แสงแดด', 'คบเพลิง', 'รุ่งเช้า'])) {
      window.dispatchEvent(new CustomEvent('ai-fx', { detail: { action: 'dark_off' } }));
    }

    // ---------------------------------------------------------
    // 🎵 AUDIO SFX (เสียงเอฟเฟกต์)
    // ---------------------------------------------------------
    if (justAppeared(['sword', 'slash', 'blade', 'attack', 'ฟันดาบ', 'โจมตี'])) {
      window.dispatchEvent(new CustomEvent('ai-audio', { detail: { type: 'play_sfx', track: 'sword' } }));
    }
    if (justAppeared(['magic', 'spell', 'fireball', 'cast', 'เวทมนตร์', 'ร่ายเวทย์'])) {
      window.dispatchEvent(new CustomEvent('ai-audio', { detail: { type: 'play_sfx', track: 'magic' } }));
    }
    if (justAppeared(['explosion', 'blast', 'boom', 'ระเบิด'])) {
      window.dispatchEvent(new CustomEvent('ai-audio', { detail: { type: 'play_sfx', track: 'explosion' } }));
    }
    if (justAppeared(['roar', 'growl', 'monster', 'คำราม'])) {
      window.dispatchEvent(new CustomEvent('ai-audio', { detail: { type: 'play_sfx', track: 'monster' } }));
    }

    // ---------------------------------------------------------
    // 🎵 AUDIO BGM (เปลี่ยนเพลงพื้นหลัง)
    // ---------------------------------------------------------
    if (justAppeared(['rain', 'storm', 'ฝนตก', 'พายุ'])) {
      window.dispatchEvent(new CustomEvent('ai-audio', { detail: { type: 'play_bgm', track: 'rain' } }));
    } else if (justAppeared(['tavern', 'pub', 'inn', 'crowd', 'โรงเตี๊ยม', 'บาร์'])) {
      window.dispatchEvent(new CustomEvent('ai-audio', { detail: { type: 'play_bgm', track: 'tavern' } }));
    } else if (justAppeared(['dungeon', 'cave', 'dark', 'creepy', 'ดันเจี้ยน', 'ถ้ำ'])) {
      window.dispatchEvent(new CustomEvent('ai-audio', { detail: { type: 'play_bgm', track: 'dungeon' } }));
    }

    processedStoryRef.current = storyText; 
  }, [storyText]);


  // =========================================================
  // UI LOGIC 
  // =========================================================
  useEffect(() => {
    if (isPartyOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartyOpen]);

  useEffect(() => {
    if (isHistoryOpen) {
      setTimeout(() => historyBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [isHistoryOpen, messages]);

  useEffect(() => {
    if (diceState.pendingSubmit) {
        sendAiAction(diceState.pendingSubmit);
        clearPendingSubmit();
    }
  }, [diceState.pendingSubmit]); 

  const handleSendAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionInput.trim() || isAiBusy || hasSubmittedAction) return;
    sendAiAction(actionInput);
    setActionInput('');
  }

  const handleSendParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyInput.trim()) return;
    sendPartyMessage(partyInput);
    setPartyInput('');
  }

  const speakerAvatar = useMemo(() => {
      return getSmartAvatarUrl(speakerName, storyText);
  }, [speakerName, storyText]);

  return (
    <>
      {/* ========================================================= */}
      {/* 1. กล่องเนื้อเรื่อง Stardew Valley */}
      {/* ========================================================= */}
      <div className="fixed top-24 left-6 w-[320px] md:w-[380px] max-h-[75vh] z-[9000] pointer-events-none flex flex-col items-start">
        
        {waitingFor.length > 0 && isGameStarted && !isAiBusy && (
          <div className="bg-yellow-900/80 border-2 border-[#8B5A2B] px-4 py-1.5 rounded-md flex items-center gap-2 text-xs font-mono text-[#f4e4bc] shadow-lg mb-3 pointer-events-auto">
            <span className="animate-pulse">⏳</span> 
            <span>Waiting for: <span className="font-bold text-white">{waitingFor.join(', ')}</span></span>
          </div>
        )}

        <div className="w-24 h-24 md:w-28 md:h-28 shrink-0 bg-[#3e2723] border-4 border-[#8B5A2B] rounded shadow-[4px_4px_0px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 ml-6 mb-2 pointer-events-auto transition-all duration-300">
          <img 
            key={speakerAvatar} 
            src={speakerAvatar} 
            alt={speakerName} 
            className="w-full h-full object-contain p-1 animate-fade-in"
            style={{ imageRendering: 'pixelated' }}
            onError={(e) => { e.currentTarget.src = "https://api.dicebear.com/7.x/bottts/svg?seed=Error"; }}
          />
        </div>

        <div className="w-full bg-[#f4e4bc] border-4 border-[#8B5A2B] rounded-lg shadow-[6px_6px_0px_rgba(0,0,0,0.5)] p-4 relative flex flex-col pointer-events-auto flex-1 max-h-[50vh]">
          
          <div className="absolute -top-[16px] left-10 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[16px] border-b-[#8B5A2B] z-10"></div>
          <div className="absolute -top-[11px] left-[43px] w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[12px] border-b-[#f4e4bc] z-20"></div>

          <div className="absolute -top-4 right-4 bg-[#8B5A2B] px-3 py-0.5 rounded shadow-[2px_2px_0px_rgba(0,0,0,0.5)] border-2 border-[#5c3a1a] z-30">
              <span className="text-[#f4e4bc] font-bold text-xs uppercase tracking-wider">{speakerName}</span>
          </div>

          <button 
            onClick={() => setIsHistoryOpen(true)} 
            className="absolute -top-4 right-24 bg-[#8B5A2B] px-2 py-1 rounded shadow-[2px_2px_0px_rgba(0,0,0,0.5)] border-2 border-[#5c3a1a] text-[#f4e4bc] hover:bg-[#5c3a1a] transition-colors z-30 flex items-center gap-1"
            title="View History Log"
          >
            <History size={12} /> <span className="text-[10px] font-bold uppercase tracking-widest">LOG</span>
          </button>

          {!isAiBusy && storyText !== "The adventure begins..." && (
            <button onClick={() => speak(storyText, speakerName)} className="absolute top-3 right-3 bg-[#8B5A2B] p-1.5 rounded-full shadow-[2px_2px_0px_rgba(0,0,0,0.5)] border-2 border-[#5c3a1a] text-[#f4e4bc] hover:bg-[#5c3a1a] transition-colors z-30" title="Read Aloud">
              <Volume2 size={14} />
            </button>
          )}

          <div className={`text-[#3e2723] text-lg md:text-xl leading-tight whitespace-pre-wrap mt-2 mb-4 overflow-y-auto custom-scrollbar flex-1 pr-2 ${vt323.className}`}>
            {storyText}
            {isAiBusy && <span className="animate-pulse ml-1 font-bold inline-block w-2.5 h-4 bg-[#3e2723]"></span>}
          </div>

          <form onSubmit={handleSendAction} className="flex gap-2 w-full mt-auto pt-3 border-t-2 border-[#8B5A2B]/30">
            <input
              type="text"
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              disabled={isAiBusy || hasSubmittedAction} 
              placeholder={
                !isGameStarted ? "Setting up..." :
                isAiBusy ? "AI is typing..." : 
                hasSubmittedAction ? "Waiting..." : 
                "What do you do?" 
              }
              className={`flex-1 bg-[#2a1a15] border-2 border-[#8B5A2B] rounded-md px-3 py-2 text-[#f4e4bc] placeholder-[#8B5A2B] focus:outline-none focus:border-[#d4af37] disabled:opacity-50 text-sm md:text-base ${vt323.className} text-lg`}
            />
            <button type="submit" disabled={!actionInput.trim() || isAiBusy || hasSubmittedAction} className="px-3 py-2 bg-[#8B5A2B] border-2 border-[#5c3a1a] rounded-md text-[#f4e4bc] hover:bg-[#5c3a1a] disabled:opacity-50 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] transition-colors flex items-center justify-center">
              <Send size={16} />
            </button>
          </form>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 1.5 หน้าต่าง Modal ประวัติเนื้อเรื่อง (History Log) */}
      {/* ========================================================= */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto animate-fade-in">
          <div className="bg-[#e7cfa0] border-4 border-[#8B5A2B] rounded-xl shadow-[10px_10px_0px_rgba(0,0,0,0.8)] w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden">
            
            <div className="bg-[#8B5A2B] p-3 md:p-4 flex justify-between items-center border-b-4 border-[#5c3a1a]">
              <span className={`text-[#f4e4bc] text-xl md:text-2xl font-bold tracking-widest uppercase flex items-center gap-2 ${vt323.className}`}>
                <History size={20} /> Adventure Log
              </span>
              <button onClick={() => setIsHistoryOpen(false)} className="text-[#f4e4bc] hover:text-white bg-[#5c3a1a] p-1.5 rounded shadow-[2px_2px_0px_rgba(0,0,0,0.5)] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
              {aiMessages.length === 0 && <div className={`text-center text-[#8B5A2B] text-xl mt-10 ${vt323.className}`}>No history yet...</div>}
              
              {aiMessages.map((msg, i) => {
                const isMe = msg.userId === currentUserId;
                return (
                  <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs font-bold text-[#8B5A2B] uppercase tracking-widest mb-1 px-1">
                      {isMe ? 'You' : msg.sender}
                    </span>
                    <div className={`px-4 py-3 rounded-xl border-2 shadow-[3px_3px_0px_rgba(0,0,0,0.2)] text-lg md:text-xl whitespace-pre-wrap max-w-[90%] ${vt323.className} ${
                      isMe 
                        ? 'bg-[#c49a6c] text-[#2a1a15] border-[#5c3a1a] rounded-tr-sm' 
                        : 'bg-[#f4e4bc] text-[#3e2723] border-[#8B5A2B] rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={historyBottomRef} className="h-4" />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. กล่องแชท Party (มุมขวาล่าง) */}
      {/* ========================================================= */}
      <div className="fixed bottom-6 right-6 z-[9999] pointer-events-auto">
        {!isPartyOpen ? (
          <button onClick={() => setIsPartyOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 relative group">
            <MessageSquareText size={24} />
            {partyMessages.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>}
          </button>
        ) : (
          <div className="flex flex-col bg-neutral-900/95 backdrop-blur-md border border-white/10 w-72 md:w-80 h-[350px] rounded-xl shadow-2xl font-sans overflow-hidden">
            <div className="flex justify-between items-center bg-blue-700 p-3 shrink-0">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <MessageSquareText size={16} /> Party
              </span>
              <button onClick={() => setIsPartyOpen(false)} className="text-white/70 hover:text-white hover:bg-white/20 p-1 rounded transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-hide">
              {partyMessages.length === 0 && <div className="text-center text-gray-500 text-xs italic mt-10">No messages yet.</div>}
              {partyMessages.map((msg, i) => {
                const isMe = msg.userId === currentUserId;
                return (
                  <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-gray-400 mb-1 px-1">{isMe ? 'You' : msg.sender}</span>
                    <div className={`px-3 py-1.5 rounded-lg text-sm shadow-md ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-neutral-700 text-gray-200 rounded-bl-none'}`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="p-2 border-t border-white/10 bg-neutral-800 shrink-0">
              <form onSubmit={handleSendParty} className="flex gap-2">
                <input
                  type="text"
                  value={partyInput}
                  onChange={(e) => setPartyInput(e.target.value)}
                  placeholder="Chat..."
                  className="flex-1 bg-black/50 border border-neutral-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none"
                />
                <button type="submit" disabled={!partyInput.trim()} className="p-1.5 bg-blue-600 rounded text-white disabled:opacity-50">
                  <Send size={14} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}