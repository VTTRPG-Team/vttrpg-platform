'use client'
import { useGameStore, DiceType } from '@/store/useGameStore'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function DiceControl() {
  const { diceState, addDiceRoll, debugUnlockDice } = useGameStore()
  const [currentUserId, setCurrentUserId] = useState<string>('local-user')
  const [myUsername, setMyUsername] = useState<string>('Player')

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUserId(data.user.id);
        const { data: prof } = await supabase.from('profiles').select('username').eq('id', data.user.id).single();
        if (prof?.username) {
            setMyUsername(prof.username.trim());
        }
      }
    }
    fetchUser();
  }, []);

  const handleDebugUnlockAll = async () => {
    debugUnlockDice(); 
    try {
      const roomId = window.location.pathname.split('/').pop(); 
      await fetch('/api/pusher/party-chat', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          roomId: roomId, 
          senderId: currentUserId, 
          actionType: 'DEBUG_UNLOCK' 
        }) 
      });
    } catch (e) {
      console.error("Failed to sync unlock", e);
    }
  };

  const handleRoll = async (type: DiceType) => {
    if (!diceState.canRoll) return;
    
    let max = 6;
    if (type === 'D8') max = 8;
    if (type === 'D20') max = 20;
    const finalResult = Math.floor(Math.random() * max) + 1;

    // 🌟 สร้าง ID ประจำตัวให้เต๋าลูกนี้
    const rollId = `roll-${Date.now()}-${currentUserId}`;

    // 1. โชว์เต๋าในจอตัวเอง (isLocal = true)
    addDiceRoll(rollId, currentUserId, myUsername, type, finalResult, true);

    // 2. ยิง Pusher ไปบอกเพื่อน พร้อมแนบ rollId ไปด้วย
    try {
      const roomId = window.location.pathname.split('/').pop(); 
      await fetch('/api/pusher/party-chat', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          roomId: roomId, 
          senderId: currentUserId, 
          actionType: 'DICE_ROLL', 
          diceData: { rollId: rollId, userId: currentUserId, username: myUsername, diceType: type, result: finalResult }
        }) 
      });
    } catch (e) {
      console.error("Failed to sync dice", e);
    }
  }

  const isDisabled = (type: DiceType): boolean => Boolean(!diceState.canRoll || (diceState.requiredDice && diceState.requiredDice !== type));

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      
      {/* Label & Debug Button */}
      <div className="flex items-center justify-between bg-black/70 text-white text-xs px-3 py-1 rounded-t-lg backdrop-blur-sm">
        <span>DICE CONTROL</span>
        <button 
          onClick={handleDebugUnlockAll} 
          className="text-yellow-400 hover:text-yellow-300 text-[10px] bg-white/10 px-1.5 rounded"
          title="Debug Force Roll for ALL"
        >
          🐞 Force All
        </button>
      </div>

      {/* Control Panel */}
      <div className="bg-black/80 backdrop-blur-md p-3 rounded-lg rounded-tr-none border border-white/10 shadow-xl flex gap-3 relative">
        
        {/* Lock Overlay */}
        {!diceState.canRoll && !diceState.isActive && (
           <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center z-10 backdrop-blur-[1px]">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest border border-gray-600 px-2 py-0.5 rounded-sm">Locked</span>
           </div>
        )}

        <button
          onClick={() => handleRoll('D6')}
          disabled={isDisabled('D6')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all ${isDisabled('D6') ? 'opacity-30 cursor-not-allowed grayscale' : 'hover:scale-110 hover:bg-white/10 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)]'} bg-cyan-900/50 border border-cyan-500/50 text-cyan-400`}
        >
          <span className="text-xs font-bold">D6</span>
        </button>

        <button
          onClick={() => handleRoll('D8')}
          disabled={isDisabled('D8')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all ${isDisabled('D8') ? 'opacity-30 cursor-not-allowed grayscale' : 'hover:scale-110 hover:bg-white/10 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)]'} bg-purple-900/50 border border-purple-500/50 text-purple-400`}
        >
          <span className="text-xs font-bold">D8</span>
        </button>

        <button
          onClick={() => handleRoll('D20')}
          disabled={isDisabled('D20')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all ${isDisabled('D20') ? 'opacity-30 cursor-not-allowed grayscale' : 'hover:scale-110 hover:bg-white/10 cursor-pointer shadow-[0_0_15px_rgba(249,115,22,0.4)]'} bg-orange-900/50 border border-orange-500/50 text-orange-400`}
        >
          <span className="text-xs font-bold">D20</span>
        </button>

      </div>
    </div>
  )
}