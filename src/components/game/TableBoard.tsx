'use client'
import { useState, useEffect } from 'react'
// ลบ import { Html } from '@react-three/drei' ออกไปได้เลยถ้าไม่ได้ใช้ที่อื่นแล้ว
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import AIAsset from '@/app/ai-gm/ai_asset'

export default function TableBoard() {
  const params = useParams()
  const roomId = params?.id as string
  const [boardState, setBoardState] = useState({ 
    imageUrl: null, 
    isGenerating: false 
  })

  useEffect(() => {
    if (!roomId) return

    // 1. Load Initial
    supabase
      .from('rooms')
      .select('board_image_url, is_image_generating')
      .eq('id', roomId)
      .single()
      .then(({ data }) => {
        if (data) {
          setBoardState({ 
            imageUrl: data.board_image_url, 
            isGenerating: data.is_image_generating 
          })
        }
      })

    // 2. Listen Realtime
    const channel = supabase
      .channel(`table_${roomId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'rooms', 
          filter: `id=eq.${roomId}` 
        },
        (payload: any) => {
          setBoardState({
            imageUrl: payload.new.board_image_url,
            isGenerating: payload.new.is_image_generating
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  return (
    <group>
      {/* ตัวโต๊ะ */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[12, 1, 8]} />
        <meshStandardMaterial color="#3d2c1d" />
      </mesh>

      {/* กระดาน AI */}
      <AIAsset 
        imageUrl={boardState.imageUrl} 
        isGenerating={boardState.isGenerating} 
      />
      
    </group>
  )
}