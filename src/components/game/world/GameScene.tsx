'use client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { useGameStore } from '@/store/useGameStore'
import { Physics, usePlane } from '@react-three/cannon' // Import Physics

// Components
import Dice from './Dice'

export default function GameScene() {
  const { viewMode } = useGameStore()

  return (
    <div className="absolute inset-0 bg-black z-0">
      <Canvas shadows camera={{ position: [0, 8, 12], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

        {/* --- PHYSICS WORLD --- */}
        <Physics gravity={[0, -9.8, 0]}>
          
          {/* พื้นโต๊ะ (ต้องมี Physics Plane) */}
          <TableFloor />
          
          {/* ลูกเต๋า */}
          <Dice />
          
          {/* (Optional) สิ่งกีดขวางอื่นๆ ในอนาคตใส่ตรงนี้ */}

        </Physics>

        {/* Visual Grid (วาดแยกเพื่อความสวยงาม ไม่เกี่ยวกับ Physics) */}
        <Grid position={[0, 0.01, 0]} args={[20, 20]} cellColor="#444" sectionColor="#666" infiniteGrid />

        <OrbitControls 
          enableZoom={true}
          maxPolarAngle={Math.PI / 2.2} // ห้ามหมุนไปใต้โต๊ะ
        />
      </Canvas>
    </div>
  )
}

// พื้นโต๊ะแบบมี Physics
function TableFloor() {
  // สร้าง Plane ที่ตำแหน่ง 0,0,0 หันหน้าขึ้น
  const [ref] = usePlane(() => ({ 
    rotation: [-Math.PI / 2, 0, 0], 
    position: [0, 0, 0],
    type: 'Static' // ขยับไม่ได้
  }))

  return (
    <mesh ref={ref as any} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
    </mesh>
  )
}