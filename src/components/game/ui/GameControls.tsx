'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/useGameStore'

export default function GameControls() {
  const router = useRouter()
  const { isPaused, togglePause, voteStatus, startExitVote, castVote, resetVote } = useGameStore()

  // ฟังก์ชันจำลองเพื่อนช่วยโหวต (Mock)
  const handleStartVote = () => {
    startExitVote()
    setTimeout(() => { console.log("Friend 1 voted"); castVote() }, 1000)
    setTimeout(() => { console.log("Friend 2 voted"); castVote() }, 2000)
  }

  // Effect: ตรวจสอบว่าโหวตผ่านหรือยัง ถ้าผ่านให้ดีดกลับหน้าแรก
  useEffect(() => {
    if (voteStatus.isFinished) {
      setTimeout(() => {
        alert("✅ Game Over! Redirecting to Home...");
        resetVote();
        router.push('/'); // ดีดกลับหน้าแรก
      }, 500);
    }
  }, [voteStatus.isFinished, router, resetVote])

  return (
    <>
      {/* 1. ปุ่มควบคุม (Pause / Exit) */}
      <div className="flex gap-2 pointer-events-auto">
        <button 
          onClick={togglePause}
          className={`px-4 py-2 rounded-lg font-bold shadow-lg transition-all border text-sm flex items-center gap-2 ${
            isPaused 
              ? 'bg-yellow-500 text-black border-yellow-400 animate-pulse' 
              : 'bg-neutral-800/80 text-white border-white/20 hover:bg-neutral-700'
          }`}
        >
          {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
        </button>

        <button 
          onClick={handleStartVote}
          disabled={voteStatus.isActive}
          className="px-4 py-2 bg-red-900/80 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg border border-red-500 transition-all text-sm disabled:opacity-50"
        >
          EXIT
        </button>
      </div>

      {/* 2. Pause Overlay (หน้าจอหยุดเกม) */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] pointer-events-auto">
          <div className="text-center">
            <h2 className="text-5xl font-black text-white mb-4 tracking-widest">PAUSED</h2>
            <p className="text-gray-400 mb-6">Game Master halted the session</p>
            <button 
              onClick={togglePause} 
              className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-110 transition-transform"
            >
              Resume Game
            </button>
          </div>
        </div>
      )}

      {/* 3. Vote Overlay (หน้าต่างโหวตมุมขวาล่าง) */}
      {voteStatus.isActive && (
        <div className="fixed bottom-20 right-4 w-72 bg-neutral-900 border border-red-500 p-4 rounded-xl shadow-2xl z-[100] pointer-events-auto animate-bounce-in">
          <div className="flex justify-between items-center mb-2">
             <h3 className="text-red-500 font-bold uppercase text-xs">Vote to Exit</h3>
             <span className="text-xs text-gray-400">{voteStatus.yesVotes}/{voteStatus.neededVotes}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-700 h-2 rounded-full mb-4 overflow-hidden">
            <div 
               className="bg-red-500 h-full transition-all duration-500" 
               style={{ width: `${(voteStatus.yesVotes / voteStatus.neededVotes) * 100}%` }}
            ></div>
          </div>
          
          <div className="flex gap-2">
             <button onClick={castVote} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-xs font-bold">VOTE YES</button>
             <button onClick={resetVote} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded text-xs">CANCEL</button>
          </div>
        </div>
      )}
    </>
  )
}