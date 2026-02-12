'use client'
import { useGameStore, DiceType } from '@/store/useGameStore'
import { useEffect, useState } from 'react'

export default function DiceResultOverlay() {
  const { diceState, closeDiceUI } = useGameStore()
  
  // State สำหรับตัวเลขที่วิ่งบนหน้าจอ
  const [displayNum, setDisplayNum] = useState<number>(1)
  const [isAnimating, setIsAnimating] = useState(false)

  // ดักจับเมื่อ Store เปลี่ยนสถานะเป็น isShowingResult (ทอยเสร็จแล้ว)
  useEffect(() => {
    if (diceState.isShowingResult && diceState.lastResult !== null) {
      setIsAnimating(true);
      
      // --- PHASE 1: Slot Machine (เลขวิ่ง) ---
      // เริ่มต้นด้วยการสุ่มเลขทันที เพื่อไม่ให้เห็นเลขเก่าหรือเลข 1 ค้าง
      const initialRandom = Math.floor(Math.random() * (diceState.requiredDice === 'D20' ? 20 : 6)) + 1;
      setDisplayNum(initialRandom);

      const duration = 600; // ระยะเวลาหมุน (ms)
      const intervalTime = 50; // ความเร็วในการเปลี่ยนเลข (ms)
      const startTime = Date.now();

      const spinInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        if (elapsed < duration) {
          // ยังหมุนอยู่: สุ่มเลขมั่วๆ ไปเรื่อยๆ
          let maxVal = 6;
          if (diceState.requiredDice === 'D8') maxVal = 8;
          if (diceState.requiredDice === 'D20') maxVal = 20;
          setDisplayNum(Math.floor(Math.random() * maxVal) + 1);
        } else {
          // หมดเวลาหมุน: หยุดที่เลขจริง (สำคัญ!)
          clearInterval(spinInterval);
          setDisplayNum(diceState.lastResult!); 
          setIsAnimating(false); // หยุด Effect เบลอ
        }
      }, intervalTime);

      // --- PHASE 2: Auto Close ---
      // โชว์ผลค้างไว้ 3 วินาที แล้วสั่งปิด
      const closeTimer = setTimeout(() => {
        closeDiceUI(); 
      }, 3600); // 600ms (หมุน) + 3000ms (โชว์)

      return () => {
        clearInterval(spinInterval);
        clearTimeout(closeTimer);
      };
    }
  }, [diceState.isShowingResult, diceState.lastResult, diceState.requiredDice, closeDiceUI])

  // ถ้า Store บอกว่าไม่ได้โชว์ผล ก็ไม่ต้อง Render อะไรเลย
  if (!diceState.isShowingResult) return null;

  // --- Style Helpers ---
  const getShapeClasses = (type: DiceType) => {
    switch (type) {
      case 'D6': // สี่เหลี่ยม
        return 'bg-cyan-500 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.6)] aspect-square';
      case 'D8': // ข้าวหลามตัด
        return 'bg-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.6)] [clip-path:polygon(50%_0%,_100%_25%,_100%_75%,_50%_100%,_0%_75%,_0%_25%)] scale-110 aspect-square';
      case 'D20': // หกเหลี่ยม
        return 'bg-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.6)] [clip-path:polygon(25%_0%,_75%_0%,_100%_50%,_75%_100%,_25%_100%,_0%_50%)] scale-110 aspect-square';
      default: 
        return 'bg-gray-500 rounded-full aspect-square';
    }
  }

  const getLabel = (type: DiceType) => {
      switch (type) {
          case 'D6': return 'D6 Check';
          case 'D8': return 'D8 Check';
          case 'D20': return 'D20 Check';
          default: return 'Result';
      }
  }

  return (
    <div className="fixed top-24 left-0 right-0 z-[100] flex flex-col items-center justify-start pointer-events-none animate-bounce-in">
      
      {/* Shape Container */}
      <div className={`
        relative flex items-center justify-center
        w-32 h-32 transition-all duration-300
        ${getShapeClasses(diceState.requiredDice)}
      `}>
        {/* Depth Shadow */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-black/10 pointer-events-none" />
        
        {/* Number Display */}
        <span className={`
            font-black text-6xl text-white drop-shadow-md z-10
            ${isAnimating ? 'blur-[1px] opacity-90' : 'scale-125 transition-transform duration-200'}
        `}>
          {displayNum}
        </span>
      </div>

      {/* Label Badge */}
      <div className="mt-4 bg-black/80 backdrop-blur-md border border-white/20 text-white px-6 py-2 rounded-full font-bold text-sm tracking-widest uppercase shadow-xl">
         {getLabel(diceState.requiredDice)}
      </div>
    </div>
  )
}