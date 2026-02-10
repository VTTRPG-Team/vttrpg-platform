'use client'
import { Html } from '@react-three/drei'

export default function TableBoard() {
  return (
    <group>
      {/* 1. ตัวโต๊ะ */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[12, 1, 8]} />
        <meshStandardMaterial color="#3d2c1d" />
      </mesh>

      {/* 2. พื้นที่กระดาน (Board) */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#222" /> 
      </mesh>

      {/* 3. กรอบเรืองแสง */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10.2, 6.2]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
      </mesh>
      
      {/* 4. ป้ายสถานะลอยเหนือโต๊ะ */}
      <Html position={[0, 1, 0]} transform occlude>
        <div className="bg-black/50 text-white px-2 py-1 rounded text-xs select-none pointer-events-none border border-white/20">
          Waiting for AI Generation...
        </div>
      </Html>
    </group>
  )
}