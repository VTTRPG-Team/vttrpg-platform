'use client'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import CameraManager from './CameraManager'
import { useGameStore } from '@/store/useGameStore'

// สร้าง Component โต๊ะกับคนจำลอง เพื่อให้รู้ว่ากล้องขยับจริง
function MockEnvironment() {
  return (
    <group>
      {/* โต๊ะกลาง */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#4a3b2a" />
      </mesh>
      
      {/* พื้นที่กระดาน (ที่จะโหลดภาพ AI) */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Avatar เพื่อน (สมมติเป็นกล่อง 3 กล่องนั่งล้อมวง) */}
      <mesh position={[-4, 1, 0]}>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>
      <mesh position={[4, 1, 0]}>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="blue" />
      </mesh>
      <mesh position={[0, 1, -4]}>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="green" />
      </mesh>
    </group>
  )
}

export default function GameBoard() {
  return (
    <div className="w-full h-full bg-neutral-900">
      <Canvas shadows>
        <CameraManager /> {/* ใส่ตัวคุมกล้องตรงนี้ */}
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Stars />

        <MockEnvironment />
      </Canvas>
    </div>
  )
}