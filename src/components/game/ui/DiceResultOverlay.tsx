'use client'
import { useGameStore, DiceType, DiceRollData } from '@/store/useGameStore'
import { useEffect, useState } from 'react'

// --- Component ลูกเต๋า 1 ลูก (แยกออกมาเพื่อให้จัดการ Animation ตัวเองได้อิสระ) ---
function SingleDice({ roll }: { roll: DiceRollData }) {
  const { finishDiceRoll } = useGameStore()
  const [displayNum, setDisplayNum] = useState<number>(1)

  useEffect(() => {
    if (!roll.isRolling) {
      setDisplayNum(roll.result);
      return;
    }

    // สุ่มเลขเริ่มต้น
    setDisplayNum(Math.floor(Math.random() * (roll.diceType === 'D20' ? 20 : 6)) + 1);
    
    const duration = 800; // หมุน 0.8 วินาที
    const intervalTime = 50;
    const startTime = Date.now();

    const spinInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        const maxVal = roll.diceType === 'D8' ? 8 : roll.diceType === 'D20' ? 20 : 6;
        setDisplayNum(Math.floor(Math.random() * maxVal) + 1);
      } else {
        clearInterval(spinInterval);
        setDisplayNum(roll.result); 
        finishDiceRoll(roll.id); // บอก Store ว่าลูกนี้หมุนเสร็จแล้ว
      }
    }, intervalTime);

    return () => clearInterval(spinInterval);
  }, [roll.isRolling, roll.result, roll.diceType, roll.id, finishDiceRoll]);

  const getShapeClasses = (type: DiceType) => {
    switch (type) {
      case 'D6': return 'bg-cyan-500 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.6)] aspect-square';
      case 'D8': return 'bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.6)] [clip-path:polygon(50%_0%,_100%_25%,_100%_75%,_50%_100%,_0%_75%,_0%_25%)] scale-110 aspect-square';
      case 'D20': return 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)] [clip-path:polygon(25%_0%,_75%_0%,_100%_50%,_75%_100%,_25%_100%,_0%_50%)] scale-110 aspect-square';
      default: return 'bg-gray-500 rounded-full aspect-square';
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 transition-all duration-500 animate-fade-in">
      {/* ลูกเต๋า */}
      <div className={`relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 transition-transform duration-300 ${roll.isRolling ? 'scale-90' : 'scale-100 bounce-end'} ${getShapeClasses(roll.diceType)}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-black/20 pointer-events-none" />
        <span className={`font-black text-4xl sm:text-5xl text-white drop-shadow-md z-10 ${roll.isRolling ? 'blur-[1px] opacity-80' : 'scale-110 transition-transform duration-200'}`}>
          {displayNum}
        </span>
      </div>
      
      {/* ชื่อคนทอย */}
      <div className="bg-black/80 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-md font-bold text-xs max-w-[120px] truncate shadow-lg">
        {roll.username}
      </div>
    </div>
  )
}

// --- Main Overlay (ลานประลอง) ---
export default function DiceResultOverlay() {
  const { diceState, closeDiceArena } = useGameStore()
  const { activeRolls, isActive, requiredDice } = diceState

  // ปิดหน้าต่างอัตโนมัติเมื่อทุกคนทอยเสร็จแล้ว
  useEffect(() => {
    if (!isActive || activeRolls.length === 0) return;

    const allFinished = activeRolls.every(roll => !roll.isRolling);
    if (allFinished) {
      // รอให้ดูผล 3 วินาที แล้วปิดลานเต๋า
      const timer = setTimeout(() => {
        closeDiceArena();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isActive, activeRolls, closeDiceArena]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none bg-black/40 backdrop-blur-[2px] animate-fade-in">
      
      {/* หัวข้อบอกว่าทอยอะไรอยู่ */}
      {requiredDice && (
        <div className="absolute top-24 bg-gradient-to-r from-transparent via-black/80 to-transparent w-full text-center py-4">
           <h2 className="text-white text-2xl font-black tracking-widest uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
             ROLL {requiredDice}
           </h2>
        </div>
      )}

      {/* ลานวางเต๋า (ใช้ Flex wrap เพื่อให้จัดเรียงกึ่งกลางสวยๆ ไม่ว่าจะมีกี่ลูก) */}
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 max-w-4xl p-8">
        {activeRolls.map((roll) => (
          <SingleDice key={roll.id} roll={roll} />
        ))}
      </div>
      
    </div>
  )
}