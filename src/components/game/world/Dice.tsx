'use client'
import { useBox } from '@react-three/cannon'
import { useEffect, useState } from 'react'
import { useGameStore, DiceRollData } from '@/store/useGameStore'
import * as THREE from 'three'

// 🌟 คอมโพเนนต์ย่อย: สำหรับควบคุมลูกเต๋า 1 ลูก (ใครกดทอย ก็เสกลูกนี้ขึ้นมา)
function PhysicalDice({ roll }: { roll: DiceRollData }) {
  const { finishDiceRoll } = useGameStore()
  const [isVisible, setIsVisible] = useState(true)

  // Physics Hook
  const [ref, api] = useBox(() => ({ 
    mass: 1, 
    position: [0, 50, 0], 
    args: [1, 1, 1],
    material: { friction: 0.3, restitution: 0.5 },
    allowSleep: false 
  }))

  useEffect(() => {
    // ทำงานเมื่อเต๋าลูกนี้มีสถานะ isRolling = true
    if (roll.isRolling) {
      setIsVisible(true);

      // --- STEP 1: RESET PHYSICS ---
      api.wakeUp(); 
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      
      // สุ่มตำแหน่งปล่อยนิดหน่อย จะได้ไม่ตกทับกันถ้าเพื่อนทอยพร้อมกัน
      const offsetX = (Math.random() - 0.5) * 4;
      const offsetZ = (Math.random() - 0.5) * 4;
      api.position.set(offsetX, 15, offsetZ);
      
      api.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      // --- STEP 2: APPLY FORCE ---
      const forceTimer = setTimeout(() => {
         api.velocity.set(
            (Math.random() - 0.5) * 5, 
            -15,                       
            (Math.random() - 0.5) * 5  
         );
         api.angularVelocity.set(
            Math.random() * 10, 
            Math.random() * 10, 
            Math.random() * 10
         );
      }, 50);

      // --- STEP 3: FINISH ROLL ---
      const finishTimer = setTimeout(() => {
        // 🌟 ส่ง ID ของเต๋าลูกนี้กลับไปปิดสถานะใน Store (ระบบ UI สุ่มเลขมาให้ตั้งแต่ตอนกดปุ่มแล้ว)
        finishDiceRoll(roll.id);
        
        setIsVisible(false);
        api.position.set(0, 50, 0);
        api.velocity.set(0, 0, 0);
      }, 1500);

      return () => {
        clearTimeout(forceTimer);
        clearTimeout(finishTimer);
      };
    }
  }, [roll.isRolling, roll.id, finishDiceRoll, api])

  // ถ้ากลิ้งเสร็จแล้ว หรือไม่ได้ถูกสั่งให้กลิ้ง ให้ซ่อน
  if (!isVisible || !roll.isRolling) return null;

  const getDiceColor = () => {
    if (roll.diceType === 'D20') return '#f97316'; // ส้ม
    if (roll.diceType === 'D8') return '#a855f7';  // ม่วง
    return '#06b6d4'; // ฟ้า (D6)
  }

  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={getDiceColor()} />
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
        <lineBasicMaterial color="white" transparent opacity={0.5} />
      </lineSegments>
    </mesh>
  )
}

// 🌟 คอมโพเนนต์หลัก: ตัวจัดการลูกเต๋าทั้งหมดในหน้าจอ
export default function Dice() {
  const { diceState } = useGameStore()

  return (
    <>
      {/* วนลูปสร้างลูกเต๋า 3D ตามจำนวนคนที่กดทอยเข้ามา */}
      {diceState.activeRolls.map((roll) => (
        <PhysicalDice key={roll.id} roll={roll} />
      ))}
    </>
  )
}