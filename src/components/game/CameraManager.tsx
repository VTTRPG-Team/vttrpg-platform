'use client'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '@/store/useGameStore'
import * as THREE from 'three'

export default function CameraManager() {
  const viewMode = useGameStore((state) => state.viewMode)
  const cameraZoom = useGameStore((state) => state.cameraZoom) // 🌟 ดึงค่าซูมมาใช้

  useFrame((state) => {
    const targetPos = new THREE.Vector3()
    const targetLookAt = new THREE.Vector3()

    if (viewMode === 'PERSPECTIVE') {
      targetPos.set(0, 5, 12) 
      targetLookAt.set(0, 2, 0) 
    } else {
      targetPos.set(0, 15, 0) 
      targetLookAt.set(0, 0, 0) 
    }

    // 🌟 คำนวณซูม: ยิ่งค่าซูมมาก ตัวหารยิ่งมาก กล้องจะยิ่งใกล้ (Zoom In)
    const zoomFactor = 1 / cameraZoom;
    targetPos.multiplyScalar(zoomFactor);

    state.camera.position.lerp(targetPos, 0.05)
    state.camera.lookAt(targetLookAt)
    state.camera.updateProjectionMatrix()
  })

  return null
}