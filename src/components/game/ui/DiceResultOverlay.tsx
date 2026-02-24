'use client'
import { useGameStore, DiceType, DiceRollData } from '@/store/useGameStore'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function SingleDice({ roll }: { roll: DiceRollData }) {
  const { finishDiceRoll } = useGameStore()
  const [displayNum, setDisplayNum] = useState<number>(1)

  const getMaxVal = (type: DiceType) => {
      switch(type) {
          case 'D4': return 4; case 'D6': return 6; case 'D8': return 8;
          case 'D10': return 10; case 'D12': return 12; case 'D20': return 20;
          case 'D100': return 100; default: return 6;
      }
  }

  useEffect(() => {
    if (!roll.isRolling) { setDisplayNum(roll.result); return; }
    
    const maxVal = getMaxVal(roll.diceType);
    setDisplayNum(Math.floor(Math.random() * maxVal) + 1);
    
    const duration = 800; const intervalTime = 50; const startTime = Date.now();
    const spinInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        setDisplayNum(Math.floor(Math.random() * maxVal) + 1);
      } else {
        clearInterval(spinInterval);
        setDisplayNum(roll.result); 
        finishDiceRoll(roll.id); 
      }
    }, intervalTime);
    return () => clearInterval(spinInterval);
  }, [roll.isRolling, roll.result, roll.diceType, roll.id, finishDiceRoll]);

  const getShapeClasses = (type: DiceType) => {
    switch (type) {
      case 'D4': return 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.6)] [clip-path:polygon(50%_0%,_0%_100%,_100%_100%)] pt-6 aspect-square'; 
      case 'D6': return 'bg-cyan-600 rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.6)] aspect-square'; 
      case 'D8': return 'bg-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.6)] [clip-path:polygon(50%_0%,_100%_50%,_50%_100%,_0%_50%)] scale-110 aspect-square'; 
      case 'D10': return 'bg-emerald-600 shadow-[0_0_20px_rgba(5,150,105,0.6)] [clip-path:polygon(50%_0%,_100%_40%,_50%_100%,_0%_40%)] scale-110 aspect-square pb-4'; 
      case 'D12': return 'bg-pink-600 shadow-[0_0_20px_rgba(219,39,119,0.6)] [clip-path:polygon(50%_0%,_100%_38%,_82%_100%,_18%_100%,_0%_38%)] scale-110 aspect-square'; 
      case 'D20': return 'bg-orange-600 shadow-[0_0_20px_rgba(234,88,12,0.6)] [clip-path:polygon(25%_0%,_75%_0%,_100%_50%,_75%_100%,_25%_100%,_0%_50%)] scale-110 aspect-square'; 
      case 'D100': return 'bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.6)] scale-105 aspect-square border-4 border-blue-400'; 
      default: return 'bg-gray-500 rounded-full aspect-square';
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 transition-all duration-500 animate-fade-in">
      <div className={`relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 transition-transform duration-300 ${roll.isRolling ? 'scale-90' : 'scale-100 bounce-end'} ${getShapeClasses(roll.diceType)}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-black/20 pointer-events-none" />
        <span className={`font-black text-4xl sm:text-5xl text-white drop-shadow-md z-10 ${roll.isRolling ? 'blur-[1px] opacity-80' : 'scale-110 transition-transform duration-200'}`}>{displayNum}</span>
      </div>
      <div className="bg-[#1a0f0a]/90 backdrop-blur-md border border-[#5d4037] text-[#F4E4BC] px-4 py-1.5 rounded-md font-bold text-xs max-w-[140px] truncate shadow-[0_0_10px_rgba(0,0,0,1)]">
        {roll.username}
      </div>
    </div>
  )
}

export default function DiceResultOverlay() {
  const { diceState, closeDiceArena } = useGameStore()
  const { activeRolls, isActive, requiredDice, targetPlayers } = diceState
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  
  // 🌟 THE FIX: รีเซ็ตคำเตือนทุกครั้งที่มีการเปิดลานเต๋าใหม่
  useEffect(() => {
    if (isActive) {
        setTimeoutWarning(false);
    }
  }, [isActive]);

  // 🌟 ลอจิก 1: ปิดอัตโนมัติเมื่อคนที่โดนระบุชื่อทอยครบ
  useEffect(() => {
    if (!isActive || activeRolls.length === 0) return;
    const allFinished = activeRolls.every(roll => !roll.isRolling);
    
    if (allFinished) {
      // ตรวจสอบเฉพาะถ้ามีการระบุชื่อเป้าหมายชัดเจน (ไม่เอา ALL)
      const isTargetedRoll = targetPlayers && targetPlayers.length > 0 && !targetPlayers.includes('ALL');

      if (isTargetedRoll) {
          let hasAllRequiredPlayers = true;
          for (const reqPlayer of targetPlayers) {
            const hasRolled = activeRolls.some(roll => roll.username.trim().toLowerCase() === reqPlayer.trim().toLowerCase());
            if (!hasRolled) { hasAllRequiredPlayers = false; break; }
          }
          
          if (hasAllRequiredPlayers) {
            const timer = setTimeout(() => closeDiceArena(), 3000);
            return () => clearTimeout(timer);
          }
      }
    }
  }, [isActive, activeRolls, targetPlayers, closeDiceArena]);

  // 🌟 ลอจิก 2: ระบบความปลอดภัย ปิดหน้าจอเมื่อรอเกิน 15 วินาที
  useEffect(() => {
    if (!isActive) return;
    
    // โชว์ป้ายเตือนตอนวินาทีที่ 15
    const warningTimer = setTimeout(() => {
        setTimeoutWarning(true);
    }, 15000); 
    
    // ปิดลานเต๋าทิ้งในวินาทีที่ 18
    const closeTimer = setTimeout(() => {
        closeDiceArena();
    }, 18000); 
    
    return () => {
        clearTimeout(warningTimer);
        clearTimeout(closeTimer);
    };
  }, [isActive, closeDiceArena]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[9900] flex flex-col items-center justify-center pointer-events-none bg-black/60 backdrop-blur-sm animate-fade-in">
      {requiredDice && (
        <div className="absolute top-24 bg-gradient-to-r from-transparent via-black/90 to-transparent w-full text-center py-4 border-y border-[#5d4037]/50">
           <h2 className="text-[#F4E4BC] text-3xl font-black tracking-widest uppercase drop-shadow-[0_0_15px_rgba(244,228,188,0.5)]">ROLL {requiredDice}</h2>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 max-w-5xl p-8 mt-10">
        {activeRolls.map((roll) => <SingleDice key={roll.id} roll={roll} />)}
      </div>
      {timeoutWarning && (
        <div className="absolute bottom-24 bg-red-950/90 border-2 border-red-500 text-red-200 px-6 py-3 rounded-lg backdrop-blur-md animate-pulse text-center shadow-[0_0_20px_rgba(220,38,38,0.5)]">
          <p className="font-bold text-sm">⚠️ Concluding the rolls...</p>
        </div>
      )}
    </div>
  )
}