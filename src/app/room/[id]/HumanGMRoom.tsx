'use client'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { Physics, usePlane } from '@react-three/cannon'
import { RoomAudioRenderer } from '@livekit/components-react'

import { useGameStore } from '@/store/useGameStore'
import CameraManager from '@/components/game/CameraManager'
import TableBoard from '@/components/game/TableBoard'
import Dice from '@/components/game/world/Dice'

// 🌟 เปลี่ยนมาใช้ TopUIOverlay ตัวเดียวจบ
import TopUIOverlay from '@/components/game/ui/TopUIOverlay'
import DiceControls from '@/components/game/ui/DiceControls'
import DiceResultOverlay from '@/components/game/ui/DiceResultOverlay' 
import VideoOverlay from '@/components/game/ui/VideoOverlay'
import Environment from '@/components/game/ui/Environment'
import CursorOverlay from '@/components/player-actions/CursorOverlay' 
import QuickChoices from '@/components/player-actions/QuickChoices' 

import GMControlPanel from '@/components/game/ui/GMControlPanel'

function PhysicsFloor() {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0], type: 'Static' }))
  return <mesh ref={ref as any} visible={false}><planeGeometry args={[20, 20]} /></mesh>
}

// 🌟 เพิ่ม gmType เข้ามาใน Props
export default function HumanGMRoom({ roomId, currentUserId, myUsername, isHost, gmType }: any) {
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
          
          {/* 🌟 THE FIX: เรียกใช้ Component รวมปุ่มตัวเดียวกับหน้า page.tsx */}
          <TopUIOverlay roomId={roomId} gmType={gmType} />

          <DiceControls />

          {/* 🌟 ถ้าเป็น Host ให้แสดงเครื่องมือ GM */}
          {isHost && (
              <div className="absolute bottom-4 left-4 z-50 pointer-events-auto">
                  <GMControlPanel roomId={roomId} currentUserId={currentUserId} />
              </div>
          )}

        </div>

        {/* 🌟 ส่ง gmType ไปด้วยเพื่อซ่อนปุ่มที่ไม่จำเป็น */}
        <Environment gmType={gmType} />
    </main>
  )
}