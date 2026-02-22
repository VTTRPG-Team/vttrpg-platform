'use client'
import { use, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { Physics, usePlane } from '@react-three/cannon'
import { supabase } from '@/lib/supabase'

import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react'
import '@livekit/components-styles'

import { useGameStore } from '@/store/useGameStore'
import CameraManager from '@/components/game/CameraManager'
import TableBoard from '@/components/game/TableBoard'
import Dice from '@/components/game/world/Dice'

import ChatInterface from '@/components/game/ui/ChatInterface'
import GameControls from '@/components/game/ui/GameControls'
import DiceControls from '@/components/game/ui/DiceControls'
import DiceResultOverlay from '@/components/game/ui/DiceResultOverlay' 
import VideoOverlay from '@/components/game/ui/VideoOverlay'

function PhysicsFloor() {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0], type: 'Static' }))
  return <mesh ref={ref as any} visible={false}><planeGeometry args={[20, 20]} /></mesh>
}

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params) 
  const { viewMode, toggleView } = useGameStore()
  const [token, setToken] = useState("");

  useEffect(() => {
    const fetchToken = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
      const username = profile?.username || 'Player';

      const res = await fetch(`/api/livekit?room=${id}&username=${username}&userId=${user.id}`);
      const data = await res.json();
      setToken(data.token);
    };
    fetchToken();
  }, [id]);

  if (!token) {
    return <div className="w-full h-screen bg-black flex items-center justify-center text-white font-mono animate-pulse">Connecting to Realm...</div>;
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      connect={true}
    >
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
        <div className="absolute top-24 right-6 z-40">
           <VideoOverlay />
        </div>

        {/* === LAYER 1: UI OVERLAY (พวกปุ่มควบคุมต่างๆ) === */}
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4">
          <DiceResultOverlay />
          
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

          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto z-50">
              <DiceControls />
          </div>
        </div>

        {/* ✅ งัด ChatInterface ออกมาวางด้านนอกสุด! (ห้ามมี div ขังมันไว้) */}
        <ChatInterface />

      </main>
    </LiveKitRoom>
  )
}