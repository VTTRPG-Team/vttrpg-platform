'use client'
import { use } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { Physics, usePlane } from '@react-three/cannon'

// Store
import { useGameStore } from '@/store/useGameStore'

// Game Components
import CameraManager from '@/components/game/CameraManager'
import TableBoard from '@/components/game/TableBoard'
import Dice from '@/components/game/world/Dice'

// UI Components
import ChatInterface from '@/components/game/ui/ChatInterface'
import GameControls from '@/components/game/ui/GameControls'
import DiceControls from '@/components/game/ui/DiceControls'
import DiceResultOverlay from '@/components/game/ui/DiceResultOverlay' // <--- ของใหม่ที่เราเพิ่งทำ

// Helper: พื้น Physics (ซ่อนไว้ไม่ให้เห็น แต่มีไว้รับลูกเต๋า)
function PhysicsFloor() {
  const [ref] = usePlane(() => ({ 
    rotation: [-Math.PI / 2, 0, 0], 
    position: [0, 0, 0], 
    type: 'Static' 
  }))
  return <mesh ref={ref as any} visible={false}><planeGeometry args={[20, 20]} /></mesh>
}

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15+: ต้อง unwrap params ด้วย use()
  const { id } = use(params) 
  const { viewMode, toggleView } = useGameStore()

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black font-sans select-none">
      
      {/* === LAYER 0: 3D WORLD (โลกในเกม) === */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows>
          <CameraManager /> 
          
          {/* แสงและบรรยากาศ */}
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 15, 10]} castShadow />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

          {/* ระบบฟิสิกส์ (Gravity & Collision) */}
          <Physics gravity={[0, -9.8, 0]}>
            {/* 1. พื้นรับแรง (Invisible) */}
            <PhysicsFloor />
            
            {/* 2. ลูกเต๋า (จะโผล่มาตอนกดทอย และหายไปเมื่อหยุด) */}
            <Dice /> 
            
            {/* 3. กระดานและตัวละคร */}
            <TableBoard />    
            
            {/* Mock Players (ตัวหมากสมมติ) */}
            <mesh position={[-5, 0.5, 0]}><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="red"/></mesh>
            <mesh position={[5, 0.5, 0]}><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="blue"/></mesh>
          </Physics>
        </Canvas>
      </div>

      {/* === LAYER 1: UI OVERLAY (หน้าจอควบคุม) === */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4">
        
        {/* --- 1. DICE RESULT OVERLAY (โชว์ผลลัพธ์เต๋าแบบ Google) --- */}
        {/* วางไว้บนสุดเพื่อให้ทับทุกอย่าง */}
        <DiceResultOverlay />
        
        {/* --- 2. HEADER BAR (เมนูบน) --- */}
        <div className="w-full flex justify-between items-start z-50">
           {/* Room Info */}
           <div className="bg-black/40 backdrop-blur px-4 py-2 rounded-lg border border-white/10 text-white text-sm font-mono shadow-lg">
             ROOM: <span className="text-yellow-400">{id}</span>
           </div>
           
           {/* Top Controls */}
           <div className="flex items-center gap-3">
             <button 
               onClick={toggleView}
               className="pointer-events-auto bg-neutral-800/80 hover:bg-neutral-700 border border-white/20 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg min-w-[140px]"
             >
               {viewMode === 'PERSPECTIVE' ? '👁 View: Table' : '♟ View: Board'}
             </button>
             
             {/* ปุ่ม Pause / Exit */}
             <GameControls />
           </div>
        </div>

        {/* --- 3. MAIN CONTENT (แชท) --- */}
        <div className="flex-1 flex overflow-hidden relative mt-4">
           {/* กล่องแชท (ซ่อน/แสดง ตามมุมกล้องหรือขนาดจอ) */}
           <div className={`h-full z-20 transition-transform duration-500 ease-in-out pointer-events-auto shadow-2xl rounded-xl overflow-hidden ${
             viewMode === 'TOP_DOWN' ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:opacity-100 opacity-0'
           }`}>
             <ChatInterface />
           </div>
        </div>

        {/* --- 4. BOTTOM CONTROLS (ปุ่มกดทอยเต๋า) --- */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto z-50">
            <DiceControls />
        </div>

      </div>

    </main>
  )
}