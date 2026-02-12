'use client'
import { useGameStore, DiceType } from '@/store/useGameStore'

export default function DiceControls() {
  const { diceState, startRolling, manualStartRoll, toggleManualDice } = useGameStore()

  // เช็คว่าปุ่มควรกดได้ไหม
  const isButtonEnabled = (type: DiceType) => {
    // กรณี 1: AI สั่งมา
    if (diceState.isActive && diceState.requiredDice === type && !diceState.isRolling) return true;
    // กรณี 2: Manual Mode เปิดอยู่
    if (diceState.isManualMode && !diceState.isRolling) return true;
    
    return false;
  }

  // Handle Click
  const handleDiceClick = (type: DiceType) => {
    if (diceState.isManualMode) {
      // ถ้าเป็น Manual: สั่ง set เต๋า + เริ่มหมุน
      manualStartRoll(type);
    } else {
      // ถ้าเป็น AI Order: เริ่มหมุนอย่างเดียว
      startRolling();
    }
  }

  return (
    <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4 pointer-events-auto z-50">
      
      {/* --- MANUAL TOGGLE BUTTON --- */}
      {/* ปุ่มกดเพื่อปลดล็อกเต๋า (ทอยเอง) */}
      <button 
        onClick={toggleManualDice}
        disabled={diceState.isRolling || diceState.isActive} // ห้ามกดถ้ากำลังหมุน หรือ AI สั่งค้างไว้
        className={`
           flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-lg border
           ${diceState.isManualMode 
             ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/50' 
             : 'bg-neutral-900/80 text-gray-400 border-white/10 hover:bg-neutral-800 hover:text-white'
           }
           disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {diceState.isManualMode ? '🔓 Select Dice' : '🔒 Dice Locked'}
      </button>

      {/* --- DICE BUTTONS --- */}
      <div className="flex gap-6">
        {['D6', 'D8', 'D20'].map((type) => {
          const enabled = isButtonEnabled(type as DiceType);
          
          return (
            <button
              key={type}
              onClick={() => enabled && handleDiceClick(type as DiceType)}
              disabled={!enabled}
              className={`
                relative w-20 h-20 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl border-4 transition-all duration-300
                ${enabled 
                  ? diceState.isManualMode 
                      ? 'bg-white text-blue-900 border-blue-400 scale-105 cursor-pointer hover:scale-110' // Style แบบ Manual
                      : 'bg-gradient-to-br from-yellow-100 to-orange-500 text-black border-yellow-300 scale-110 animate-bounce cursor-pointer' // Style แบบ AI สั่ง
                  : 'bg-neutral-900/50 text-neutral-600 border-neutral-700 scale-100 cursor-not-allowed grayscale'
                }
              `}
            >
              {type}
              
              {/* Glow Effect */}
              {enabled && (
                <div className={`absolute inset-0 rounded-2xl blur-md animate-pulse ${diceState.isManualMode ? 'bg-blue-400/30' : 'bg-yellow-400/30'}`}></div>
              )}
            </button>
          )
        })}
      </div>
      
      {/* Message Hint */}
      {diceState.isActive && !diceState.isRolling && (
        <div className="text-yellow-400 font-bold text-xs animate-pulse">⚠️ AI REQUESTS A ROLL!</div>
      )}
       {diceState.isManualMode && !diceState.isRolling && (
        <div className="text-blue-300 font-bold text-xs">👉 Pick a dice to roll</div>
      )}

    </div>
  )
}