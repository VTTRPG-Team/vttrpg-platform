'use client'
import { use } from 'react' // <--- 1. เพิ่ม import use
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { useGameStore } from '@/store/useGameStore'
import CameraManager from '@/components/game/CameraManager'
import TableBoard from '@/components/game/TableBoard'
import ChatInterface from '@/components/game/ui/ChatInterface'
import GameControls from '@/components/game/ui/GameControls'

// 2. แก้ Type ของ params ให้เป็น Promise
export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  // 3. ใช้ use() เพื่อดึงค่า id ออกมาจาก Promise
  const { id } = use(params) 

  const { viewMode, toggleView } = useGameStore()

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black font-sans">
      
      {/* === LAYER 0: 3D WORLD === */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows>
          <CameraManager /> 
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 15, 10]} castShadow />
          <Stars />
          <TableBoard />    
          {/* Mock Players */}
          <mesh position={[-5, 0, 0]}><boxGeometry args={[1,2,1]} /><meshStandardMaterial color="red"/></mesh>
          <mesh position={[5, 0, 0]}><boxGeometry args={[1,2,1]} /><meshStandardMaterial color="blue"/></mesh>
        </Canvas>
      </div>

      {/* === LAYER 1: UI OVERLAY === */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between">
        
        {/* --- HEADER BAR --- */}
        <div className="w-full p-4 flex justify-between items-start z-50">
           
           {/* Room Info */}
           <div className="bg-black/40 backdrop-blur px-4 py-2 rounded-lg border border-white/10 text-white text-sm font-mono shadow-lg">
              {/* 4. ใช้ตัวแปร id ที่แกะออกมาแล้ว ตรงนี้ */}
              ROOM: <span className="text-yellow-400">{id}</span>
           </div>
           
           {/* Controls Area */}
           <div className="flex items-center gap-3">
             <button 
               onClick={toggleView}
               className="pointer-events-auto bg-neutral-800/80 hover:bg-neutral-700 border border-white/20 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg min-w-[140px]"
             >
               {viewMode === 'PERSPECTIVE' ? '👁 View: Table' : '♟ View: Board'}
             </button>
             
             <GameControls />
           </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex-1 flex overflow-hidden relative">
           <div className={`h-full z-20 transition-transform duration-500 ease-in-out pointer-events-auto shadow-2xl ${
             viewMode === 'TOP_DOWN' ? 'translate-x-0' : '-translate-x-full'
           }`}>
             <ChatInterface />
           </div>
        </div>
      </div>

    </main>
  )
}