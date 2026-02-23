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
import Environment from '@/components/game/ui/Environment'
import AudioEngine from '@/components/game/ui/AudioEngine'
import CursorOverlay from '@/components/player-actions/CursorOverlay' 
import QuickChoices from '@/components/player-actions/QuickChoices' 

// 🌟 Import หน้าใหม่เข้ามา
import HumanGMRoom from './HumanGMRoom'

function PhysicsFloor() {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0], type: 'Static' }))
  return <mesh ref={ref as any} visible={false}><planeGeometry args={[20, 20]} /></mesh>
}

// ==========================================
// 🌟 Component หน้ากระดานแบบดั้งเดิม (AI GM) ผมย้ายมันมาไว้เป็นฟังก์ชันแยกข้างในนี้
// ==========================================
function AIGMRoom({ id, currentUserId, myUsername }: any) {
  const { viewMode, toggleView } = useGameStore()
  
  return (
      <main className="relative w-full h-screen overflow-hidden bg-black font-sans select-none">
        <RoomAudioRenderer />
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

        <div className="absolute top-24 right-6 z-40 pointer-events-auto">
           <VideoOverlay />
        </div>

        <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-between p-4">
          <QuickChoices />
          <CursorOverlay roomId={id} currentUserId={currentUserId} myUsername={myUsername} />
          <DiceResultOverlay />
          
          <div className="w-full flex justify-between items-start z-50">
             <div className="bg-black/40 backdrop-blur px-4 py-2 rounded-lg border border-white/10 text-white text-sm font-mono shadow-lg pointer-events-auto">
               ROOM: <span className="text-yellow-400">{id}</span>
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

          <div className="absolute bottom-4 left-4 z-50 pointer-events-auto max-h-[50vh]">
              <ChatInterface />
          </div>
        </div>

        <Environment />
      </main>
  )
}

// ==========================================
// 🌟 Component หลัก (ทำหน้าที่ตรวจเช็คสิทธิ์ และเลือกว่าจะส่งไปหน้าไหน)
// ==========================================
export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params) 
  const [token, setToken] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string>('Player');
  
  // 🌟 เพิ่ม State เพื่อเก็บข้อมูลห้อง ว่าใครเป็น Host และเป็น GM แบบไหน
  const [roomData, setRoomData] = useState<any>(null);

  useEffect(() => {
    const initRoom = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
      const username = profile?.username || 'Player';

      setCurrentUserId(user.id);
      setMyUsername(username);

      // 🌟 ดึงข้อมูลห้อง
      const { data: roomInfo } = await supabase.from('rooms').select('*').eq('id', id).single();
      if (roomInfo) setRoomData(roomInfo);

      const res = await fetch(`/api/livekit?room=${id}&username=${username}&userId=${user.id}`);
      const data = await res.json();
      setToken(data.token);
    };
    initRoom();
  }, [id]);

  if (!token || !roomData) {
    return <div className="w-full h-screen bg-black flex items-center justify-center text-white font-mono animate-pulse">Connecting to Realm...</div>;
  }

  // 🌟 เช็คว่าเราคือ Host ของห้องนี้หรือเปล่า
  const isHost = currentUserId === roomData.host_id;

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      connect={true}
    >
        {/* 🌟 สวิตช์สลับหน้า! */}
        {roomData.gm_type === 'human' ? (
            <HumanGMRoom 
                roomId={id} 
                currentUserId={currentUserId} 
                myUsername={myUsername} 
                isHost={isHost} 
            />
        ) : (
            <AIGMRoom 
                id={id} 
                currentUserId={currentUserId} 
                myUsername={myUsername} 
            />
        )}
    </LiveKitRoom>
  )
}