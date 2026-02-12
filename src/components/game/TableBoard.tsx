'use client'
import { useState, useEffect } from 'react'
import { Html } from '@react-three/drei'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import AIAsset from '@/app/ai-gm/ai_asset'

interface BoardState {
  imageUrl: string | null;
  isGenerating: boolean;
}

export default function TableBoard() {
  const params = useParams()
  const roomId = params?.id as string
  const [boardState, setBoardState] = useState<BoardState>({ 
    imageUrl: null, 
    isGenerating: false 
  })

  useEffect(() => {
    if (!roomId) return
    
    // 1. โหลดข้อมูลครั้งแรก
    supabase.from('rooms').select('board_image_url, is_image_generating').eq('id', roomId).single()
      .then(({ data }) => {
        if (data) {
            setBoardState({ 
                imageUrl: data.board_image_url, 
                isGenerating: data.is_image_generating 
            })
        }
      })

    // 2. ฟัง Realtime การอัปเดตจาก API
    const channel = supabase.channel(`table_realtime_${roomId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, 
        (payload: any) => {
          setBoardState({
            imageUrl: payload.new.board_image_url,
            isGenerating: payload.new.is_image_generating
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId])

  return (
    <group>
      {/* 1. ตัวโต๊ะ */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[12, 1, 8]} />
        <meshStandardMaterial color="#3d2c1d" />
      </mesh>

      {/* 2. กระดาน AI */}
      <group position={[0, 0.05, 0]}>
         <AIAsset imageUrl={boardState.imageUrl} isGenerating={boardState.isGenerating} />
      </group>

      {/* 3. ป้าย Debug/Loading (แสดงเฉพาะตอนกำลังเจนรูปใหม่) */}
      {boardState.isGenerating && (
        <Html position={[0, 1.5, 0]} center transform occlude={false}>
          <div style={{ 
            background: 'rgba(0,0,0,0.85)', 
            color: '#fbbf24', 
            padding: '12px 20px', 
            borderRadius: '12px', 
            fontSize: '14px', 
            fontWeight: 'bold',
            border: '2px solid #fbbf24',
            textAlign: 'center',
            boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)'
          }} className="animate-bounce">
            ✨ AI GM is visualizing...
            <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.8, fontWeight: 'normal' }}>
              Updating game world assets...
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}