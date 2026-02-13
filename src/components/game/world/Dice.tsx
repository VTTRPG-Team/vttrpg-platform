'use client'
import { useBox } from '@react-three/cannon'
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import * as THREE from 'three'

export default function Dice() {
  const { diceState, completeDiceRoll } = useGameStore()
  
  // ใช้ State นี้คุมการแสดงผล Mesh (Visible)
  const [isVisible, setIsVisible] = useState(false)

  // Physics Hook
  // allowSleep: false คือหัวใจสำคัญ แก้ปัญหาเต๋าค้าง/ลอย
  const [ref, api] = useBox(() => ({ 
    mass: 1, 
    position: [0, 50, 0], 
    args: [1, 1, 1],
    material: { friction: 0.3, restitution: 0.5 },
    allowSleep: false 
  }))

  // Ref ป้องกันการทำงานซ้ำซ้อนใน React.StrictMode
  const isRollingRef = useRef(false)

  useEffect(() => {
    // ทำงานเมื่อ Store สั่ง isRolling = true
    if (diceState.isRolling) {
      isRollingRef.current = true;
      setIsVisible(true); // แสดงตัว

      // --- STEP 1: RESET PHYSICS (สำคัญมาก) ---
      // ต้องหยุดแรงเก่าทั้งหมดก่อนย้ายที่ ไม่งั้นจะพุ่งต่อ
      api.wakeUp(); // ปลุก Physics
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      
      // ย้ายไปจุดปล่อย (สูง 15 หน่วย)
      api.position.set(0, 15, 0);
      
      // ตั้งท่าหมุนเริ่มต้นแบบสุ่ม
      api.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      // --- STEP 2: APPLY FORCE (ใส่แรงส่ง) ---
      // รอเสี้ยววินาทีเพื่อให้ตำแหน่ง Update แล้วค่อยดีด
      const forceTimer = setTimeout(() => {
         api.velocity.set(
            (Math.random() - 0.5) * 5, // ส่ายซ้ายขวา X
            -15,                       // พุ่งลงแกน Y (แรงพอประมาณ)
            (Math.random() - 0.5) * 5  // ส่ายหน้าหลัง Z
         );
         api.angularVelocity.set(
            Math.random() * 10, 
            Math.random() * 10, 
            Math.random() * 10
         );
      }, 50);

      // --- STEP 3: FINISH & CALCULATE (จบการทอย) ---
      // รอ 1.5 วินาที ให้ลูกเต๋าตกและหยุด
      const finishTimer = setTimeout(() => {
        // คำนวณเลขผลลัพธ์ที่นี่ (Random)
        let maxVal = 6;
        if (diceState.requiredDice === 'D8') maxVal = 8;
        if (diceState.requiredDice === 'D20') maxVal = 20;
        const result = Math.floor(Math.random() * maxVal) + 1;

        // ส่งผลลัพธ์กลับ Store -> เพื่อไปเปิด UI 2D
        completeDiceRoll(result);
        
        // ซ่อน 3D และเก็บกลับที่เดิม
        setIsVisible(false);
        isRollingRef.current = false;
        api.position.set(0, 50, 0);
        api.velocity.set(0, 0, 0);

      }, 1500);

      return () => {
        clearTimeout(forceTimer);
        clearTimeout(finishTimer);
      };
    }
  }, [diceState.isRolling, diceState.requiredDice, completeDiceRoll, api])

  // ถ้าไม่อยู่ในโหมดทอย ไม่ต้อง Render Mesh
  if (!isVisible) return null;

  // เลือกสีตามประเภทเต๋า
  const getDiceColor = () => {
    if (diceState.requiredDice === 'D20') return '#f97316'; // ส้ม
    if (diceState.requiredDice === 'D8') return '#a855f7';  // ม่วง
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