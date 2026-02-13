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
    
    console.log("TableBoard: Start loading for room:", roomId)

    supabase.from('rooms').select('board_image_url, is_image_generating').eq('id', roomId).single()
      .then(({ data, error }) => {
        if (error) console.error("Load Error:", error)
        if (data) {
            console.log("Initial Data Loaded:", data)
            setBoardState({ 
                imageUrl: data.board_image_url, 
                isGenerating: data.is_image_generating 
            })
        }
      })

    // 2. ฟัง Realtime
    const channel = supabase.channel(`table_debug_${roomId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, 
        (payload: any) => {
          console.log("Realtime Update Received:", payload.new)
          setBoardState({
            imageUrl: payload.new.board_image_url,
            isGenerating: payload.new.is_image_generating
          })
        }
      )
      .subscribe((status) => {
          console.log("Subscription Status:", status)
      })

    return () => { supabase.removeChannel(channel) }
  }, [roomId])

  return (
    <group>
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[12, 1, 8]} />
        <meshStandardMaterial color="#5c4033" />
      </mesh>

      {/*กระดาน AI*/}
      <group position={[0, 0.05, 0]}>
         <AIAsset imageUrl={boardState.imageUrl} isGenerating={boardState.isGenerating} />
      </group>

      {/*Debug Text*/}
      <Html position={[0, 1.5, 0]} center transform occlude={false}>
        <div style={{ background: 'rgba(0,0,0,0.8)', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', minWidth: '200px', textAlign: 'center', pointerEvents: 'none' }}>
            <p style={{ margin: 0, fontWeight: 'bold', color: boardState.isGenerating ? '#fbbf24' : '#4ade80' }}>
              Status: {boardState.isGenerating ? "Generating..." : "Ready"}
            </p>
            <p style={{ margin: '5px 0 0 0' }}>
              Image: {boardState.imageUrl ? "Loaded" : "No URL"}
            </p>

            {boardState.imageUrl && (
              <p style={{ fontSize: '10px', color: '#aaa', margin: 0, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {boardState.imageUrl}
              </p>
            )}
        </div>
      </Html>
    </group>
  )
}