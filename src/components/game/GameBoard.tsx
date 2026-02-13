'use client'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import CameraManager from './CameraManager'
import { useGameStore } from '@/store/useGameStore'
import TableBoard from './TableBoard'

export default function GameBoard() {
  return (
    <div className="w-full h-full bg-neutral-900">
      <Canvas shadows>
        <CameraManager /> 
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Stars />

        <TableBoard /> 

        <gridHelper args={[50, 50, "#444", "#222"]} position={[0, -1, 0]} />
      </Canvas>
    </div>
  )
}