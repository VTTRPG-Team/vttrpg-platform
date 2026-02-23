'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import AIAsset from '@/app/ai-gm/ai_asset'
// 🌟 1. Import Store
import { useGameStore } from '@/store/useGameStore'
import { useTexture } from '@react-three/drei' // ไว้แปะรูปลงเหรียญ

// 🌟 Component สำหรับวาดเหรียญ Token 1 อัน
function TokenMesh({ url, x, z }: { url: string, x: number, z: number }) {
  const texture = useTexture(url);
  return (
    // y = 0.05 คือลอยเหนือโต๊ะนิดนึง จะได้ไม่จม
    <mesh position={[x, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
      {/* ใช้ cylinder แบบแบนๆ ให้ดูเหมือนเหรียญ */}
      <cylinderGeometry args={[0.5, 0.5, 0.05, 32]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

export default function TableBoard() {
  const params = useParams()
  const roomId = params?.id as string
  const [boardState, setBoardState] = useState({ imageUrl: null, isGenerating: false })
  
  // 🌟 2. ดึง Tokens มาจาก Store
  const { tokens } = useGameStore();

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

  return (
    <group>
      {/* ตัวโต๊ะ */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[12, 1, 8]} />
        <meshStandardMaterial color="#3d2c1d" />
      </mesh>

      {/* กระดานพื้น (แมพ) */}
      <AIAsset imageUrl={boardState.imageUrl} isGenerating={boardState.isGenerating} />
      
      {/* 🌟 3. วาง Token ทั้งหมดที่ GM กดสปอว์นออกมา */}
      {tokens.map(token => (
         <TokenMesh key={token.id} url={token.url} x={token.x} z={token.z} />
      ))}
    </group>
  )
}