'use client'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { Physics, usePlane } from '@react-three/cannon'
import { RoomAudioRenderer } from '@livekit/components-react'

import { useGameStore } from '@/store/useGameStore'
import CameraManager from '@/components/game/CameraManager'
import TableBoard from '@/components/game/TableBoard'
import Dice from '@/components/game/world/Dice'

import GameControls from '@/components/game/ui/GameControls'
import DiceControls from '@/components/game/ui/DiceControls'
import DiceResultOverlay from '@/components/game/ui/DiceResultOverlay' 
import VideoOverlay from '@/components/game/ui/VideoOverlay'
import Environment from '@/components/game/ui/Environment'
import AudioEngine from '@/components/game/ui/AudioEngine'
import CursorOverlay from '@/components/player-actions/CursorOverlay' 
import QuickChoices from '@/components/player-actions/QuickChoices' 

// 🌟 Import เครื่องมือของ GM (เดี๋ยวเราจะสร้างไฟล์นี้ทีหลัง)
import GMControlPanel from '@/components/game/ui/GMControlPanel'

function PhysicsFloor() {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0], type: 'Static' }))
  return <mesh ref={ref as any} visible={false}><planeGeometry args={[20, 20]} /></mesh>
}

// 🌟 Props จะรับข้อมูลมาจาก page.tsx หลัก
export default function HumanGMRoom({ roomId, currentUserId, myUsername, isHost }: any) {
  const { viewMode, toggleView } = useGameStore()

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black font-sans select-none">
        <RoomAudioRenderer />

        {/* === LAYER 0: 3D WORLD === */}
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <Canvas shadows>
            <CameraManager /> 
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 15, 10]} castShadow />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Physics gravity={[0, -9.8, 0]}>
              <PhysicsFloor />
              <Dice /> 
              <TableBoard />    
            </Physics>
          </Canvas>
        </div>

        {/* === LAYER 0.5: PLAYER VIDEOS === */}
        <div className="absolute top-24 right-6 z-40 pointer-events-auto">
           <VideoOverlay />
        </div>

        {/* === LAYER 1: UI OVERLAY === */}
        <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-between p-4">
          
          <QuickChoices />
          <CursorOverlay roomId={roomId} currentUserId={currentUserId} myUsername={myUsername} />
          <DiceResultOverlay />
          
          <div className="w-full flex justify-between items-start z-50">
             <div className="bg-black/40 backdrop-blur px-4 py-2 rounded-lg border border-white/10 text-white text-sm font-mono shadow-lg pointer-events-auto">
               ROOM: <span className="text-yellow-400">{roomId}</span> <span className="text-red-400 ml-2">(Human GM)</span>
             </div>
             
             <div className="flex items-center gap-3 pointer-events-auto">
               <AudioEngine />
               <button onClick={toggleView} className="bg-neutral-800/80 hover:bg-neutral-700 border border-white/20 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg min-w-[140px]">
                 {viewMode === 'PERSPECTIVE' ? '👁 View: Table' : '♟ View: Board'}
               </button>
               <GameControls />
             </div>
          </div>

          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto z-50">
              <DiceControls />
          </div>

          {/* 🌟 ถ้าเป็น Host ให้แสดงเครื่องมือ GM (ถ้าไม่ใช่ ก็แค่หน้าจอโล่งๆ ไม่มีช่องแชท) */}
          {isHost && (
              <div className="absolute bottom-4 left-4 z-50 pointer-events-auto">
                  <GMControlPanel roomId={roomId} />
              </div>
          )}

        </div>

        <Environment />
    </main>
  )
}