'use client'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { supabase } from '@/lib/supabase'
import { Html } from '@react-three/drei'

interface AIAssetProps {
  imageUrl: string | null
  isGenerating: boolean
}

export default function AIAsset({ imageUrl, isGenerating }: AIAssetProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [textureMap, setTextureMap] = useState<THREE.Texture | null>(null)
  // ✅ เพิ่ม state เช็คว่าโหลด Texture เสร็จจริงๆ หรือยัง
  const [isTextureLoading, setIsTextureLoading] = useState(false)

  useEffect(() => {
    if (!imageUrl) {
        setTextureMap(null)
        return
    }

    // เมื่อ URL เปลี่ยน หรือเริ่มเจนใหม่ ให้เริ่มโชว์สถานะโหลด
    setIsTextureLoading(true)
    console.log("🎨 AIAsset: Start loading texture...")

    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    
    loader.load(
        imageUrl,
        (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace 
            setTextureMap(tex)
            // ✅ โหลดเสร็จแล้ว ปิดสถานะโหลด
            setIsTextureLoading(false)
            console.log("✅ Texture Loaded!")
        },
        undefined, 
        (err) => {
            console.error("❌ Texture Load Failed:", err)
            setIsTextureLoading(false)
        }
    )
  }, [imageUrl])

  useFrame((state) => {
    if (!meshRef.current) return
    
    // อนิเมชั่นตอนกำลังรอ (หมุน/ลอย)
    if (isGenerating || isTextureLoading) {
        meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 3) * 0.05
        meshRef.current.position.y = 0.06 + Math.sin(state.clock.elapsedTime * 5) * 0.02
    } else {
        meshRef.current.rotation.z = 0
        meshRef.current.position.y = 0.06
    }
  })

  return (
    <group>
      <mesh 
        ref={meshRef} 
        position={[0, 0.06, 0]} 
        rotation={[-Math.PI / 2, 0, 0]} 
      >
        <planeGeometry args={[10, 6]} />
        <meshBasicMaterial 
          map={textureMap} 
          color={(isGenerating || isTextureLoading) ? "#333" : "#ffffff"}
          side={THREE.DoubleSide} 
          toneMapped={false}
          transparent={true} 
        />
      </mesh>

      {/* ✅ แสดง Debug/Loading เฉพาะตอนที่กำลัง Generating หรือกำลังดาวน์โหลดไฟล์รูป */}
      {(isGenerating || isTextureLoading) && (
        <Html position={[0, 1.5, 0]} center transform occlude={false}>
          <div style={{ 
            background: 'rgba(0,0,0,0.8)', 
            color: '#fbbf24', 
            padding: '8px 16px', 
            borderRadius: '20px', 
            fontSize: '14px', 
            fontWeight: 'bold',
            border: '1px solid #fbbf24',
            whiteSpace: 'nowrap'
          }} className="animate-pulse">
            {isGenerating ? "✨ AI is thinking..." : "🖼️ Loading Image..."}
          </div>
        </Html>
      )}
    </group>
  )
}

// --- ฟังก์ชันสั่งสร้างรูป ---
export const generateBoardImage = async (roomId: string, prompt: string) => {
  if (!roomId) return;
  try {
    await supabase.from('rooms').update({ is_image_generating: true }).eq('id', roomId)

    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, prompt }),
    });

    if (!res.ok) throw new Error('API Generate Failed');

  } catch (error) {
    console.error("Generate Error:", error)
    await supabase.from('rooms').update({ is_image_generating: false }).eq('id', roomId)
  }
}