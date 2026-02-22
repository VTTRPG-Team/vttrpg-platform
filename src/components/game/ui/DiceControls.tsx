'use client'
import { useGameStore, DiceType } from '@/store/useGameStore'
import { Cinzel } from 'next/font/google'

const cinzel = Cinzel({ subsets: ['latin'], weight: ['700'] });

export default function DiceControl() {
  const { diceState, triggerDiceRoll, myUsername } = useGameStore()

  // 🌟 1. กฎเหล็ก: ถ้าไม่มีคำสั่งทอยจาก AI (requiredDice เป็น null) ซ่อน UI ทันที!
  if (!diceState.requiredDice) return null;

  // 🌟 2. เช็กว่าเป็นตาเราทอยหรือเปล่า? (เผื่อ AI ระบุชื่อคนทอย)
  const isMyTurnToRoll = 
    !diceState.targetPlayer || 
    diceState.targetPlayer === 'ALL' || 
    diceState.targetPlayer.toLowerCase() === myUsername?.toLowerCase();

  // ถ้าเป็นตาเพื่อนทอย เราจะขึ้นป้ายรอเพื่อนแทน
  if (!isMyTurnToRoll) {
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] bg-black/80 px-6 py-3 rounded-full backdrop-blur-md border-2 border-[#5d4037] shadow-[0_0_20px_rgba(0,0,0,0.8)]">
        <span className={`${cinzel.className} text-[#F4E4BC] text-sm animate-pulse`}>
          Waiting for {diceState.targetPlayer} to roll {diceState.requiredDice}...
        </span>
      </div>
    );
  }

  const handleRoll = () => {
    if (diceState.isRolling || diceState.isShowingResult) return;
    triggerDiceRoll(diceState.requiredDice as DiceType);
  }

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] flex flex-col items-center gap-4 pointer-events-auto w-full max-w-sm bg-black/60 p-8 rounded-xl backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[#3e2723]">
      
      {/* 🏷️ ป้ายประกาศว่าต้องทอยเต๋าอะไร */}
      <div className="bg-[#1a0f0a] px-6 py-2 rounded-full border border-[#F4E4BC]/50 text-[#F4E4BC] text-sm tracking-widest uppercase animate-pulse shadow-[0_0_15px_rgba(244,228,188,0.2)]">
        🎲 FATE DEMANDS A ROLL : {diceState.requiredDice}
      </div>

      {/* 🎲 ปุ่มกดทอยเต๋า (โชว์เฉพาะตัวที่โดนสั่ง) */}
      <div className="mt-4">
        <button
          onClick={handleRoll}
          disabled={diceState.isRolling || diceState.isShowingResult}
          className={`
            relative overflow-hidden group flex flex-col items-center justify-center w-28 h-28 rounded-2xl transition-all duration-300
            ${diceState.isRolling ? 'opacity-50 cursor-not-allowed scale-95' : 'hover:scale-110 hover:shadow-[0_0_30px_rgba(244,228,188,0.4)]'}
            bg-gradient-to-br from-[#2a1d15] to-[#1a0f0a] border-4 border-[#5d4037] hover:border-[#F4E4BC] text-[#F4E4BC]
          `}
        >
          {/* Effect แสงกวาดตอน Hover */}
          <div className="absolute inset-0 bg-[#F4E4BC] opacity-0 group-hover:opacity-10 transition-opacity" />
          
          <span className={`${cinzel.className} text-4xl font-bold z-10 drop-shadow-lg`}>
            {diceState.requiredDice}
          </span>
          <span className="text-[10px] text-[#a1887f] uppercase tracking-widest mt-2 z-10">
            Click to Roll
          </span>
        </button>
      </div>

      {/* ⏳ สถานะตอนกำลังกลิ้ง */}
      {diceState.isRolling && (
        <div className="text-center mt-2">
            <span className={`${cinzel.className} text-[#F4E4BC] text-sm bg-[#5d4037]/50 px-4 py-1 rounded-full animate-bounce inline-block`}>
                Rolling the dice...
            </span>
        </div>
      )}

    </div>
  )
}