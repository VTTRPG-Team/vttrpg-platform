'use client'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '@/store/useGameStore'
import * as THREE from 'three'

export default function CameraManager() {
  const viewMode = useGameStore((state) => state.viewMode)

  useFrame((state) => {
    const targetPos = new THREE.Vector3()
    const targetLookAt = new THREE.Vector3()

    if (viewMode === 'PERSPECTIVE') {
      // มุมมองที่ 1: นั่งที่โต๊ะ
      targetPos.set(0, 5, 12) 
      targetLookAt.set(0, 2, 0) 
    } else {
      // มุมมองที่ 2: Top View
      targetPos.set(0, 15, 0) 
      targetLookAt.set(0, 0, 0) 
    }

    // Animation: Lerp camera position
    state.camera.position.lerp(targetPos, 0.05)
    state.camera.lookAt(targetLookAt)
    state.camera.updateProjectionMatrix()
  })

  return null
}