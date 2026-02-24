'use client'
import { useGameStore, DiceType } from '@/store/useGameStore'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { Cinzel } from 'next/font/google'

const cinzel = Cinzel({ subsets: ['latin'], weight: ['700'] });

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
        if (prof?.username) setMyUsername(prof.username.trim());
      }
    }
    fetchUser();
  }, []);

  if (!diceState.requiredDice) return null;

  const isMyTurnToRoll = 
    !diceState.targetPlayers || 
    diceState.targetPlayers.length === 0 || 
    diceState.targetPlayers.includes('ALL') || 
    diceState.targetPlayers.some(p => p.trim().toLowerCase() === myUsername.toLowerCase());

  const myRoll = diceState.activeRolls.find(r => r.userId === currentUserId);
  const isRolling = myRoll?.isRolling || false;
  const hasRolled = !!myRoll;

  const getMaxVal = (type: DiceType) => {
      switch(type) {
          case 'D4': return 4; case 'D6': return 6; case 'D8': return 8;
          case 'D10': return 10; case 'D12': return 12; case 'D20': return 20;
          case 'D100': return 100; default: return 6;
      }
  }

  if (!isMyTurnToRoll) {
    return (
      // 🌟 ย้ายมาอยู่ด้านล่าง (bottom-10) และจัดกึ่งกลาง
      <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[9999] flex items-center justify-center pointer-events-none w-full">
          <div className="bg-[#1a0f0a]/95 px-6 py-3 rounded-full border-2 border-[#5d4037] shadow-[0_0_30px_rgba(0,0,0,1)] flex items-center gap-3">
            <span className={`${cinzel.className} text-[#F4E4BC] text-sm md:text-base animate-pulse`}>
              Waiting for {diceState.targetPlayers?.join(', ') || 'someone'} to roll {diceState.requiredDice}...
            </span>
          </div>
      </div>
    );
  }

  const handleDebugUnlockAll = async () => {
    debugUnlockDice(); 
    try {
      const roomId = window.location.pathname.split('/').pop(); 
      await fetch('/api/pusher/game-event', { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ roomId: roomId, senderId: currentUserId, actionType: 'DEBUG_UNLOCK' }) 
      });
    } catch (e) { console.error(e); }
  };

  const handleRoll = async () => {
    if (hasRolled || !diceState.canRoll) return;
    
    const type = diceState.requiredDice as DiceType;
    const max = getMaxVal(type);
    const finalResult = Math.floor(Math.random() * max) + 1;
    const rollId = `roll-${Date.now()}-${currentUserId}`;

    addDiceRoll(rollId, currentUserId, myUsername, type, finalResult, true);

    try {
      const roomId = window.location.pathname.split('/').pop(); 
      await fetch('/api/pusher/game-event', { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          roomId: roomId, senderId: currentUserId, actionType: 'DICE_ROLL', 
          diceData: { rollId, userId: currentUserId, username: myUsername, diceType: type, result: finalResult }
        }) 
      });
    } catch (e) { console.error(e); }
  }

  return (
    // 🌟 ย้ายมาอยู่ด้านล่าง (bottom-12) เพื่อไม่ให้บังลูกเต๋าที่กำลังหมุนกลางจอ
    <div className="fixed bottom-12 left-1/2 transform -translate-x-1/2 z-[9999] flex flex-col items-center pointer-events-none scale-90 md:scale-100 origin-bottom">
        
        {/* ล็อคขนาดกล่องไว้ที่ w-80 h-80 กันมันหดหรือเบี้ยว */}
        <div className="relative flex flex-col items-center justify-between w-80 h-80 bg-[#1a0f0a]/95 p-6 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,1)] border-2 border-[#5d4037] pointer-events-auto">
          
          {/* ปุ่ม Debug ย้ายมาหลบมุมขวาบนแบบ Absolute */}
          <button onClick={handleDebugUnlockAll} className="absolute top-3 right-3 text-[#8B5A2B] hover:text-[#d4af37] text-[10px] bg-black/50 border border-[#5d4037] px-2 py-1 rounded transition-colors z-50">
            🐞 Unlock
          </button>

          <div className="bg-black px-6 py-2 rounded-full border border-[#F4E4BC]/50 text-[#F4E4BC] text-sm tracking-widest uppercase animate-pulse shadow-[0_0_15px_rgba(244,228,188,0.3)] mt-2">
            🎲 ROLL: {diceState.requiredDice}
          </div>

          <div className="relative flex-1 flex items-center justify-center w-full mt-2">
            {!diceState.canRoll && !hasRolled && (
              // ล็อคขนาด overlay ให้เท่ากับปุ่มเป๊ะๆ (w-36 h-36)
              <div className="absolute inset-0 m-auto w-36 h-36 bg-black/70 rounded-2xl flex items-center justify-center z-20 backdrop-blur-[2px]">
                  <span className="text-xs text-[#F4E4BC] font-bold uppercase tracking-widest border border-[#F4E4BC] px-2 py-0.5 rounded-sm bg-black/80">Locked</span>
              </div>
            )}
            {/* ขยายปุ่มให้ใหญ่ขึ้นนิดนึง (w-36 h-36) จะได้ไม่อึดอัด */}
            <button onClick={handleRoll} disabled={!diceState.canRoll || hasRolled} className={`relative overflow-hidden group flex flex-col items-center justify-center w-36 h-36 rounded-2xl transition-all duration-300 ${!diceState.canRoll || hasRolled ? 'opacity-50 cursor-not-allowed scale-95' : 'hover:scale-110 hover:shadow-[0_0_30px_rgba(244,228,188,0.5)]'} bg-gradient-to-br from-[#2a1d15] to-black border-4 border-[#5d4037] hover:border-[#F4E4BC] text-[#F4E4BC]`}>
              <div className="absolute inset-0 bg-[#F4E4BC] opacity-0 group-hover:opacity-10 transition-opacity" />
              <span className={`${cinzel.className} text-6xl font-bold z-10 drop-shadow-xl`}>{diceState.requiredDice}</span>
              <span className="text-[10px] text-[#a1887f] uppercase tracking-widest mt-2 z-10">{hasRolled ? 'Rolled' : 'Click to Roll'}</span>
            </button>
          </div>

          {/* เว้นที่ว่างไว้เผื่อข้อความ Rolling จะได้ไม่ดันเลย์เอาต์ */}
          <div className="h-8 flex items-end">
            {isRolling && (
                <span className={`${cinzel.className} text-[#F4E4BC] text-sm bg-black/50 px-4 py-1 rounded-full animate-bounce border border-[#5d4037]`}>Rolling the dice...</span>
            )}
          </div>
        </div>

    </div>
  )
}