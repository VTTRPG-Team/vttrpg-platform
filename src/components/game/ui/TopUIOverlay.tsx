'use client'
import { useGameStore } from '@/store/useGameStore'
import GameControls from './GameControls'
import AudioEngine from './AudioEngine'

interface TopUIOverlayProps {
  roomId: string;
  gmType?: string;
}

export default function TopUIOverlay({ roomId, gmType }: TopUIOverlayProps) {
  const { viewMode, toggleView, cameraZoom, setCameraZoom } = useGameStore()

  return (
    <div className="w-full flex justify-between items-start z-50 pointer-events-none">
      {/* 🏷️ ฝั่งซ้าย: Room ID */}
      <div className="bg-black/40 backdrop-blur px-4 py-2 rounded-lg border border-white/10 text-white text-sm font-mono shadow-lg pointer-events-auto">
        ROOM: <span className="text-yellow-400">{roomId}</span>
      </div>
      
      {/* 🕹️ ฝั่งขวา: เครื่องมือทั้งหมดวางเรียงกันแนวนอน */}
      <div className="flex items-center gap-2 pointer-events-auto">
        
        {/* จัดการเรื่องเสียง (Hidden) */}
        <AudioEngine />

        {/* 🔍 แผง Camera Zoom (ย้ายมาไว้ข้างซ้ายของปุ่ม View) */}
        <div className="bg-black/60 backdrop-blur h-[42px] px-3 rounded-lg border border-white/10 flex items-center gap-3 shadow-lg">
          <span className="text-[9px] text-blue-400 font-bold uppercase tracking-tighter whitespace-nowrap">Zoom</span>
          <div className="flex gap-1">
            <button 
              onClick={() => setCameraZoom(Math.max(0.5, cameraZoom - 0.1))}
              className="w-10 bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] py-1 rounded border border-white/5 transition-colors font-bold"
            > OUT </button>
            <button 
              onClick={() => setCameraZoom(Math.min(2.5, cameraZoom + 0.1))}
              className="w-10 bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] py-1 rounded border border-white/5 transition-colors font-bold"
            > IN </button>
          </div>
        </div>

        {/* 👁️ ปุ่มสลับมุมมอง */}
        <button 
          onClick={toggleView} 
          className="bg-neutral-800/80 hover:bg-neutral-700 border border-white/20 text-white h-[42px] px-4 rounded-lg font-bold text-sm transition-all shadow-lg min-w-[130px]"
        >
          {viewMode === 'PERSPECTIVE' ? '👁 View: Table' : '♟ View: Board'}
        </button>

        {/* ⏸️ ปุ่มควบคุมหลัก (Pause/Exit) */}
        <div className="h-[42px] flex items-center">
          <GameControls gmType={gmType} />
        </div>
        
      </div>
    </div>
  )
}