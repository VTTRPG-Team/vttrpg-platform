'use client'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { supabase } from '@/lib/supabase'

interface AIAssetProps {
  imageUrl: string | null
  isGenerating: boolean
}

// Component สำหรับแสดงผลบน Canvas
export default function AIAsset({ imageUrl, isGenerating }: AIAssetProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [textureMap, setTextureMap] = useState<THREE.Texture | null>(null)

  // โหลด Texture
  useEffect(() => {
    if (!imageUrl) {
        setTextureMap(null) // Reset ถ้าไม่มี URL
        return
    }

    console.log("🎨 AIAsset: Start loading texture...", imageUrl)

    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous') // สำคัญมากสำหรับรูปข้าม Domain
    
    loader.load(
        imageUrl,
        (tex) => {
            console.log("✅ Texture Loaded Successfully!")
            // ตั้งค่าสีให้ถูกต้อง
            tex.colorSpace = THREE.SRGBColorSpace 
            // tex.minFilter = THREE.LinearFilter // (Optional) ช่วยให้ภาพเนียนขึ้นถ้าขยายใหญ่
            setTextureMap(tex)
        },
        undefined, 
        (err) => {
            console.error("❌ Texture Load Failed:", err)
        }
    )
  }, [imageUrl])

  // Effect อนิเมชั่นตอนกำลัง Gen รูป
  useFrame((state, delta) => {
    if (!meshRef.current) return
    
    if (isGenerating) {
        // หมุนเบาๆ + ยกตัวลอยนิดๆ ตอนรอ
        meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 3) * 0.05
        meshRef.current.position.y = 0.06 + Math.sin(state.clock.elapsedTime * 5) * 0.02
    } else {
        meshRef.current.rotation.z = 0
        meshRef.current.position.y = 0.06
    }
  })

  return (
    <mesh 
      ref={meshRef} 
      position={[0, 0.06, 0]} 
      rotation={[-Math.PI / 2, 0, 0]} 
      receiveShadow
    >
      <planeGeometry args={[10, 6]} />
      
      {/* ✅ แก้ไข Material ให้แสดงผลชัวร์ที่สุด */}
      <meshBasicMaterial 
        map={textureMap} 
        // ถ้ามี Texture ให้ใช้สีขาว (เพื่อให้เห็นสีจริงของรูป) ถ้าไม่มีให้ใช้สีดำเทา
        color={isGenerating ? "#333" : (textureMap ? "#ffffff" : "#1a1a1a")}
        
        // 1. DoubleSide: ทำให้มองเห็นรูปได้ทั้งหน้าและหลัง (กันเหนียวเรื่องมุมกล้อง)
        side={THREE.DoubleSide} 
        
        // 2. toneMapped={false}: ป้องกันแสงในฉากทำให้รูปสว่างจ้าจนขาว
        toneMapped={false}
        
        // 3. transparent: รองรับพื้นหลังโปร่งใส
        transparent={true} 
      />
    </mesh>
  )
}

// --- ฟังก์ชันสั่งสร้างรูป (เรียกใช้จาก ai_gm.tsx) ---
export const generateBoardImage = async (roomId: string, prompt: string) => {
  if (!roomId) return;
  try {
    // 1. ตั้งสถานะโหลด
    await supabase.from('rooms').update({ is_image_generating: true }).eq('id', roomId)

    // 2. เรียก API
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, prompt }),
    });

    if (!res.ok) throw new Error('API Generate Failed');

    // ไม่ต้องอัปเดต URL ที่นี่ เพราะ API หลังบ้านทำหน้าที่อัปเดต DB แล้ว
    // และ TableBoard จะได้รับข้อมูลผ่าน Realtime เอง

  } catch (error) {
    console.error("Generate Error:", error)
    // ถ้าพัง ให้ปิดสถานะโหลด
    await supabase.from('rooms').update({ is_image_generating: false }).eq('id', roomId)
  }
}