'use client'
import { useGameStore, DiceType } from '@/store/useGameStore'

export default function DiceControl() {
  const { diceState, triggerDiceRoll } = useGameStore()

  // ฟังก์ชันสำหรับกดปุ่มทอย
  const handleRoll = (type: DiceType) => {
    // ถ้ากำลังทอยอยู่ หรือกำลังโชว์ผล ห้ามกดซ้ำ
    if (diceState.isRolling || diceState.isShowingResult) return;
    
    triggerDiceRoll(type);
  }

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      
      {/* Label */}
      <div className="bg-black/70 text-white text-xs px-3 py-1 rounded-t-lg text-center backdrop-blur-sm">
        DICE CONTROL
      </div>

      {/* Control Panel */}
      <div className="bg-black/80 backdrop-blur-md p-3 rounded-lg rounded-tr-none border border-white/10 shadow-xl flex gap-3">
        
        {/* D6 Button */}
        <button
          onClick={() => handleRoll('D6')}
          disabled={diceState.isRolling || diceState.isShowingResult}
          className={`
            flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all
            ${diceState.isActive ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 hover:bg-white/10'}
            bg-cyan-900/50 border border-cyan-500/30 text-cyan-400
          `}
        >
          <span className="text-xs font-bold">D6</span>
        </button>

        {/* D8 Button */}
        <button
          onClick={() => handleRoll('D8')}
          disabled={diceState.isRolling || diceState.isShowingResult}
          className={`
            flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all
            ${diceState.isActive ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 hover:bg-white/10'}
            bg-purple-900/50 border border-purple-500/30 text-purple-400
          `}
        >
          <span className="text-xs font-bold">D8</span>
        </button>

        {/* D20 Button */}
        <button
          onClick={() => handleRoll('D20')}
          disabled={diceState.isRolling || diceState.isShowingResult}
          className={`
            flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all
            ${diceState.isActive ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 hover:bg-white/10'}
            bg-orange-900/50 border border-orange-500/30 text-orange-400
          `}
        >
          <span className="text-xs font-bold">D20</span>
        </button>

      </div>

      {/* Status Indicator (Optional: บอกสถานะว่าทำอะไรอยู่) */}
      {diceState.isActive && (
        <div className="text-center">
            <span className="text-[10px] text-white/70 bg-black/50 px-2 py-0.5 rounded-full">
                {diceState.isRolling ? 'Rolling...' : 'Result...'}
            </span>
        </div>
      )}

    </div>
  )
}