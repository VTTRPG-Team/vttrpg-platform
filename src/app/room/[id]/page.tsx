'use client'
import { use, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { Physics, usePlane } from '@react-three/cannon'
import { supabase } from '@/lib/supabase' // <--- เพิ่ม Supabase

// --- LiveKit Imports (NEW) ---
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react'
import '@livekit/components-styles'

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
import DiceResultOverlay from '@/components/game/ui/DiceResultOverlay' 
import VideoOverlay from '@/components/game/ui/VideoOverlay' // <--- เพิ่ม VideoOverlay

import CursorOverlay from '@/components/player-actions/CursorOverlay' // <--- เพิ่ม CursorOverlay
import QuickChoices from '@/components/player-actions/QuickChoices' // <--- เพิ่ม QuickChoices

function PhysicsFloor() {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0], type: 'Static' }))
  return <mesh ref={ref as any} visible={false}><planeGeometry args={[20, 20]} /></mesh>
}

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params) 
  const { viewMode, toggleView } = useGameStore()

  // --- LiveKit Token Logic (NEW) ---
  const [token, setToken] = useState("");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string>('Player');

  useEffect(() => {
    const fetchToken = async () => {
      // 1. ดึงข้อมูลเราจาก Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
      const username = profile?.username || 'Player';

      setCurrentUserId(user.id);
      setMyUsername(username);

      // 2. ขอ Token จาก API 
      const res = await fetch(`/api/livekit?room=${id}&username=${username}&userId=${user.id}`);
      const data = await res.json();
      setToken(data.token);
    };
    fetchToken();
  }, [id]);

  // ถ้ายังไม่ได้ Token ให้ขึ้นหน้า Loading ดำๆ ไว้ก่อน จะได้ไม่กระตุก
  if (!token) {
    return <div className="w-full h-screen bg-black flex items-center justify-center text-white font-mono animate-pulse">Connecting to Realm...</div>;
  }

  return (
    // ครอบด้วย LiveKitRoom
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      connect={true}
    >
      <main className="relative w-full h-screen overflow-hidden bg-black font-sans select-none">
        
        {/* พระเอกเรื่องเสียง: ขาดไม่ได้ */}
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
              <mesh position={[-5, 0.5, 0]}><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="red"/></mesh>
              <mesh position={[5, 0.5, 0]}><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="blue"/></mesh>
            </Physics>
          </Canvas>
        </div>

        {/* === LAYER 0.5: PLAYER VIDEOS (NEW) === */}
        <div className="absolute top-24 right-6 z-40">
           <VideoOverlay />
        </div>

        {/* === LAYER 1: UI OVERLAY === */}
        <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-between p-4">
          <QuickChoices />
          <CursorOverlay roomId={id} currentUserId={currentUserId} myUsername={myUsername} />
                    
          <DiceResultOverlay />
          
          {/* Header Bar */}
          <div className="w-full flex justify-between items-start z-50">
             <div className="bg-black/40 backdrop-blur px-4 py-2 rounded-lg border border-white/10 text-white text-sm font-mono shadow-lg">
               ROOM: <span className="text-yellow-400">{id}</span>
             </div>
             
             <div className="flex items-center gap-3">
               <button onClick={toggleView} className="pointer-events-auto bg-neutral-800/80 hover:bg-neutral-700 border border-white/20 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg min-w-[140px]">
                 {viewMode === 'PERSPECTIVE' ? '👁 View: Table' : '♟ View: Board'}
               </button>
               <GameControls />
             </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex overflow-hidden relative mt-4">
             <div className={`h-full z-20 transition-transform duration-500 ease-in-out pointer-events-auto shadow-2xl rounded-xl overflow-hidden ${
               viewMode === 'TOP_DOWN' ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:opacity-100 opacity-0'
             }`}>
               <ChatInterface />
             </div>
          </div>

          {/* Dice Button */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto z-50">
              <DiceControls />
          </div>
        </div>

      </main>
    </LiveKitRoom>
  )
}