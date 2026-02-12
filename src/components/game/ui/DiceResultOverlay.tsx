'use client'
import { useGameStore, DiceType } from '@/store/useGameStore'
import { useEffect, useState, useRef } from 'react'

export default function DiceResultOverlay() {
  const { diceState } = useGameStore()
  const [show, setShow] = useState(false)
  
  // State สำหรับ Animation
  const [animatedValue, setAnimatedValue] = useState<number>(1)
  const [isSpinning, setIsSpinning] = useState(false)

  // **สำคัญ:** สร้างตัวแปรจำค่าเต๋าไว้ (Cache) กัน Store รีเซ็ตเป็น Null
  const [cachedDiceType, setCachedDiceType] = useState<DiceType>(null)

  // 1. อัปเดต Cache เมื่อมีการเริ่มทอย หรือมีการเปลี่ยนชนิดเต๋า (แต่ไม่เอา Null)
  useEffect(() => {
    if (diceState.requiredDice) {
      setCachedDiceType(diceState.requiredDice)
    }
  }, [diceState.requiredDice])

  // 2. Trigger Animation เมื่อได้รับผลลัพธ์ (lastResult)
  useEffect(() => {
    // เช็คว่ามีผลลัพธ์ใหม่ และไม่ได้กำลังโชว์อยู่ (กัน re-trigger)
    if (diceState.lastResult !== null && !show) {
      setShow(true)
      setIsSpinning(true)

      // --- PHASE 1: Slot Machine ---
      let count = 0;
      const maxSpins = 20; 
      const interval = setInterval(() => {
        // ใช้ cachedDiceType แทน diceState.requiredDice
        let maxVal = 6;
        if (cachedDiceType === 'D8') maxVal = 8;
        if (cachedDiceType === 'D20') maxVal = 20;
        
        setAnimatedValue(Math.floor(Math.random() * maxVal) + 1);
        count++;

        if (count >= maxSpins) {
          clearInterval(interval);
          // --- PHASE 2: Stop at Real Result ---
          setIsSpinning(false)
          setAnimatedValue(diceState.lastResult!) // หยุดที่เลขจริง
        }
      }, 50);

      // --- PHASE 3: Hide UI ---
      const hideTimer = setTimeout(() => {
        setShow(false)
        // Reset cache เมื่อปิดหน้าต่างไปแล้วจริงๆ (Optional)
      }, 4000)

      return () => {
        clearInterval(interval)
        clearTimeout(hideTimer)
      }
    } 
  }, [diceState.lastResult, cachedDiceType, show]) // เอา cachedDiceType มาเป็น Dependency แทน

  // ถ้า Store สั่งปิด หรือไม่มีการทอย ให้ Reset show ทิ้ง (กรณี Force Reset)
  useEffect(() => {
     if (diceState.isRolling) {
         setShow(false) // ซ่อน Overlay ถ้าเริ่มทอยรอบใหม่
     }
  }, [diceState.isRolling])


  if (!show) return null

  // --- SHAPE GENERATOR ---
  const getShapeClasses = (type: DiceType) => {
    switch (type) {
      case 'D6': 
        return 'bg-cyan-500 rounded-xl aspect-square shadow-[0_0_30px_rgba(6,182,212,0.6)]'
      
      case 'D8': 
        return 'bg-purple-500 aspect-square shadow-[0_0_30px_rgba(168,85,247,0.6)] [clip-path:polygon(50%_0%,_100%_25%,_100%_75%,_50%_100%,_0%_75%,_0%_25%)] scale-110'
      
      case 'D20': 
        return 'bg-orange-500 aspect-square shadow-[0_0_30px_rgba(249,115,22,0.6)] [clip-path:polygon(25%_0%,_75%_0%,_100%_50%,_75%_100%,_25%_100%,_0%_50%)] scale-110'
      
      default:
        // Fallback ถ้า cache หลุดจริงๆ (ไม่ควรเกิด)
        return 'bg-gray-500 rounded-full aspect-square'
    }
  }

  return (
    <div className="fixed top-24 left-0 right-0 z-[100] flex flex-col items-center justify-start pointer-events-none animate-bounce-in">
      
      {/* ใช้ cachedDiceType แทน diceState.requiredDice */}
      <div className={`
        relative flex items-center justify-center
        w-32 h-32 transition-all duration-300
        ${getShapeClasses(cachedDiceType)} 
      `}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-black/10 pointer-events-none" />
        
        <span className={`
            font-black text-6xl text-white drop-shadow-md z-10
            ${isSpinning ? 'blur-[1px]' : 'scale-110 transition-transform duration-200'}
        `}>
          {animatedValue}
        </span>
      </div>

      <div className="mt-4 bg-black/60 backdrop-blur-md border border-white/10 text-white px-6 py-1 rounded-full font-bold text-sm tracking-widest uppercase shadow-lg">
         {cachedDiceType} Check
      </div>

    </div>
  )
}