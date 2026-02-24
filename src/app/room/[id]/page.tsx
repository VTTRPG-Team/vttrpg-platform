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
import TopUIOverlay from '@/components/game/ui/TopUIOverlay' // 🌟 ใช้ตัวที่แยกออกมา
import DiceControls from '@/components/game/ui/DiceControls'
import DiceResultOverlay from '@/components/game/ui/DiceResultOverlay' 
import VideoOverlay from '@/components/game/ui/VideoOverlay'
import Environment from '@/components/game/ui/Environment'
import CursorOverlay from '@/components/player-actions/CursorOverlay' 
import QuickChoices from '@/components/player-actions/QuickChoices' 

import TutorialOverlay from '@/components/game/ui/TutorialOverlay' 
import HumanGMRoom from './HumanGMRoom'
import RoomSync from '@/components/game/RoomSync'

function PhysicsFloor() {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0], type: 'Static' }))
  return <mesh ref={ref as any} visible={false}><planeGeometry args={[20, 20]} /></mesh>
}

// ==========================================
// 🌟 Component หน้ากระดานแบบ AI GM
// ==========================================
function AIGMRoom({ id, currentUserId, myUsername, gmType }: any) {
  return (
      <main className="relative w-full h-screen overflow-hidden bg-black font-sans select-none">
        <RoomAudioRenderer />
        <TutorialOverlay />

        {/* === LAYER 0: 3D WORLD (Graphics) === */}
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

        {/* === LAYER 1: UI OVERLAY (HUD) === */}
        <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-between p-4">
          <QuickChoices />
          <CursorOverlay roomId={id} currentUserId={currentUserId} myUsername={myUsername} />
          <DiceResultOverlay />
          
          {/* 🌟 เรียกใช้ Component ส่วนบนที่เราแยกออกมา */}
          <TopUIOverlay roomId={id} gmType={gmType} />

          <DiceControls />

          {/* แถบแชทมุมล่างซ้าย */}
          <div className="absolute bottom-4 left-4 z-50 pointer-events-auto max-h-[50vh]">
              <ChatInterface />
          </div>
        </div>

        {/* ส่วนจัดการเอฟเฟกต์หน้าจอ */}
        <Environment gmType={gmType} />
      </main>
  )
}

// ==========================================
// 🌟 หน้าหลักสำหรับเชื่อมต่อระบบ
// ==========================================
export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params) 
  const [token, setToken] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string>('Player');
  const [roomData, setRoomData] = useState<any>(null);

  useEffect(() => {
    const initRoom = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
      const username = profile?.username || 'Player';

      setCurrentUserId(user.id);
      setMyUsername(username);

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

  const isHost = currentUserId === roomData.host_id;

  return (
    <LiveKitRoom
      video={true} audio={true} token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default" connect={true}
    >
        <RoomSync roomId={id} currentUserId={currentUserId || ''} />
        
        {roomData.gm_type === 'human' ? (
            <HumanGMRoom 
                roomId={id} 
                currentUserId={currentUserId} 
                myUsername={myUsername} 
                isHost={isHost}
                gmType={roomData.gm_type}
            />
        ) : (
            <AIGMRoom 
                id={id} 
                currentUserId={currentUserId} 
                myUsername={myUsername}
                gmType={roomData.gm_type}
            />
        )}
    </LiveKitRoom>
  )
}