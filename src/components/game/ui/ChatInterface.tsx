'use client'
import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '@/store/useGameStore'

export default function ChatInterface() {
  const { 
    messages, addMessage, activeTab, setActiveTab,
    aiStatus, setAiStatus, turnCount,
    timeLeft, decrementTime, waitingFor,
    submitPlayerAction
  } = useGameStore()

  const [inputText, setInputText] = useState('')
  
  // สำหรับ Typewriter Effect (AI พิมพ์ทีละตัว)
  const [displayedAiText, setDisplayedAiText] = useState('') 
  const fullAiTextRef = useRef('') 

  // --- 1. Filter Message Logic ---
  // กรองตาม activeTab และ channel
  const filteredMessages = messages.filter(msg => {
    if (activeTab === 'PARTY') return msg.channel === 'PARTY';
    if (activeTab === 'AI_GM') return msg.channel === 'AI';
    return false;
  });

  // --- 2. Timer Logic ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (aiStatus === 'PLAYER_TURN' && timeLeft > 0) {
      timer = setInterval(() => decrementTime(), 1000)
    }
    return () => clearInterval(timer)
  }, [aiStatus, timeLeft, decrementTime])

  // --- 3. AI Behavior Logic ---
  useEffect(() => {
    // สถานะ: กำลังคิด (Thinking)
    if (aiStatus === 'THINKING') {
      setTimeout(() => {
        // สร้าง Mock Text
        let mockText = `[Turn ${turnCount + 1}] AI GM Analysis:\n`;
        for(let i=1; i<=10; i++) mockText += `> Simulating outcome for action scenario line ${i}...\n`;
        
        fullAiTextRef.current = mockText;
        setDisplayedAiText('');
        setAiStatus('TYPING');
      }, 2000) // คิด 2 วินาที
    }

    // สถานะ: กำลังพิมพ์ (Typing Animation)
    if (aiStatus === 'TYPING') {
        let i = 0;
        const text = fullAiTextRef.current;
        const typingInterval = setInterval(() => {
            setDisplayedAiText(text.substring(0, i));
            i++;
            if (i > text.length) {
                clearInterval(typingInterval);
                // พิมพ์เสร็จ -> บันทึกลง Store (Channel AI)
                addMessage('AI GM', text, 'AI', 'AI');
                setDisplayedAiText('');
                // เริ่มตาใหม่
                useGameStore.setState({ aiStatus: 'PLAYER_TURN', timeLeft: 60, turnCount: turnCount + 1 });
            }
        }, 10); // ความเร็วในการพิมพ์ (ms)
        return () => clearInterval(typingInterval);
    }
  }, [aiStatus, turnCount, addMessage, setAiStatus])

  // --- 4. Handle Send ---
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    if (activeTab === 'PARTY') {
      // แชท Party: ส่งเลย, channel = PARTY
      addMessage('Player', inputText, 'USER', 'PARTY');
    } else {
      // แชท AI: ส่งผ่าน Action, channel = AI
      if (aiStatus !== 'PLAYER_TURN') return;
      submitPlayerAction(inputText);
    }
    setInputText('')
  }

  return (
    <div className="flex flex-col h-full bg-neutral-900/95 backdrop-blur-md border-r border-white/10 w-96 shadow-2xl font-sans">
      
      {/* === TABS === */}
      <div className="flex border-b border-white/10">
        <button 
          onClick={() => setActiveTab('PARTY')}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'PARTY' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-400 hover:bg-white/5'}`}
        >
          👥 Party
        </button>
        <button 
          onClick={() => setActiveTab('AI_GM')}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'AI_GM' ? 'bg-purple-600 text-white' : 'bg-transparent text-gray-400 hover:bg-white/5'}`}
        >
          🤖 AI Action
        </button>
      </div>

      {/* === STATUS BAR (Only for AI Tab) === */}
      {activeTab === 'AI_GM' && (
        <div className="bg-neutral-800 p-2 border-b border-white/5 min-h-[60px] flex flex-col justify-center">
           {aiStatus === 'THINKING' && <div className="text-yellow-400 text-xs animate-pulse text-center font-bold">🧠 AI is processing...</div>}
           
           {aiStatus === 'TYPING' && <div className="text-purple-400 text-xs text-center font-bold">✍️ AI is narrating...</div>}
           
           {aiStatus === 'WAITING_OTHERS' && (
             <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Waiting for party...</div>
                <div className="flex gap-1 justify-center flex-wrap">
                  {waitingFor.map((p, i) => (
                    <span key={i} className="bg-red-900/50 text-red-200 text-[10px] px-2 py-0.5 rounded border border-red-500/30 animate-pulse">
                      {p}
                    </span>
                  ))}
                </div>
             </div>
           )}

           {aiStatus === 'PLAYER_TURN' && (
             <div className="space-y-1">
               <div className="flex justify-between text-xs text-white font-bold">
                 <span>YOUR ACTION REQUIRED</span>
                 <span className={`${timeLeft < 10 ? 'text-red-500' : 'text-green-500'}`}>{timeLeft}s</span>
               </div>
               <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
                 <div 
                    className={`h-full transition-all duration-1000 ${timeLeft < 10 ? 'bg-red-500' : 'bg-green-500'}`} 
                    style={{ width: `${(timeLeft / 60) * 100}%` }}
                 ></div>
               </div>
             </div>
           )}
        </div>
      )}

      {/* === MESSAGE LIST === */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {filteredMessages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender.includes('Player') ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] text-gray-500 mb-1">{msg.sender}</span>
            <div className={`px-3 py-2 rounded-lg max-w-[95%] text-sm whitespace-pre-wrap ${
              msg.type === 'AI' ? 'bg-purple-900/50 text-purple-100 border border-purple-500/30' :
              msg.sender.includes('Player') ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-gray-200'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* Realtime Typing Display (AI) */}
        {activeTab === 'AI_GM' && aiStatus === 'TYPING' && (
           <div className="flex flex-col items-start">
             <span className="text-[10px] text-purple-400 mb-1">AI GM</span>
             <div className="px-3 py-2 rounded-lg max-w-[95%] text-sm bg-purple-900/50 text-purple-100 border border-purple-500/30 whitespace-pre-wrap">
               {displayedAiText}<span className="animate-pulse">|</span>
             </div>
           </div>
        )}
      </div>

      {/* === INPUT AREA === */}
      <div className="p-3 border-t border-white/10 bg-neutral-800/80">
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              // Logic: ล็อค 40 ตัว ถ้าอยู่หน้า AI
              maxLength={activeTab === 'AI_GM' ? 40 : undefined} 
              disabled={activeTab === 'AI_GM' && aiStatus !== 'PLAYER_TURN'}
              placeholder={activeTab === 'PARTY' ? "Chat with party..." : "Action (Max 40 chars)..."}
              className={`w-full bg-black/50 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 disabled:opacity-50 ${
                  activeTab === 'AI_GM' ? 'border-purple-500 focus:ring-purple-500 pr-12' : 'border-neutral-600 focus:ring-blue-500'
              }`}
            />
            {/* Counter (AI Only) */}
            {activeTab === 'AI_GM' && (
              <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${inputText.length >= 40 ? 'text-red-500' : 'text-gray-500'}`}>
                {inputText.length}/40
              </span>
            )}
          </div>

          {/* Button (Mobile Support) */}
          <button 
            type="submit"
            disabled={!inputText.trim() || (activeTab === 'AI_GM' && aiStatus !== 'PLAYER_TURN')}
            className={`p-2 rounded-lg font-bold text-white transition-all shadow-lg flex items-center justify-center ${
                activeTab === 'AI_GM' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-blue-600 hover:bg-blue-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {/* SVG Send Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>

        </form>
      </div>
    </div>
  )
}