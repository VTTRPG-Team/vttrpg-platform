'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import AIAsset from '@/app/ai-gm/ai_asset'
import { useGameStore } from '@/store/useGameStore'
import { useTexture } from '@react-three/drei'

// 🌟 TokenMesh: ปรับให้รูปแปะด้านบนเหรียญ ไม่จม และไม่ผิดด้าน
function TokenMesh({ token, isGM, onPointerDown }: { token: any, isGM: boolean, onPointerDown: (e: any, id: string) => void }) {
  const texture = useTexture(token.url) as any;
  const [hovered, setHovered] = useState(false);

  // ยกเหรียญให้สูงขึ้นเล็กน้อยจากพื้นโต๊ะ (y = 0)
  const coinHeight = 0.1; 
  const yPosition = coinHeight / 2 + 0.01; 

  return (
    <group 
      position={[token.x, yPosition, token.z]} 
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
      onPointerDown={(e) => {
        if (isGM) {
          e.stopPropagation();
          onPointerDown(e, token.id);
        }
      }}
    >
      {/* 🪙 ตัวเหรียญทรงกระบอก (Body) */}
      <mesh castShadow>
        <cylinderGeometry args={[0.5, 0.5, coinHeight, 32]} />
        <meshStandardMaterial color="#2a1d15" />
      </mesh>

      {/* 🖼️ แผ่นรูปภาพแปะหน้าเหรียญ (Top Surface) - หงายขึ้นและลอยทับขอบเหรียญนิดเดียว */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, coinHeight / 2 + 0.005, 0]}>
        <circleGeometry args={[0.45, 32]} />
        <meshStandardMaterial map={texture} transparent />
      </mesh>
    </group>
  );
}

export default function TableBoard() {
  const params = useParams()
  const roomId = params?.id as string
  const [boardState, setBoardState] = useState({ imageUrl: null, isGenerating: false })
  
  const { tokens, updateTokenPosition, addToken, clearTokens } = useGameStore();
  const [isGM, setIsGM] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [activeToken, setActiveToken] = useState<string | null>(null);

  // ตรวจสอบสิทธิ์ GM
  useEffect(() => {
    const init = async () => {
       const { data: { user } } = await supabase.auth.getUser();
       if(user) {
           setCurrentUserId(user.id);
           const { data: room } = await supabase.from('rooms').select('host_id').eq('id', roomId).single();
           if(room && room.host_id === user.id) setIsGM(true);
       }
    };
    init();
  }, [roomId]);

  // 🌟 THE FIX: โหลด Token จาก DB ตอนเข้าห้อง/Refresh
  useEffect(() => {
    const fetchTokens = async () => {
      const { data } = await supabase.from('room_tokens').select('*').eq('room_id', roomId);
      if (data) {
        clearTokens();
        data.forEach(t => addToken(t));
      }
    };
    if (roomId) fetchTokens();
  }, [roomId, clearTokens, addToken]);

  useEffect(() => {
    if (!roomId) return
    supabase.from('rooms').select('board_image_url, is_image_generating').eq('id', roomId).single().then(({ data }) => {
      if (data) setBoardState({ imageUrl: data.board_image_url, isGenerating: data.is_image_generating })
    })
    const channel = supabase.channel(`table_${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload: any) => {
        setBoardState({ imageUrl: payload.new.board_image_url, isGenerating: payload.new.is_image_generating })
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [roomId])

  // 🌟 ขยับในเครื่อง GM อย่างเดียว (ไม่ส่ง Pusher ตอนลากเมาส์)
  const handlePointerMove = (e: any) => {
      if (!isGM || !activeToken) return;
      const newX = Math.max(-5.5, Math.min(5.5, e.point.x));
      const newZ = Math.max(-3.5, Math.min(3.5, e.point.z));
      updateTokenPosition(activeToken, newX, newZ);
  };

  // 🌟 ส่งพิกัดสุดท้ายแค่ครั้งเดียวตอนปล่อยเมาส์
  const handlePointerUp = async () => {
      if (!isGM || !activeToken) return;
      
      const token = tokens.find(t => t.id === activeToken);
      if (token) {
          // 1. บันทึกลง Database เผื่อ Refresh
          await supabase.from('room_tokens').upsert({ 
              id: token.id, room_id: roomId, url: token.url, x: token.x, z: token.z 
          });

          // 2. ส่ง Pusher ครั้งเดียวจบ
          fetch('/api/pusher/game-event', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  roomId, senderId: currentUserId, actionType: 'MOVE_TOKEN', 
                  tokenData: { id: token.id, x: token.x, z: token.z } 
              })
          });
      }
      setActiveToken(null);
  };

  return (
    <group>
      {activeToken && (
         <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerOut={handlePointerUp} visible={false}>
             <planeGeometry args={[100, 100]} />
             <meshBasicMaterial transparent opacity={0} />
         </mesh>
      )}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[12, 1, 8]} />
        <meshStandardMaterial color="#3d2c1d" />
      </mesh>
      <AIAsset imageUrl={boardState.imageUrl} isGenerating={boardState.isGenerating} />
      {tokens.map(token => <TokenMesh key={token.id} token={token} isGM={isGM} onPointerDown={(e, id) => setActiveToken(id)} />)}
    </group>
  )
}