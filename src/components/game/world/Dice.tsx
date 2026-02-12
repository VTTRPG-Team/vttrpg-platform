'use client'
import { useBox } from '@react-three/cannon'
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import * as THREE from 'three'

export default function Dice() {
  const { diceState, completeDiceRoll } = useGameStore()
  const [isVisible, setIsVisible] = useState(false)

  // Setup Physics
  const [ref, api] = useBox(() => ({ 
    mass: 1, 
    position: [0, 50, 0], 
    args: [1, 1, 1],
    material: { friction: 0.3, restitution: 0.5 },
    // เพิ่ม allowSleep เพื่อให้ performance ดี แต่ต้อง wakeUp เอง
    allowSleep: true 
  }))

  const isRollingRef = useRef(false)

  useEffect(() => {
    if (diceState.isRolling && !isRollingRef.current) {
      isRollingRef.current = true;

      // 1. ปลุก Physics ให้ตื่นก่อน (สำคัญมาก!)
      api.wakeUp()

      // 2. Reset ค่าต่างๆ
      api.position.set(0, 15, 0) // ความสูง 15 เมตร
      api.velocity.set(0, 0, 0)
      api.angularVelocity.set(0, 0, 0)
      api.rotation.set(Math.random(), Math.random(), Math.random())

      // 3. แสดงตัว
      setIsVisible(true)

      // 4. ใส่แรงส่ง (ดีเลย์นิดนึงเพื่อให้ Position อัปเดตก่อน)
      setTimeout(() => {
        api.velocity.set(
            (Math.random() - 0.5) * 5, 
            -20, // ยิงลงแรงขึ้นอีกนิด (-20)
            (Math.random() - 0.5) * 5
        )
        api.angularVelocity.set(Math.random()*20, Math.random()*20, Math.random()*20)
      }, 50)

      // 5. จบการทอย (Timing)
      setTimeout(() => {
        setIsVisible(false) // ซ่อน
        isRollingRef.current = false;
        
        // สุ่มผลลัพธ์
        let maxVal = 6;
        if (diceState.requiredDice === 'D8') maxVal = 8;
        if (diceState.requiredDice === 'D20') maxVal = 20;
        const result = Math.floor(Math.random() * maxVal) + 1;
        
        completeDiceRoll(result); 

        // เก็บกลับขึ้นฟ้า
        api.position.set(0, 50, 0)
        api.velocity.set(0, 0, 0)
        api.angularVelocity.set(0, 0, 0) // หยุดหมุนด้วย

      }, 1500); 
    }
  }, [diceState.isRolling, api, diceState.requiredDice, completeDiceRoll])

  if (!isVisible) return null;

  const getDiceColor = () => {
    if (diceState.requiredDice === 'D20') return '#f97316';
    if (diceState.requiredDice === 'D8') return '#a855f7';
    return '#06b6d4';
  }

  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={getDiceColor()} roughness={0.2} metalness={0.1} />
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
        <lineBasicMaterial color="white" transparent opacity={0.4} />
      </lineSegments>
    </mesh>
  )
}